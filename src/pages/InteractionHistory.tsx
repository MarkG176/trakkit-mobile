import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, ShoppingCart, ClipboardList, Gift, MessageSquare, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type InteractionRow = {
  id: string;
  created_at?: string;
  interaction_type: string;
  client_name?: string;
  has_recording?: boolean;
  points?: number;
  sentiment?: number;
  notes?: string;
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data } = await supabase
          .from('interactions')
          .select('*, agent_tasks!inner(*)')
          .eq('agent_tasks.agent_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        setInteractions((data as any) || []);
      } catch (err) {
        console.error('Failed to fetch interactions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInteractions();
  }, [user]);

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/more")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">Interaction History</h1>
        </div>
        <p className="text-sm opacity-90">All your recorded interactions and engagements</p>
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
                    {interaction.has_recording && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Mic size={14} />
                        <Play size={14} />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-black mb-1">{interaction.client_name || 'Client'}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{interaction.created_at ? new Date(interaction.created_at).toLocaleDateString() : ''}</span>
                    <span>{interaction.created_at ? new Date(interaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    {typeof interaction.points === 'number' && (
                      <span className="text-blue-600">+{interaction.points} pts</span>
                    )}
                  </div>
                  
                  {interaction.notes && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {interaction.notes}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-gray-500">Sentiment:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`w-3 h-3 rounded-full ${
                          star <= (interaction.sentiment || 0)
                            ? "bg-yellow-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {interactions.length === 0 && !loading && (
          <div className="text-center py-8">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No interactions yet</h3>
            <p className="text-gray-500">Start logging your interactions to see them here</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};