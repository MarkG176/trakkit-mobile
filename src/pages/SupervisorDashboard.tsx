import { useState, useEffect, useCallback, useRef } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ShoppingCart, Gift, ClipboardCheck, LogIn, LogOut, Coffee, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";

interface Notification {
  id: string;
  type: 'check_in' | 'check_out' | 'sale' | 'giveaway' | 'survey' | 'break_start' | 'break_end';
  agentName: string;
  message: string;
  timestamp: Date;
  data?: any;
}

const notificationConfig = {
  check_in: { icon: LogIn, color: 'bg-green-500', label: 'Check In' },
  check_out: { icon: LogOut, color: 'bg-red-500', label: 'Check Out' },
  sale: { icon: ShoppingCart, color: 'bg-blue-500', label: 'Sale' },
  giveaway: { icon: Gift, color: 'bg-purple-500', label: 'Giveaway' },
  survey: { icon: ClipboardCheck, color: 'bg-orange-500', label: 'Survey' },
  break_start: { icon: Coffee, color: 'bg-yellow-500', label: 'Break Started' },
  break_end: { icon: Coffee, color: 'bg-green-500', label: 'Break Ended' },
};

export const SupervisorDashboard = () => {
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const agentCacheRef = useRef<Map<string, string>>(new Map());

  // Fetch agent name from cache or database
  const getAgentName = useCallback(async (agentId: string): Promise<string> => {
    if (agentCacheRef.current.has(agentId)) {
      return agentCacheRef.current.get(agentId)!;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('display_name, email')
      .eq('user_id', agentId)
      .single();

    const name = data?.display_name || data?.email || 'Unknown Agent';
    agentCacheRef.current.set(agentId, name);
    return name;
  }, []);

  // Add notification and show toast - using ref to avoid stale closures
  const addNotificationRef = useRef<(notification: Notification) => void>();
  addNotificationRef.current = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 100));
    
    const config = notificationConfig[notification.type];
    toast({
      title: `${config.label}: ${notification.agentName}`,
      description: notification.message,
    });
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!currentWorkspaceId) return;

    // Subscribe to agent status changes (check-in, check-out, breaks)
    const statusChannel = supabase
      .channel('supervisor-status')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_status_log',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        async (payload) => {
          const record = payload.new as any;
          const agentName = record.agent_display_name || await getAgentName(record.agent_id);
          
          let type: Notification['type'] = 'check_in';
          let message = '';
          
          switch (record.status) {
            case 'checked_in':
              type = 'check_in';
              message = `${agentName} has checked in`;
              break;
            case 'checked_out':
              type = 'check_out';
              message = `${agentName} has checked out`;
              break;
            case 'lunch':
            case 'break':
              type = 'break_start';
              message = `${agentName} started a break`;
              break;
            default:
              message = `${agentName} status: ${record.status}`;
          }

          addNotificationRef.current?.({
            id: record.id,
            type,
            agentName,
            message,
            timestamp: new Date(record.timestamp),
            data: record,
          });
        }
      )
      .subscribe();

    // Subscribe to sales
    const salesChannel = supabase
      .channel('supervisor-sales')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sale_items',
        },
        async (payload) => {
          const record = payload.new as any;
          const agentName = await getAgentName(record.agent_id);
          
          // Get product name
          const { data: variant } = await supabase
            .from('product_variants')
            .select('name')
            .eq('id', record.product_variant_id)
            .single();

          const productName = variant?.name || 'Product';
          const message = `${agentName} sold ${record.quantity}x ${productName}`;

          addNotificationRef.current?.({
            id: record.id,
            type: 'sale',
            agentName,
            message,
            timestamp: new Date(record.created_at),
            data: record,
          });
        }
      )
      .subscribe();

    // Subscribe to giveaways
    const giveawayChannel = supabase
      .channel('supervisor-giveaways')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'giveaways',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        async (payload) => {
          const record = payload.new as any;
          const agentName = await getAgentName(record.agent_id);
          
          const message = `${agentName} gave away ${record.total_items} items`;

          addNotificationRef.current?.({
            id: record.id,
            type: 'giveaway',
            agentName,
            message,
            timestamp: new Date(record.created_at),
            data: record,
          });
        }
      )
      .subscribe();

    // Subscribe to surveys/interactions
    const interactionChannel = supabase
      .channel('supervisor-interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interactions',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        async (payload) => {
          const record = payload.new as any;
          if (record.interaction_type !== 'survey') return;
          
          const agentName = await getAgentName(record.agent_id || '');
          const message = `${agentName} completed a survey`;

          addNotificationRef.current?.({
            id: record.id,
            type: 'survey',
            agentName,
            message,
            timestamp: new Date(record.created_at),
            data: record,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(giveawayChannel);
      supabase.removeChannel(interactionChannel);
    };
  }, [currentWorkspaceId, getAgentName]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Supervisor Dashboard</h1>
            <p className="text-sm opacity-90">Real-time agent activity</p>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <Badge variant="secondary" className="bg-white/20">
              {notifications.length}
            </Badge>
          </div>
        </div>
        <div className="mt-3">
          <WorkspaceSwitcher className="w-full" />
        </div>
      </div>

      {/* Notification Log */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Activity Log</h2>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearNotifications}
              className="text-muted-foreground"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Notifications will appear here when agents perform actions
            </p>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-3">
              {notifications.map((notification) => {
                const config = notificationConfig[notification.type];
                const Icon = config.icon;

                return (
                  <Card key={notification.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`${config.color} rounded-full p-2 shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{notification.agentName}</span>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <SupervisorBottomNav />
    </div>
  );
};
