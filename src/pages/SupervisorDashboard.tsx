// [CMP-64d2b5] SupervisorDashboard — supervisor dashboard root
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, CalendarIcon, Search, ChevronLeft, ChevronRight, Image as ImageIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useAgentActivities, useGalleryImages, useMostRecentActivityDate, useWorkspaceTeams, AgentActivity } from "@/hooks/useAgentActivity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { UserDetailSheet } from "@/components/supervisor/UserDetailSheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getThumbnailUrl, thumbnailFallback } from "@/utils/imageTransform";

const statusConfig: Record<string, { color: string; label: string }> = {
  checked_in: { color: "bg-green-500", label: "Checked In" },
  checked_out: { color: "bg-red-500", label: "Checked Out" },
  set_location: { color: "bg-blue-500", label: "Set Location" },
  lunch: { color: "bg-yellow-500", label: "On Break" },
  break: { color: "bg-yellow-500", label: "On Break" },
  back_from_break: { color: "bg-green-500", label: "Back" },
};

export const SupervisorDashboard = () => {
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: mostRecentDate } = useMostRecentActivityDate(currentWorkspaceId);
  const { data: teams = [] } = useWorkspaceTeams(currentWorkspaceId);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterTeamId, setFilterTeamId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);

  useEffect(() => {
    if (mostRecentDate && !filterDate) {
      setFilterDate(mostRecentDate);
    }
  }, [mostRecentDate, filterDate]);

  const { data: activitiesResult, isLoading } = useAgentActivities(
    currentWorkspaceId, page, filterDate, searchQuery, filterTeamId
  );
  const activities = activitiesResult?.data || [];
  const totalCount = activitiesResult?.count || 0;
  const totalPages = Math.ceil(totalCount / 50);

  const { data: galleryImages = [] } = useGalleryImages(currentWorkspaceId, filterDate);

  const isToday = filterDate === new Date().toISOString().split("T")[0];

  // Real-time subscription for today. A burst of inserts (busy team checking in
  // at once) is coalesced into a single refetch via a short debounce instead of
  // invalidating the 50-row feed + 100-image gallery on every event.
  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!currentWorkspaceId || !isToday) return;

    const scheduleInvalidate = () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
      invalidateTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["agent-activities"] });
        queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      }, 1500);
    };

    const channel = supabase
      .channel("supervisor-status-live")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "agent_status_log",
        filter: `workspace_id=eq.${currentWorkspaceId}`,
      }, (payload) => {
        const record = payload.new as any;
        const name = record.agent_display_name || "Agent";
        const cfg = statusConfig[record.status] || { label: record.status };
        toast({ title: `${cfg.label}: ${name}`, description: `${name} updated status` });
        scheduleInvalidate();
      })
      .subscribe();

    return () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, isToday, toast, queryClient]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFilterDate(format(date, "yyyy-MM-dd"));
      setPage(0);
    }
  };

  const handleAgentClick = useCallback((id: string, name: string | null) => {
    setSelectedAgentId(id);
    setSelectedAgentName(name);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Supervisor Dashboard</h1>
            <p className="text-sm opacity-90">Agent activity log</p>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="focus:outline-none">
                  <Avatar className="h-9 w-9 border-2 border-white/30">
                    <AvatarFallback className="bg-white/20 text-primary-foreground text-sm font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || "S"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <p className="text-xs text-muted-foreground px-2 py-1 truncate">{user?.email}</p>
                <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <WorkspaceSwitcher className="w-full" />
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <CalendarIcon className="w-4 h-4" />
                {filterDate ? format(new Date(filterDate + "T12:00:00"), "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filterDate ? new Date(filterDate + "T12:00:00") : undefined}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
          <Button variant={isToday ? "default" : "outline"} size="sm" onClick={() => { setFilterDate(new Date().toISOString().split("T")[0]); setPage(0); }}>
            Today
          </Button>
          <Badge variant="secondary" className="ml-auto">{totalCount} entries</Badge>
        </div>

        {/* Team filter */}
        {teams.length > 0 && (
          <Select value={filterTeamId || "all"} onValueChange={(v) => { setFilterTeamId(v === "all" ? null : v); setPage(0); }}>
            <SelectTrigger className="h-9">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="All Teams" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or outlet..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        <Tabs defaultValue="feed">
          <TabsList className="w-full">
            <TabsTrigger value="feed" className="flex-1">Activity Feed</TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1">
              Selfies ({galleryImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-3">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading activities...</p>
              </Card>
            ) : activities.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No activity found</p>
                <p className="text-sm text-muted-foreground mt-1">Try selecting a different date</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <ActivityFeedCard
                    key={activity.id}
                    activity={activity}
                    onImageClick={setSelectedImage}
                    onAgentClick={handleAgentClick}
                  />
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 pb-4">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-3">
            {galleryImages.length === 0 ? (
              <Card className="p-8 text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No selfies for this date</p>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group" onClick={() => setSelectedImage(img.selfie_url)}>
                    <img
                      src={getThumbnailUrl(img.selfie_url, { width: 200 })}
                      alt={img.agent_display_name || "Selfie"}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => thumbnailFallback(e, img.selfie_url!)}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                      {img.agent_display_name || "Agent"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-md p-2">
          {selectedImage && <img src={selectedImage} alt="Full size" className="w-full rounded" />}
        </DialogContent>
      </Dialog>

      {selectedAgentId && (
        <UserDetailSheet
          open={!!selectedAgentId}
          onOpenChange={(open) => { if (!open) { setSelectedAgentId(null); setSelectedAgentName(null); } }}
          userId={selectedAgentId}
          displayName={selectedAgentName}
          email=""
          role="agent"
        />
      )}

      <SupervisorBottomNav />
    </div>
  );
};

// Activity feed card component (memoized so unrelated parent re-renders, e.g.
// realtime toasts, don't re-render the whole 50-row feed).
const ActivityFeedCard = memo(function ActivityFeedCard({ activity, onImageClick, onAgentClick }: { activity: AgentActivity; onImageClick: (url: string) => void; onAgentClick?: (agentId: string, name: string | null) => void }) {
  const cfg = statusConfig[activity.status] || { color: "bg-gray-500", label: activity.status };
  const initials = activity.agent_display_name
    ? activity.agent_display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onAgentClick?.(activity.agent_id, activity.agent_display_name)}>
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          {activity.selfie_url && <AvatarImage src={activity.selfie_url} />}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">{activity.agent_display_name || "Unknown Agent"}</p>
            <Badge variant="secondary" className="shrink-0 text-xs">{cfg.label}</Badge>
          </div>

          {activity.store_name && (
            <p className="text-xs text-muted-foreground truncate">🏪 {activity.store_name}</p>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{format(new Date(activity.timestamp), "h:mm a")}</span>
            {activity.location_lat && activity.location_lng && (
              <span className="truncate">
                📍 {Number(activity.location_lat).toFixed(4)}, {Number(activity.location_lng).toFixed(4)}
              </span>
            )}
            {activity.in_range !== null && (
              <Badge variant={activity.in_range ? "default" : "destructive"} className="text-[10px] px-1 py-0">
                {activity.in_range ? "In Range" : "Out of Range"}
              </Badge>
            )}
          </div>

          {activity.distance_from_assigned !== null && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Distance: {Number(activity.distance_from_assigned).toFixed(0)}m from store
            </p>
          )}
        </div>

        {activity.selfie_url && (
          <button onClick={(e) => { e.stopPropagation(); onImageClick(activity.selfie_url!); }} className="shrink-0">
            <img
              src={getThumbnailUrl(activity.selfie_url, { width: 120 })}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-12 h-12 rounded object-cover"
              onError={(e) => thumbnailFallback(e, activity.selfie_url!)}
            />
          </button>
        )}
      </div>
    </Card>
  );
});
