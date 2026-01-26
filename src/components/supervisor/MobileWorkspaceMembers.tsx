import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Users, 
  MapPin, 
  Package, 
  DollarSign, 
  ChevronRight,
  Phone,
  Mail,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WorkspaceMember {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
}

interface MemberDetails {
  teams: string[];
  lastLocation: { lat: number; lng: number; timestamp: string } | null;
  inventory: { name: string; quantity: number }[];
  sales: { units: number; value: number };
}

export const MobileWorkspaceMembers = ({ workspaceId }: { workspaceId: string }) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch workspace members
  const fetchMembers = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_workspaces')
        .select('id, user_id, role, is_active, name, email')
        .eq('workspace_id', workspaceId)
        .eq('is_deleted', false);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchMembers();
  }, [workspaceId]);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.name?.toLowerCase().includes(query) || 
      m.email?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Fetch member details when selected
  const fetchMemberDetails = async (member: WorkspaceMember) => {
    setDetailsLoading(true);
    try {
      // Fetch teams
      const { data: teamData } = await supabase
        .from('team_members')
        .select('teams:teams!team_members_team_id_fkey(name)')
        .eq('agent_id', member.user_id)
        .eq('workspace_id', workspaceId);

      const teams = teamData?.map((t: any) => t.teams?.name).filter(Boolean) || [];

      // Fetch last location
      const { data: locationData } = await supabase
        .from('agent_status_log')
        .select('location_lat, location_lng, timestamp')
        .eq('agent_id', member.user_id)
        .eq('workspace_id', workspaceId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      // Fetch inventory
      const { data: inventoryData } = await supabase
        .from('agent_task_inventory')
        .select('amount_issued, product_variants:product_variant_id(name)')
        .eq('agent_id', member.user_id)
        .eq('is_deleted', false);

      const inventory = inventoryData?.map((i: any) => ({
        name: i.product_variants?.name || 'Unknown',
        quantity: i.amount_issued
      })) || [];

      // Fetch sales summary
      const { data: salesData } = await supabase
        .from('daily_sales_tracking')
        .select('quantity_sold, total_value')
        .eq('agent_id', member.user_id)
        .eq('workspace_id', workspaceId);

      const sales = {
        units: salesData?.reduce((sum, s) => sum + (s.quantity_sold || 0), 0) || 0,
        value: salesData?.reduce((sum, s) => sum + (s.total_value || 0), 0) || 0
      };

      setMemberDetails({
        teams,
        lastLocation: locationData?.location_lat ? {
          lat: locationData.location_lat,
          lng: locationData.location_lng,
          timestamp: locationData.timestamp
        } : null,
        inventory,
        sales
      });
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleMemberClick = (member: WorkspaceMember) => {
    setSelectedMember(member);
    setMemberDetails(null);
    fetchMemberDetails(member);
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return '?';
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Team Members</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchMembers(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Count */}
        <p className="text-sm text-muted-foreground">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-auto">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-2 opacity-50" />
            <p>No members found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => handleMemberClick(member)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted transition-colors text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(member.name, member.email)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {member.name || member.email?.split('@')[0] || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.email || 'No email'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Member Details Sheet (Bottom Sheet) */}
      <Sheet open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(selectedMember?.name || null, selectedMember?.email || null)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold">
                  {selectedMember?.name || selectedMember?.email?.split('@')[0] || 'Unknown'}
                </p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {selectedMember?.role}
                </Badge>
              </div>
            </SheetTitle>
          </SheetHeader>

          {detailsLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : memberDetails ? (
            <div className="space-y-4 py-4 overflow-auto max-h-[calc(85vh-120px)]">
              {/* Contact Info */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  {selectedMember?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedMember.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Contact via app
                  </div>
                </CardContent>
              </Card>

              {/* Teams */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Teams
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {memberDetails.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {memberDetails.teams.map((team, i) => (
                        <Badge key={i} variant="secondary">{team}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No team assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Last Location */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Last Known Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {memberDetails.lastLocation ? (
                    <div className="space-y-1">
                      <p className="text-sm font-mono">
                        {memberDetails.lastLocation.lat.toFixed(4)}, {memberDetails.lastLocation.lng.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(memberDetails.lastLocation.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No location data</p>
                  )}
                </CardContent>
              </Card>

              {/* Inventory */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Current Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {memberDetails.inventory.length > 0 ? (
                    <div className="space-y-2">
                      {memberDetails.inventory.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.quantity} units</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No inventory assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Sales Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Sales Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{memberDetails.sales.units}</p>
                      <p className="text-xs text-muted-foreground">Units Sold</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">KES {memberDetails.sales.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};
