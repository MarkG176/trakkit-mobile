import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Search, 
  Users, 
  MapPin, 
  Package, 
  DollarSign, 
  ChevronRight,
  Phone,
  Mail,
  RefreshCw,
  Pencil,
  MessageSquare,
  Send,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceMember {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
}

interface MemberDetails {
  teams: { id: string; name: string }[];
  lastLocation: { lat: number; lng: number; timestamp: string } | null;
  inventory: { name: string; quantity: number; product_variant_id?: string }[];
  sales: { units: number; value: number };
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
}

export const MobileWorkspaceMembers = ({ workspaceId }: { workspaceId: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Edit states
  const [editingEmail, setEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState('');
  const [editingTeam, setEditingTeam] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<{ id: string; name: string }[]>([]);

  // Contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  // Inventory assignment
  const [assignInventoryOpen, setAssignInventoryOpen] = useState(false);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [assignQuantities, setAssignQuantities] = useState<Record<string, number>>({});
  const [assigningInventory, setAssigningInventory] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

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

  const fetchAvailableTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .eq('is_deleted', false);
    setAvailableTeams(data || []);
  };

  const fetchProductVariants = async () => {
    const { data } = await supabase
      .from('product_variants')
      .select('id, name, sku, price')
      .eq('workspace_id', workspaceId)
      .eq('is_deleted', false)
      .order('name');
    setProductVariants(data || []);
  };

  const handleAssignInventory = async () => {
    if (!selectedMember) return;
    const items = Object.entries(assignQuantities).filter(([_, qty]) => qty > 0);
    if (items.length === 0) {
      toast({ title: 'Select at least one product', variant: 'destructive' });
      return;
    }
    setAssigningInventory(true);
    try {
      for (const [variantId, qty] of items) {
        const variant = productVariants.find(v => v.id === variantId);

        // Step 1: Create agent_task
        const { data: task, error: taskError } = await supabase
          .from('agent_tasks')
          .insert({
            agent_id: selectedMember.user_id,
            individual_sales_target: qty,
            workspace_id: workspaceId,
            status: 'pending',
            assigned_product_variant_id: variantId,
          })
          .select('id')
          .single();

        if (taskError) throw taskError;

        // Step 2: Create agent_task_inventory referencing the task
        const { error: invError } = await supabase
          .from('agent_task_inventory')
          .insert({
            agent_id: selectedMember.user_id,
            task_id: task.id,
            product_variant_id: variantId,
            amount_issued: qty,
            name: variant?.name || 'Unknown',
          });

        if (invError) throw invError;
      }
      toast({ title: 'Inventory assigned', description: `${items.length} product(s) assigned to ${selectedMember.name || selectedMember.email}` });
      setAssignQuantities({});
      setAssignInventoryOpen(false);
      fetchMemberDetails(selectedMember);
    } catch (error: any) {
      toast({ title: 'Failed to assign', description: error.message, variant: 'destructive' });
    } finally {
      setAssigningInventory(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
      fetchAvailableTeams();
      fetchProductVariants();
    }
  }, [workspaceId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.name?.toLowerCase().includes(query) || 
      m.email?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const fetchMemberDetails = async (member: WorkspaceMember) => {
    setDetailsLoading(true);
    try {
      const { data: teamData } = await supabase
        .from('team_members')
        .select('teams:teams!team_members_team_id_fkey(id, name)')
        .eq('agent_id', member.user_id)
        .eq('workspace_id', workspaceId);

      const teams = teamData?.map((t: any) => ({ id: t.teams?.id, name: t.teams?.name })).filter((t: any) => t.name) || [];

      const { data: locationData } = await supabase
        .from('agent_status_log')
        .select('location_lat, location_lng, timestamp')
        .eq('agent_id', member.user_id)
        .eq('workspace_id', workspaceId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const { data: inventoryData } = await supabase
        .from('agent_task_inventory')
        .select('amount_issued, product_variants:product_variant_id(name)')
        .eq('agent_id', member.user_id)
        .eq('is_deleted', false);

      const inventory = inventoryData?.map((i: any) => ({
        name: i.product_variants?.name || 'Unknown',
        quantity: i.amount_issued
      })) || [];

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
    setEditingEmail(false);
    setEditingTeam(false);
    fetchMemberDetails(member);
  };

  const handleSaveEmail = async () => {
    if (!selectedMember || !editEmailValue.trim()) return;
    const { error } = await supabase
      .from('user_workspaces')
      .update({ email: editEmailValue.trim() })
      .eq('id', selectedMember.id);

    if (error) {
      toast({ title: 'Failed to update email', variant: 'destructive' });
    } else {
      setSelectedMember(prev => prev ? { ...prev, email: editEmailValue.trim() } : null);
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, email: editEmailValue.trim() } : m));
      toast({ title: 'Email updated' });
    }
    setEditingEmail(false);
  };

  const handleAssignTeam = async (teamId: string) => {
    if (!selectedMember) return;
    // Remove from current teams first
    await supabase
      .from('team_members')
      .delete()
      .eq('agent_id', selectedMember.user_id)
      .eq('workspace_id', workspaceId);

    // Add to new team
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, agent_id: selectedMember.user_id, workspace_id: workspaceId });

    if (error) {
      toast({ title: 'Failed to update team', variant: 'destructive' });
    } else {
      toast({ title: 'Team updated' });
      fetchMemberDetails(selectedMember);
    }
    setEditingTeam(false);
  };

  const handleSendMessage = async () => {
    if (!selectedMember || !contactMessage.trim() || !user) return;
    setSendingMessage(true);

    // Get sender name
    const { data: senderData } = await supabase
      .from('user_roles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single();

    const senderName = senderData?.display_name || senderData?.email || 'Supervisor';

    const { error } = await supabase
      .from('supervisor_messages')
      .insert({
        sender_id: user.id,
        sender_name: senderName,
        recipient_id: selectedMember.user_id,
        message: contactMessage.trim(),
        workspace_id: workspaceId,
      });

    if (error) {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Message sent', description: `Message sent to ${selectedMember.name || selectedMember.email}` });
      setContactMessage('');
      setContactDialogOpen(false);
    }
    setSendingMessage(false);
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
          <Button variant="ghost" size="icon" onClick={() => fetchMembers(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
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
                  <p className="font-medium truncate">{member.name || member.email?.split('@')[0] || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground truncate">{member.email || 'No email'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{member.role}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Member Details Sheet */}
      <Sheet open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(selectedMember?.name || null, selectedMember?.email || null)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {selectedMember?.name || selectedMember?.email?.split('@')[0] || 'Unknown'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={(e) => { e.stopPropagation(); setContactDialogOpen(true); }}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Contact
                  </Button>
                </div>
                <Badge variant="secondary" className="text-xs mt-1">{selectedMember?.role}</Badge>
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
              {/* Contact Info with Edit */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {editingEmail ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editEmailValue}
                          onChange={(e) => setEditEmailValue(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveEmail}>
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingEmail(false)}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="flex-1">{selectedMember?.email || 'No email'}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => { setEditEmailValue(selectedMember?.email || ''); setEditingEmail(true); }}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Teams with Edit */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Teams
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => setEditingTeam(!editingTeam)}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {editingTeam ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Select a team to assign:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableTeams.map(team => (
                          <Button
                            key={team.id}
                            variant={memberDetails.teams.some(t => t.id === team.id) ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={() => handleAssignTeam(team.id)}
                          >
                            {team.name}
                          </Button>
                        ))}
                      </div>
                      {availableTeams.length === 0 && (
                        <p className="text-xs text-muted-foreground">No teams available</p>
                      )}
                    </div>
                  ) : memberDetails.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {memberDetails.teams.map((team, i) => (
                        <Badge key={i} variant="secondary">{team.name}</Badge>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 ml-auto"
                      onClick={() => { setAssignQuantities({}); setAssignInventoryOpen(true); }}
                    >
                      <Plus className="h-3 w-3" />
                      Assign
                    </Button>
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

      {/* Contact Message Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message {selectedMember?.name || selectedMember?.email?.split('@')[0]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Type your message..."
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendMessage}
              disabled={!contactMessage.trim() || sendingMessage}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sendingMessage ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Inventory Dialog */}
      <Dialog open={assignInventoryOpen} onOpenChange={setAssignInventoryOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Assign Inventory to {selectedMember?.name || selectedMember?.email?.split('@')[0]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {productVariants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No products available in this workspace</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {productVariants.map((variant) => {
                  const qty = assignQuantities[variant.id] || 0;
                  return (
                    <div
                      key={variant.id}
                      className={`border rounded-lg p-3 text-center space-y-2 transition-colors ${
                        qty > 0 ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-medium truncate" title={variant.sku ? `${variant.sku} - ${variant.name}` : variant.name}>{variant.sku ? `${variant.sku} - ${variant.name}` : variant.name}</p>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={qty <= 0}
                          onClick={() => setAssignQuantities(prev => ({ ...prev, [variant.id]: Math.max(0, qty - 1) }))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={(e) => setAssignQuantities(prev => ({ ...prev, [variant.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="h-7 w-12 text-center text-sm px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setAssignQuantities(prev => ({ ...prev, [variant.id]: qty + 1 }))}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignInventoryOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssignInventory}
              disabled={assigningInventory || Object.values(assignQuantities).every(q => q <= 0)}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {assigningInventory ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};