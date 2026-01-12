import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Send, MapPin, RefreshCw, Package, ClipboardCheck, 
  AlertTriangle, Users, Megaphone, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Send;
  color: string;
  action: () => void;
}

export const QuickActions = () => {
  const navigate = useNavigate();
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !currentWorkspaceId) return;
    
    setSending(true);
    try {
      // Create a note entry as broadcast record
      const { error } = await supabase
        .from('notes')
        .insert({
          content: broadcastMessage,
          note_type: 'broadcast',
          workspace_id: currentWorkspaceId,
          is_private: false,
        });

      if (error) throw error;

      toast({
        title: "Broadcast sent",
        description: "Your message has been sent to all agents",
      });
      setBroadcastMessage("");
      setBroadcastOpen(false);
    } catch (error: any) {
      toast({
        title: "Error sending broadcast",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'broadcast',
      title: 'Send Broadcast',
      description: 'Message all active agents',
      icon: Megaphone,
      color: 'bg-blue-500',
      action: () => setBroadcastOpen(true),
    },
    {
      id: 'refresh-locations',
      title: 'Request Locations',
      description: 'Get latest agent positions',
      icon: MapPin,
      color: 'bg-green-500',
      action: () => {
        toast({
          title: "Location request sent",
          description: "Agents will update their locations shortly",
        });
      },
    },
    {
      id: 'approve-plans',
      title: 'Approve Plans',
      description: 'Review pending daily plans',
      icon: ClipboardCheck,
      color: 'bg-purple-500',
      action: () => navigate('/supervisor/daily-plan-approval'),
    },
    {
      id: 'check-inventory',
      title: 'Quick Inventory',
      description: 'View stock levels',
      icon: Package,
      color: 'bg-orange-500',
      action: () => navigate('/supervisor/inventory-management'),
    },
    {
      id: 'report-incident',
      title: 'Report Incident',
      description: 'Log an urgent issue',
      icon: AlertTriangle,
      color: 'bg-red-500',
      action: () => navigate('/supervisor/incident-reporting'),
    },
    {
      id: 'view-agents',
      title: 'Agent Tracking',
      description: 'See all agent statuses',
      icon: Users,
      color: 'bg-teal-500',
      action: () => navigate('/supervisor/agent-tracking'),
    },
  ];

  return (
    <SupervisorMobileLayout currentPage="quick-actions">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-full">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quick Actions</h1>
            <p className="text-sm opacity-90">Common tasks at your fingertips</p>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all active:scale-95"
                onClick={action.action}
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Send Broadcast
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message to all agents..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This message will be visible to all active agents in your workspace.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBroadcast} 
              disabled={!broadcastMessage.trim() || sending}
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupervisorMobileLayout>
  );
};
