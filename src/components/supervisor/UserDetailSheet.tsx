import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { 
  MapPin, 
  Clock, 
  ShoppingCart, 
  LogIn,
  Calendar,
  Package
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

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

export const UserDetailSheet = ({ 
  open, 
  onOpenChange, 
  userId, 
  displayName, 
  email, 
  role 
}: UserDetailSheetProps) => {
  const { currentWorkspaceId } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  const initials = (displayName || email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (open && userId && currentWorkspaceId) {
      fetchUserDetails();
    }
  }, [open, userId, currentWorkspaceId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Fetch last check-in
      const { data: checkIns } = await supabase
        .from('agent_status_log')
        .select('id, status, timestamp, location_lat, location_lng, selfie_url')
        .eq('agent_id', userId)
        .eq('workspace_id', currentWorkspaceId)
        .order('timestamp', { ascending: false })
        .limit(1);

      setLastCheckIn(checkIns?.[0] || null);

      // Fetch recent sales (today)
      const today = new Date().toISOString().split('T')[0];
      const { data: sales } = await supabase
        .from('interactions')
        .select(`
          id,
          quantity_sold,
          sale_value,
          created_at,
          product_variants (name, sku)
        `)
        .eq('agent_id', userId)
        .eq('workspace_id', currentWorkspaceId)
        .eq('interaction_type', 'sale')
        .gte('created_at', today + 'T00:00:00')
        .order('created_at', { ascending: false })
        .limit(5);

      const formattedSales: Sale[] = (sales || []).map(sale => ({
        id: sale.id,
        quantity_sold: sale.quantity_sold,
        sale_value: sale.sale_value,
        created_at: sale.created_at || '',
        product_name: (() => { const pv = (sale.product_variants as any); return pv?.sku ? `${pv.sku} - ${pv.name || 'Product'}` : (pv?.name || 'Product'); })(),
      }));

      setRecentSales(formattedSales);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-500';
      case 'checked_out':
        return 'bg-red-500';
      case 'lunch':
      case 'break':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'Checked In';
      case 'checked_out':
        return 'Checked Out';
      case 'lunch':
        return 'On Lunch';
      case 'break':
        return 'On Break';
      default:
        return status;
    }
  };

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
              <p className="text-sm text-muted-foreground">{email}</p>
              <Badge variant="secondary" className="mt-1 capitalize">{role}</Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto pb-8">
          {/* Last Check-in Card */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Last Check-in
            </h3>
            {loading ? (
              <Card className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </Card>
            ) : lastCheckIn ? (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  {lastCheckIn.selfie_url && (
                    <img 
                      src={lastCheckIn.selfie_url} 
                      alt="Check-in selfie" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
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
              <Card className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No check-in recorded</p>
              </Card>
            )}
          </div>

          {/* Today's Sales */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Today's Sales
            </h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
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
                          <p className="text-xs text-muted-foreground">
                            Qty: {sale.quantity_sold}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {sale.sale_value && (
                          <p className="font-medium text-primary">
                            KES {sale.sale_value.toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sale.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No sales recorded today</p>
              </Card>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
