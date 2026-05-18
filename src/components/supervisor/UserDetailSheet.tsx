// [CMP-b3cc36] UserDetailSheet — user detail sheet component
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, Clock, ShoppingCart, LogIn, Package, Store,
  Gift, FileText, MessageSquare, ClipboardList, StickyNote, ExternalLink
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface UserDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  displayName: string | null;
  email: string;
  role: string;
}

interface CheckIn {
  id: string;
  status: string;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
  selfie_url: string | null;
}

interface Sale {
  id: string;
  quantity_sold: number;
  sale_value: number | null;
  created_at: string;
  product_name: string | null;
}

interface Giveaway {
  id: string;
  recipient_name: string | null;
  total_items: number;
  recorded_at: string;
  products_given: any;
}

interface Interaction {
  id: string;
  interaction_type: string | null;
  customer_name: string | null;
  timestamp: string | null;
  outcome: string | null;
  quantity_sold: number;
  sale_value: number | null;
}

interface Note {
  id: string;
  content: string;
  note_type: string | null;
  customer_name: string | null;
  created_at: string | null;
  priority: string | null;
}

interface StockReport {
  id: string;
  report_type: string;
  work_date: string;
  opening_stock: number | null;
  closing_stock: number | null;
  reported_at: string;
}

interface AssignedStore {
  store_id: string;
  store_name: string;
}

interface StoreOption {
  id: string;
  store_name: string;
}

