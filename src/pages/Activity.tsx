import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Activity as ActivityIcon, MapPin, Clock } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

interface AgentActivity {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_email: string;
  status: string;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
}

type FilterType = 'all' | 'active' | 'inactive';

export const Activity = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [allAgents, setAllAgents] = useState<string[]>([]);
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchActivities();
    }
  }, [currentWorkspaceId]);

  const fetchActivities = async () => {
    if (!currentWorkspaceId) return;
    
    try {
      setLoading(true);

      // First get users in current workspace
      const { data: workspaceUsers, error: workspaceUsersError } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId);

      if (workspaceUsersError) throw workspaceUsersError;

      const userIds = workspaceUsers?.map(u => u.user_id) || [];

      // Then get agent details from user_roles
      const { data: agents, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', userIds)
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      const agentIds = agents?.map(a => a.user_id) || [];
      setAllAgents(agentIds);

      // Fetch recent status logs
      const { data: statusLogs, error: statusError } = await supabase
        .from('agent_status_log')
        .select('id, agent_id, status, timestamp, location_lat, location_lng')
        .in('agent_id', agentIds)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (statusError) throw statusError;

      // Find agents who have checked in today
      const today = new Date().toISOString().split('T')[0];
      const checkedInAgents = new Set(
        statusLogs
          ?.filter(log => 
            log.status === 'checked_in' && 
            new Date(log.timestamp).toISOString().split('T')[0] === today
          )
          .map(log => log.agent_id) || []
      );
      setActiveAgentIds(Array.from(checkedInAgents));

      // Create agent map
      const agentMap = new Map(
        agents?.map(a => [a.user_id, { name: a.display_name || a.email || 'Unknown', email: a.email || '' }]) || []
      );

      // Build activities for all agents
      const activitiesList: AgentActivity[] = (statusLogs || []).map(log => {
        const agent = agentMap.get(log.agent_id) || { name: 'Unknown', email: '' };
        return {
          id: log.id,
          agent_id: log.agent_id,
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
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFilteredActivities = () => {
    if (filter === 'all') {
      return activities;
    }
    if (filter === 'active') {
      // Show activities only from agents who checked in today
      return activities.filter(activity => activeAgentIds.includes(activity.agent_id));
    }
    if (filter === 'inactive') {
      // Show activities only from agents who have NOT checked in today
      return activities.filter(activity => !activeAgentIds.includes(activity.agent_id));
    }
    return activities;
  };

  return (
    <MobileLayout currentPage="more">
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

      <div className="p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({allAgents.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active ({activeAgentIds.length})
          </Button>
          <Button
            variant={filter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('inactive')}
          >
            Inactive ({allAgents.length - activeAgentIds.length})
          </Button>
        </div>

        {getFilteredActivities().map((activity) => (
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

        {getFilteredActivities().length === 0 && !loading && (
          <Card className="p-8 text-center">
            <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No recent activities</p>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};
