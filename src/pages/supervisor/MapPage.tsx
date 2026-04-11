import { useState, useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";

const defaultCenter = { lat: -1.2921, lng: 36.8219 }; // Nairobi

interface AgentLocation {
  agent_id: string;
  agent_display_name: string | null;
  status: string;
  timestamp: string;
  location_lat: number;
  location_lng: number;
  selfie_url: string | null;
}

type DatePreset = "today" | "week" | "month" | "custom";

export const MapPage = () => {
  const { currentWorkspaceId } = useWorkspace();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [preset, setPreset] = useState<DatePreset>("today");
  const [selectedAgent, setSelectedAgent] = useState<AgentLocation | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["map-agent-locations", currentWorkspaceId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];

      const { data, error } = await supabase
        .from("agent_status_log")
        .select("agent_id, agent_display_name, status, timestamp, location_lat, location_lng, selfie_url")
        .eq("workspace_id", currentWorkspaceId)
        .not("location_lat", "is", null)
        .not("location_lng", "is", null)
        .gte("timestamp", startOfDay(dateRange.from).toISOString())
        .lte("timestamp", endOfDay(dateRange.to).toISOString())
        .order("timestamp", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Dedupe: latest per agent
      const seen = new Set<string>();
      return (data || []).filter((loc) => {
        if (seen.has(loc.agent_id)) return false;
        seen.add(loc.agent_id);
        return true;
      }) as AgentLocation[];
    },
    enabled: !!currentWorkspaceId,
  });

  const applyPreset = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    switch (p) {
      case "today":
        setDateRange({ from: now, to: now });
        break;
      case "week":
        setDateRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: now });
        break;
      case "month":
        setDateRange({ from: startOfMonth(now), to: now });
        break;
    }
  };

  const mapCenter = useMemo(() => {
    if (locations.length === 0) return defaultCenter;
    const avgLat = locations.reduce((s, l) => s + l.location_lat, 0) / locations.length;
    const avgLng = locations.reduce((s, l) => s + l.location_lng, 0) / locations.length;
    return { lat: avgLat, lng: avgLng };
  }, [locations]);

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Agent Map
            </h1>
            <p className="text-sm opacity-90">{locations.length} agent{locations.length !== 1 ? "s" : ""} on map</p>
          </div>
        </div>
        <WorkspaceSwitcher className="w-full" />
      </div>

      {/* Date Filters */}
      <div className="p-3 flex gap-2 flex-wrap items-center border-b border-border">
        {(["today", "week", "month"] as DatePreset[]).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={preset === p ? "default" : "outline"}
            onClick={() => applyPreset(p)}
            className="capitalize"
          >
            {p === "week" ? "This Week" : p === "month" ? "This Month" : "Today"}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
              <CalendarIcon className="w-4 h-4 mr-1" />
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from) {
                  setPreset("custom");
                  setDateRange({ from: range.from, to: range.to || range.from });
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <Badge variant="secondary" className="ml-auto">
          {format(dateRange.from, "MMM d")}
          {dateRange.from.toDateString() !== dateRange.to.toDateString() && ` – ${format(dateRange.to, "MMM d")}`}
        </Badge>
      </div>

      {/* Map */}
      <div className="flex-1" style={{ minHeight: "calc(100vh - 280px)" }}>
        {isLoaded ? (
          <GoogleMap mapContainerStyle={{ width: "100%", height: "calc(100vh - 280px)" }} center={mapCenter} zoom={locations.length > 0 ? 12 : 10}>
            {locations.map((loc) => (
              <Marker
                key={loc.agent_id}
                position={{ lat: loc.location_lat, lng: loc.location_lng }}
                title={loc.agent_display_name || "Agent"}
                onClick={() => setSelectedAgent(loc)}
              />
            ))}
            {selectedAgent && (
              <InfoWindow
                position={{ lat: selectedAgent.location_lat, lng: selectedAgent.location_lng }}
                onCloseClick={() => setSelectedAgent(null)}
              >
                <div className="p-1 min-w-[160px]">
                  <p className="font-semibold text-sm">{selectedAgent.agent_display_name || "Agent"}</p>
                  <p className="text-xs text-gray-600 capitalize">{selectedAgent.status.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-500 mt-1">{format(new Date(selectedAgent.timestamp), "MMM d, h:mm a")}</p>
                  {selectedAgent.selfie_url && (
                    <img src={selectedAgent.selfie_url} alt="Selfie" className="w-16 h-16 rounded mt-2 object-cover" />
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading map...</div>
        )}
      </div>

      <SupervisorBottomNav />
    </div>
  );
};