export const UserDetailSheet = ({ 
  open, onOpenChange, userId, displayName, email, role 
}: UserDetailSheetProps) => {
  const { currentWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stockReports, setStockReports] = useState<StockReport[]>([]);
  const [assignedStore, setAssignedStore] = useState<AssignedStore | null>(null);
  const [allStores, setAllStores] = useState<StoreOption[]>([]);
  const [assigningStore, setAssigningStore] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const initials = (displayName || email || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (open && userId && currentWorkspaceId) {
      fetchUserDetails();
      fetchStores();
    }
  }, [open, userId, currentWorkspaceId]);

  const fetchStores = async () => {
    const { data } = await supabase
      .from('stores')
      .select('id, store_name')
      .eq('workspace_id', currentWorkspaceId!)
      .eq('is_deleted', false)
      .order('store_name');
    if (data) setAllStores(data);
  };

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const [checkInResult, salesResult, storeResult, giveawayResult, interactionResult, stockResult, notesResult] = await Promise.all([
        supabase
          .from('agent_status_log')
          .select('id, status, timestamp, location_lat, location_lng, selfie_url')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId!)
          .order('timestamp', { ascending: false })
          .limit(1),

        supabase
          .from('daily_sales_tracking')
          .select('id, quantity_sold, total_value, created_at, product_name')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId!)
          .eq('work_date', today)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('agent_status_log')
          .select('store_id, stores:store_id(store_name)')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId!)
          .eq('status', 'set_location')
          .not('store_id', 'is', null)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single(),

        supabase
          .from('giveaways')
          .select('id, recipient_name, total_items, recorded_at, products_given')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId!)
          .gte('recorded_at', `${today}T00:00:00`)
          .lte('recorded_at', `${today}T23:59:59`)
          .order('recorded_at', { ascending: false })
          .limit(10),

        supabase
          .from('interactions')
          .select('id, interaction_type, customer_name, timestamp, outcome, quantity_sold, sale_value')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId!)
          .gte('timestamp', `${today}T00:00:00`)
          .lte('timestamp', `${today}T23:59:59`)
          .order('timestamp', { ascending: false })
          .limit(10),

        supabase
          .from('daily_stock_reports')
          .select('id, report_type, work_date, opening_stock, closing_stock, reported_at')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId!)
          .eq('work_date', today)
          .order('reported_at', { ascending: false })
          .limit(10),

        supabase
          .from('notes')
          .select('id, content, note_type, customer_name, created_at, priority')
          .eq('agent_id', userId)
          .eq('workspace_id', currentWorkspaceId!)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setLastCheckIn(checkInResult.data?.[0] || null);

      setRecentSales((salesResult.data || []).map(s => ({
        id: s.id, quantity_sold: s.quantity_sold,
        sale_value: s.total_value, created_at: s.created_at || '',
        product_name: s.product_name || 'Product',
      })));

      setGiveaways(giveawayResult.data || []);
      setInteractions(interactionResult.data || []);
      setNotes(notesResult.data || []);
      setStockReports(stockResult.data || []);

      if (storeResult.data?.store_id) {
        setAssignedStore({
          store_id: storeResult.data.store_id,
          store_name: (storeResult.data as any).stores?.store_name || 'Unknown Store',
        });
      } else {
        setAssignedStore(null);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStore = async (storeId: string) => {
    if (!currentWorkspaceId) return;
    setAssigningStore(true);
    try {
      const { error } = await supabase
        .from('agent_status_log')
        .insert({
          agent_id: userId,
          workspace_id: currentWorkspaceId,
          status: 'set_location',
          store_id: storeId,
          timestamp: new Date().toISOString(),
          agent_display_name: displayName,
        });

      if (error) throw error;

      const store = allStores.find(s => s.id === storeId);
      setAssignedStore({ store_id: storeId, store_name: store?.store_name || 'Store' });
      toast.success('Store assigned successfully');
    } catch (error) {
      console.error('Error assigning store:', error);
      toast.error('Failed to assign store');
    } finally {
      setAssigningStore(false);
    }
  };

  const handleStoreClick = () => {
    if (assignedStore) {
      onOpenChange(false);
      navigate('/reports');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-green-500';
      case 'checked_out': return 'bg-red-500';
      case 'lunch': case 'break': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'checked_in': return 'Checked In';
      case 'checked_out': return 'Checked Out';
      case 'lunch': return 'On Lunch';
      case 'break': return 'On Break';
      default: return status;
    }
  };

  const getInteractionIcon = (type: string | null) => {
    switch (type) {
      case 'survey': return <ClipboardList className="w-5 h-5 text-purple-600" />;
      case 'sale': return <ShoppingCart className="w-5 h-5 text-green-600" />;
      case 'giveaway': return <Gift className="w-5 h-5 text-orange-600" />;
      default: return <MessageSquare className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const totalSalesQty = recentSales.reduce((s, x) => s + x.quantity_sold, 0);
  const totalSalesValue = recentSales.reduce((s, x) => s + (x.sale_value || 0), 0);
  const totalGiveawayItems = giveaways.reduce((s, x) => s + x.total_items, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left">{displayName || 'No name'}</SheetTitle>
              {email && <p className="text-sm text-muted-foreground">{email}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="capitalize">{role}</Badge>
                {assignedStore && (
                  <Badge 
                    variant="outline" 
                    className="gap-1 cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={handleStoreClick}
                  >
                    <Store className="w-3 h-3" />
                    {assignedStore.store_name}
                    <ExternalLink className="w-3 h-3" />
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto pb-8">
          {/* Store Assignment */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Store className="w-4 h-4" /> Assign Store
            </h3>
            <Select
              value={assignedStore?.store_id || ''}
              onValueChange={handleAssignStore}
              disabled={assigningStore}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={assigningStore ? 'Assigning...' : 'Select a store'} />
              </SelectTrigger>
              <SelectContent>
                {allStores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          {!loading && (
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center">
                <p className="text-lg font-bold text-primary">{totalSalesQty}</p>
                <p className="text-xs text-muted-foreground">Sales</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-lg font-bold text-orange-600">{totalGiveawayItems}</p>
                <p className="text-xs text-muted-foreground">Giveaways</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-lg font-bold text-purple-600">{interactions.length}</p>
                <p className="text-xs text-muted-foreground">Interactions</p>
              </Card>
            </div>
          )}

          {/* Last Check-in */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Last Check-in
            </h3>
            {loading ? (
              <Card className="p-4"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-48" /></Card>
            ) : lastCheckIn ? (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  {lastCheckIn.selfie_url && (
                    <img src={lastCheckIn.selfie_url} alt="Check-in selfie" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(lastCheckIn.status)}`} />
                      <span className="font-medium">{getStatusLabel(lastCheckIn.status)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(lastCheckIn.timestamp), { addSuffix: true })}
                    </div>
                    {lastCheckIn.location_lat && lastCheckIn.location_lng && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {lastCheckIn.location_lat.toFixed(4)}, {lastCheckIn.location_lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4 text-center text-muted-foreground"><p className="text-sm">No check-in recorded</p></Card>
            )}
          </div>

          {/* Today's Sales */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Today's Sales
              {recentSales.length > 0 && totalSalesValue > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  KES {totalSalesValue.toLocaleString()}
                </Badge>
              )}
            </h3>
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : recentSales.length > 0 ? (
              <div className="space-y-2">
                {recentSales.map(sale => (
                  <Card key={sale.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{sale.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {sale.quantity_sold}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {sale.sale_value != null && (
                          <p className="font-medium text-primary">KES {sale.sale_value.toLocaleString()}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{format(new Date(sale.created_at), 'HH:mm')}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center text-muted-foreground"><p className="text-sm">No sales recorded today</p></Card>
            )}
          </div>

          {/* Today's Giveaways */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Gift className="w-4 h-4" /> Today's Giveaways
            </h3>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : giveaways.length > 0 ? (
              <div className="space-y-2">
                {giveaways.map(g => (
                  <Card key={g.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{g.recipient_name || 'Recipient'}</p>
                          <p className="text-xs text-muted-foreground">{g.total_items} item{g.total_items !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(g.recorded_at), 'HH:mm')}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center text-muted-foreground"><p className="text-sm">No giveaways today</p></Card>
            )}
          </div>

          {/* Today's Interactions */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Today's Interactions
            </h3>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : interactions.length > 0 ? (
              <div className="space-y-2">
                {interactions.map(i => (
                  <Card key={i.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          {getInteractionIcon(i.interaction_type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">{i.interaction_type || 'Interaction'}</p>
                          <p className="text-xs text-muted-foreground">{i.customer_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {i.outcome && <Badge variant="outline" className="text-xs">{i.outcome}</Badge>}
                        {i.timestamp && (
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(i.timestamp), 'HH:mm')}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center text-muted-foreground"><p className="text-sm">No interactions today</p></Card>
            )}
          </div>

          {/* Today's Notes */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Today's Notes
            </h3>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map(n => (
                  <Card key={n.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                        <StickyNote className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm capitalize">{n.note_type?.replace(/_/g, ' ') || 'Note'}</p>
                          {n.priority && n.priority !== 'medium' && (
                            <span className={`text-xs font-medium ${getPriorityColor(n.priority)}`}>
                              {n.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                        {n.customer_name && (
                          <p className="text-xs text-muted-foreground mt-1">Re: {n.customer_name}</p>
                        )}
                      </div>
                      {n.created_at && (
                        <p className="text-xs text-muted-foreground shrink-0">{format(new Date(n.created_at), 'HH:mm')}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center text-muted-foreground"><p className="text-sm">No notes today</p></Card>
            )}
          </div>

          {/* Today's Stock Reports */}
          {!loading && stockReports.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Today's Stock Reports
              </h3>
              <div className="space-y-2">
                {stockReports.map(sr => (
                  <Card key={sr.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">{sr.report_type.replace(/_/g, ' ')}</p>
                          {sr.opening_stock != null && <p className="text-xs text-muted-foreground">Open: {sr.opening_stock}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        {sr.closing_stock != null && <p className="text-xs font-medium">Close: {sr.closing_stock}</p>}
                        <p className="text-xs text-muted-foreground">{format(new Date(sr.reported_at), 'HH:mm')}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
