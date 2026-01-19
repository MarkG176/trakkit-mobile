import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "@/hooks/useWorkspace";

interface AgentStatus {
  id: string;
  name: string;
  email: string;
  status: string;
  location: { lat: number; lng: number } | null;
  lastUpdate: string;
  batteryLevel: number;
  todayStats: {
    sales: number;
    surveys: number;
  };
}

export const AgentTracking = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchAgentStatuses();
    }
  }, [currentWorkspaceId]);

  const fetchAgentStatuses = async () => {
    try {
      if (!currentWorkspaceId) return;

      // Get agents in the workspace
      const { data: workspaceUsers, error: workspaceUsersError } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      if (workspaceUsersError) throw workspaceUsersError;

      const userIds = workspaceUsers?.map(u => u.user_id) || [];
      if (userIds.length === 0) {
        setAgents([]);
        return;
      }

      // Get agents from user_roles
      const { data: agents, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('user_id', userIds)
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      const agentIds = agents?.map(a => a.user_id) || [];
      if (agentIds.length === 0) {
        setAgents([]);
        return;
      }

      // Fetch status logs for workspace agents
      const { data: statusLogs, error } = await supabase
        .from("agent_status_log")
        .select(`
          agent_id,
          status,
          location_lat,
          location_lng,
          timestamp
        `)
        .eq("workspace_id", currentWorkspaceId)
        .in("agent_id", agentIds)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      // Get unique agents with their latest status
      const agentMap = new Map();
      statusLogs?.forEach((log) => {
        if (!agentMap.has(log.agent_id)) {
          agentMap.set(log.agent_id, log);
        }
      });

      // Fetch agent details and stats
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, display_name, email")
        .in("user_id", agentIds);

      // Fetch battery status
      const { data: batteryStatus } = await supabase
        .from("agent_battery_status")
        .select("agent_id, battery_level")
        .eq("workspace_id", currentWorkspaceId)
        .in("agent_id", agentIds);

      // Fetch today's stats
      const today = new Date().toISOString().split("T")[0];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const { data: salesData } = await supabase
        .from("daily_sales_tracking")
        .select("agent_id, quantity_sold")
        .eq("workspace_id", currentWorkspaceId)
        .in("agent_id", agentIds)
        .eq("work_date", today);

      const { data: surveyData } = await supabase
        .from("interactions")
        .select("agent_id")
        .eq("workspace_id", currentWorkspaceId)
        .eq("interaction_type", "survey")
        .in("agent_id", agentIds)
        .gte("timestamp", todayStart.toISOString())
        .lte("timestamp", todayEnd.toISOString());

      const agentStatuses: AgentStatus[] = userRoles?.map((user) => {
        const statusLog = agentMap.get(user.user_id);
        const battery = batteryStatus?.find((b) => b.agent_id === user.user_id);
        const sales = salesData?.filter((s) => s.agent_id === user.user_id);
        const surveys = surveyData?.filter((s) => s.agent_id === user.user_id);

        return {
          id: user.user_id,
          name: user.display_name || user.email,
          email: user.email,
          status: statusLog?.status || "unknown",
          location: statusLog?.location_lat
            ? { lat: statusLog.location_lat, lng: statusLog.location_lng }
            : null,
          lastUpdate: statusLog?.timestamp || "",
          batteryLevel: battery?.battery_level || 0,
          todayStats: {
            sales: sales?.reduce((sum, s) => sum + s.quantity_sold, 0) || 0,
            surveys: surveys?.length || 0,
          },
        };
      }) || [];

      setAgents(agentStatuses);
    } catch (error: any) {
      toast({
        title: "Error loading agents",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      checked_in: "default",
      lunch: "secondary",
      checked_out: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <SupervisorMobileLayout currentPage="agent-tracking">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Agent Activity</h1>
            <p className="text-sm opacity-90">Real-time agent tracking</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/90"
            />
          </div>
        </div>
        
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchAgentStatuses} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="text-xs"
          >
            All
          </Button>
          <Button
            variant={filterStatus === "checked_in" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("checked_in")}
            className="text-xs"
          >
            Active
          </Button>
          <Button
            variant={filterStatus === "lunch" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("lunch")}
            className="text-xs"
          >
            On Break
          </Button>
        </div>

        <div className="space-y-3">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                    {getStatusBadge(agent.status)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {agent.email}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {agent.location
                          ? `${agent.location.lat.toFixed(4)}, ${agent.location.lng.toFixed(4)}`
                          : "No location"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-muted rounded px-2 py-1">
                      <p className="text-xs text-muted-foreground">Sales</p>
                      <p className="text-sm font-semibold">{agent.todayStats.sales}</p>
                    </div>
                    <div className="bg-muted rounded px-2 py-1">
                      <p className="text-xs text-muted-foreground">Battery</p>
                      <p className="text-sm font-semibold">{agent.batteryLevel}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SupervisorMobileLayout>
  );
};
