// [CMP-d9d289] Activity — agent activity history list
import { useState, useEffect, useCallback, useMemo } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Activity as ActivityIcon, RefreshCw } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ActivityCard } from "@/components/supervisor/ActivityCard";
import { formatProductName } from "@/utils/formatProductName";

interface ActivityItem {
  id: string;
  type: 'check_in' | 'check_out' | 'sale' | 'giveaway' | 'survey' | 'break_start' | 'break_end';
  agentName: string;
  agentInitials: string;
  timestamp: string;
  location?: string;
  details?: string;
  value?: number;
  imageUrl?: string;
}

type FilterType = 'all' | 'check_ins' | 'sales' | 'giveaways';

export const Activity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchActivities = useCallback(async (showRefresh = false) => {
    if (!currentWorkspaceId) return;

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const allActivities: ActivityItem[] = [];

      // Fetch the three activity sources in parallel instead of sequentially.
      const [statusResult, salesResult, giveawaysResult] = await Promise.all([
        supabase
          .from('agent_status_log')
          .select('id, agent_id, status, timestamp, location_lat, location_lng, selfie_url')
          .eq('workspace_id', currentWorkspaceId)
          .order('timestamp', { ascending: false })
          .limit(30),
        supabase
          .from('interactions')
          .select(`
            id,
            agent_id,
            quantity_sold,
            sale_value,
            created_at,
            latitude,
            longitude,
            product_variants (name, sku)
          `)
          .eq('workspace_id', currentWorkspaceId)
          .eq('interaction_type', 'sale')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('giveaways')
          .select('id, agent_id, total_items, recorded_at, location_lat, location_lng, recipient_name')
          .eq('workspace_id', currentWorkspaceId)
          .order('recorded_at', { ascending: false })
          .limit(20),
      ]);

      const statusLogs = statusResult.data || [];
      const sales = salesResult.data || [];
      const giveaways = giveawaysResult.data || [];

      // Collect every agent id referenced across the three sources, then resolve
      // all display names in a single query (was an N+1 per row before).
      const agentIds = Array.from(
        new Set<string>([
          ...statusLogs.map((l) => l.agent_id),
          ...sales.map((s) => s.agent_id),
          ...giveaways.map((g) => g.agent_id),
        ].filter(Boolean) as string[])
      );

      const agentNameMap = new Map<string, string>();
      if (agentIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, display_name, email')
          .in('user_id', agentIds);

        for (const role of roles || []) {
          agentNameMap.set(role.user_id, role.display_name || role.email || 'Unknown Agent');
        }
      }

      const resolveName = (agentId: string | null | undefined) =>
        (agentId && agentNameMap.get(agentId)) || 'Unknown Agent';

      for (const log of statusLogs) {
        const name = resolveName(log.agent_id);
        let type: ActivityItem['type'] = 'check_in';

        if (log.status === 'checked_out') type = 'check_out';
        else if (log.status === 'lunch' || log.status === 'break') type = 'break_start';

        allActivities.push({
          id: `status-${log.id}`,
          type,
          agentName: name,
          agentInitials: getInitials(name),
          timestamp: log.timestamp,
          location: log.location_lat && log.location_lng 
            ? `${log.location_lat.toFixed(4)}, ${log.location_lng.toFixed(4)}`
            : undefined,
          imageUrl: log.selfie_url || undefined,
        });
      }

      for (const sale of sales) {
        if (!sale.agent_id) continue;
        const name = resolveName(sale.agent_id);
        const pv = (sale.product_variants as any);
        const productName = formatProductName(pv?.name, pv?.sku, 'Product');

        allActivities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          agentName: name,
          agentInitials: getInitials(name),
          timestamp: sale.created_at || new Date().toISOString(),
          details: `Sold ${sale.quantity_sold}x ${productName}`,
          value: sale.sale_value || undefined,
          location: sale.latitude && sale.longitude
            ? `${sale.latitude.toFixed(4)}, ${sale.longitude.toFixed(4)}`
            : undefined,
        });
      }

      for (const giveaway of giveaways) {
        const name = resolveName(giveaway.agent_id);

        allActivities.push({
          id: `giveaway-${giveaway.id}`,
          type: 'giveaway',
          agentName: name,
          agentInitials: getInitials(name),
          timestamp: giveaway.recorded_at,
          details: `Gave ${giveaway.total_items} items${giveaway.recipient_name ? ` to ${giveaway.recipient_name}` : ''}`,
          location: giveaway.location_lat && giveaway.location_lng
            ? `${giveaway.location_lat.toFixed(4)}, ${giveaway.location_lng.toFixed(4)}`
            : undefined,
        });
      }

      // Sort all activities by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWorkspaceId, toast]);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchActivities();
    }
  }, [currentWorkspaceId, fetchActivities]);

  const filteredActivities = useMemo(() => {
    switch (filter) {
      case 'check_ins':
        return activities.filter(a => a.type === 'check_in' || a.type === 'check_out' || a.type === 'break_start' || a.type === 'break_end');
      case 'sales':
        return activities.filter(a => a.type === 'sale');
      case 'giveaways':
        return activities.filter(a => a.type === 'giveaway');
      default:
        return activities;
    }
  }, [activities, filter]);

  return (
    <MobileLayout currentPage="more">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Activity Feed</h1>
            <p className="text-sm opacity-90">Real-time agent activities</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-white/20 backdrop-blur-sm rounded-full"
            onClick={() => fetchActivities(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={() => fetchActivities()} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'check_ins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('check_ins')}
          >
            Check-ins
          </Button>
          <Button
            variant={filter === 'sales' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('sales')}
          >
            Sales
          </Button>
          <Button
            variant={filter === 'giveaways' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('giveaways')}
          >
            Giveaways
          </Button>
        </div>

        {/* Activity list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="space-y-3">
            {filteredActivities.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No activities found</p>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};
