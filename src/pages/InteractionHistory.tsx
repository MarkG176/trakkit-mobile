import { useEffect, useState } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, ShoppingCart, ClipboardList, Gift, MessageSquare, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "@/hooks/useWorkspace";

type InteractionRow = {
  id: string;
  created_at?: string;
  interaction_type: string;
  customer_name?: string;
  customer_phone?: string;
  agent_name?: string;
  agent_email?: string;
  metadata?: any;
};

const getInteractionIcon = (type: string) => {
  switch (type) {
    case "sale":
      return <ShoppingCart size={20} className="text-green-600" />;
    case "survey":
      return <ClipboardList size={20} className="text-blue-600" />;
    case "giveaway":
      return <Gift size={20} className="text-purple-600" />;
    case "interaction":
      return <MessageSquare size={20} className="text-gray-600" />;
    default:
      return <MessageSquare size={20} className="text-gray-600" />;
  }
};

const getInteractionTypeLabel = (type: string) => {
  switch (type) {
    case "sale":
      return "Sale";
    case "survey": 
      return "Survey";
    case "giveaway":
      return "Giveaway";
    case "interaction":
      return "Interaction";
    default:
      return "Unknown";
  }
};

const getInteractionTypeColor = (type: string) => {
  switch (type) {
    case "sale":
      return "bg-green-100 text-green-800";
    case "survey":
      return "bg-primary-light text-primary";
    case "giveaway":
      return "bg-accent text-accent-foreground";
    case "interaction":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const InteractionHistory = () => {
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchInteractions();
    }
  }, [currentWorkspaceId]);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      if (!currentWorkspaceId) return;

      // Fetch interactions from current workspace
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*, agent_tasks!inner(agent_id)')
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (interactionsError) throw interactionsError;

      // Get agent details
      const agentIds = Array.from(new Set(
        interactionsData?.map(i => (i as any).agent_tasks?.agent_id).filter(Boolean) || []
      ));

      const { data: agents, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', agentIds);

      if (agentsError) throw agentsError;

      const agentMap = new Map(
        agents?.map(a => [a.user_id, { name: a.display_name || a.email || 'Unknown', email: a.email || '' }]) || []
      );

      // Map interactions with agent data
      const mappedInteractions: InteractionRow[] = (interactionsData || []).map(interaction => {
        const agentId = (interaction as any).agent_tasks?.agent_id;
        const agent = agentMap.get(agentId) || { name: 'Unknown', email: '' };
        return {
          id: interaction.id,
          created_at: interaction.created_at,
          interaction_type: interaction.interaction_type || 'interaction',
          customer_name: interaction.customer_name,
          customer_phone: interaction.customer_phone,
          agent_name: agent.name,
          agent_email: agent.email,
          metadata: interaction.metadata,
        };
      });

      setInteractions(mappedInteractions);
    } catch (err) {
      console.error('Failed to fetch interactions', err);
      toast({
        title: "Error",
        description: "Failed to load interaction history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupervisorMobileLayout currentPage="more">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Interaction History</h1>
            <p className="text-sm opacity-90">All recorded interactions in this workspace</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchInteractions} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {interactions.map((interaction) => (
          <Card key={interaction.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getInteractionIcon(interaction.interaction_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getInteractionTypeColor(interaction.interaction_type)}>
                      {getInteractionTypeLabel(interaction.interaction_type)}
                    </Badge>
                  </div>
                  
                  <h3 className="font-medium text-black mb-1">
                    {interaction.customer_name || 'Customer'}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Agent: {interaction.agent_name}</p>
                    {interaction.customer_phone && <p>Phone: {interaction.customer_phone}</p>}
                    <p>
                      {interaction.created_at ? new Date(interaction.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {interactions.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No interactions yet</h3>
            <p className="text-gray-500">No interactions have been logged in this workspace</p>
          </Card>
        )}
      </div>
    </SupervisorMobileLayout>
  );
};