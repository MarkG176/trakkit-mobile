// [CMP-26edea] ManageAgents — supervisor agent management
import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "@/hooks/useWorkspace";

interface Agent {
  user_id: string;
  display_name: string;
  role_title: string | null;
  location: string | null;
  years_experience: number | null;
  rating: number | null;
  email: string;
}

export const ManageAgents = () => {
  const { currentWorkspaceId } = useWorkspace();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, [currentWorkspaceId]);

  const fetchAgents = async () => {
    if (!currentWorkspaceId) {
      setAgents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: workspaceUsers, error: workspaceUsersError } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      if (workspaceUsersError) throw workspaceUsersError;

      const userIds = workspaceUsers?.map(u => u.user_id) || [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, display_name, role_title, location, years_experience, rating, email')
        .in('user_id', userIds)
        .eq('workspace_id', currentWorkspaceId)
        .eq('role', 'agent')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <MobileLayout currentPage="more">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Manage Agents</h1>
        <p className="text-sm opacity-90">Agents in the selected workspace</p>
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchAgents} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {agents.map((agent) => (
          <Card key={agent.user_id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedAgents.has(agent.user_id)}
                onCheckedChange={() => toggleAgent(agent.user_id)}
                className="mt-1"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {agent.display_name || agent.email}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {agent.role_title || 'Field Agent'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">
                      {agent.rating ? agent.rating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {agent.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{agent.location}</span>
                    </div>
                  )}
                  
                  {agent.years_experience !== null && agent.years_experience > 0 && (
                    <span>
                      {agent.years_experience} {agent.years_experience === 1 ? 'year' : 'years'} experience
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {agents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No agents found in this workspace</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
