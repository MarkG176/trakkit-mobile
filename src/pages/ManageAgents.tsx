import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      // Get Capwell workspace ID
      const { data: capwellWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('name', 'Capwell')
        .single();

      if (workspaceError) throw workspaceError;

      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, display_name, role_title, location, years_experience, rating, email')
        .eq('workspace_id', capwellWorkspace.id)
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
      <SupervisorMobileLayout currentPage="more">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SupervisorMobileLayout>
    );
  }

  return (
    <SupervisorMobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Manage Agents</h1>
        <p className="text-sm opacity-90">Capwell workspace agents</p>
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
            <p className="text-muted-foreground">No agents found in Capwell workspace</p>
          </div>
        )}
      </div>
    </SupervisorMobileLayout>
  );
};
