import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity as ActivityIcon, MapPin, Clock } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

interface AgentActivity {
  id: string;
  agent_name: string;
  agent_email: string;
  status: string;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
}

export const Activity = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Get Capwell workspace ID
      const { data: capwellWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('name', 'Capwell')
        .single();

      if (workspaceError) throw workspaceError;

      // Fetch agents in Capwell workspace
      const { data: agents, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .eq('workspace_id', capwellWorkspace.id)
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      const agentIds = agents?.map(a => a.user_id) || [];

      // Fetch recent status logs
      const { data: statusLogs, error: statusError } = await supabase
        .from('agent_status_log')
        .select('id, agent_id, status, timestamp, location_lat, location_lng')
        .in('agent_id', agentIds)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (statusError) throw statusError;

      // Create agent map
      const agentMap = new Map(
        agents?.map(a => [a.user_id, { name: a.display_name || a.email || 'Unknown', email: a.email || '' }]) || []
      );

      // Build activities
      const activitiesList: AgentActivity[] = (statusLogs || []).map(log => {
        const agent = agentMap.get(log.agent_id) || { name: 'Unknown', email: '' };
        return {
          id: log.id,
          agent_name: agent.name,
          agent_email: agent.email,
          status: log.status,
          timestamp: log.timestamp,
          location_lat: log.location_lat,
          location_lng: log.location_lng,
        };
      });

      setActivities(activitiesList);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge variant="default">Checked In</Badge>;
      case 'checked_out':
        return <Badge variant="secondary">Checked Out</Badge>;
      case 'lunch':
        return <Badge variant="outline">On Break</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <SupervisorMobileLayout currentPage="more">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Activity Feed</h1>
            <p className="text-sm opacity-90">Recent agent activities</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <ActivityIcon className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchActivities} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium">{activity.agent_name}</p>
                <p className="text-sm text-muted-foreground">{activity.agent_email}</p>
              </div>
              {getStatusBadge(activity.status)}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(activity.timestamp).toLocaleString()}</span>
              </div>
              {activity.location_lat && activity.location_lng && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {activity.location_lat.toFixed(2)}, {activity.location_lng.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}

        {activities.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No recent activities</p>
          </Card>
        )}
      </div>
    </SupervisorMobileLayout>
  );
};
