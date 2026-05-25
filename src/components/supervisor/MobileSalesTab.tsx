// [CMP-cfea0e] MobileSalesTab — mobile sales tab component
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShoppingCart, Search, ChevronRight, Calendar, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useProjectCurrency } from "@/hooks/useProjectCurrency";

interface SaleItem {
  id: string;
  created_at: string;
  product_name: string | null;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  customer_name: string | null;
}

interface AggregatedSale {
  customer_name: string;
  total_quantity: number;
  total_value: number;
  products: string[];
  last_sale_date: string;
  sales_count: number;
}

interface MobileSalesTabProps {
  workspaceId: string | undefined;
  startDate: string | null;
  endDate: string | null;
}

export function MobileSalesTab({ workspaceId, startDate, endDate }: MobileSalesTabProps) {
  const { format: formatCurrency } = useProjectCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<AggregatedSale | null>(null);

  // Fetch sales data
  const { data: salesData = [], isLoading } = useQuery({
    queryKey: ['mobile-sales', workspaceId, startDate, endDate],
    queryFn: async (): Promise<SaleItem[]> => {
      const start = startDate || "2020-01-01";
      const end = endDate || new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("sale_items")
        .select("id, created_at, product_name, variant_name, quantity, unit_price, customer_name")
        .eq("workspace_id", workspaceId!)
        .eq("is_deleted", false)
        .gte("created_at", start)
        .lte("created_at", end + "T23:59:59")
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  // Aggregate sales by customer
  const aggregatedSales = useMemo(() => {
    const customerMap = new Map<string, AggregatedSale>();

    salesData.forEach(sale => {
      const customerKey = (sale.customer_name || "Unknown").trim().toLowerCase();
      const displayName = sale.customer_name || "Unknown";
      const productName = sale.product_name || sale.variant_name || "N/A";
      const saleValue = sale.quantity * sale.unit_price;

      if (customerMap.has(customerKey)) {
        const existing = customerMap.get(customerKey)!;
        existing.total_quantity += sale.quantity;
        existing.total_value += saleValue;
        existing.sales_count += 1;
        if (new Date(sale.created_at) > new Date(existing.last_sale_date)) {
          existing.last_sale_date = sale.created_at;
        }
        if (!existing.products.includes(productName)) {
          existing.products.push(productName);
        }
      } else {
        customerMap.set(customerKey, {
          customer_name: displayName,
          total_quantity: sale.quantity,
          total_value: saleValue,
          products: [productName],
          last_sale_date: sale.created_at,
          sales_count: 1
        });
      }
    });

    return Array.from(customerMap.values());
  }, [salesData]);

  // Filter by search
  const filteredSales = aggregatedSales.filter(sale =>
    sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.products.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Search Header */}
      <div className="p-4 border-b bg-background sticky top-0 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredSales.length} customers • {salesData.length} transactions
        </p>
      </div>

      {/* Sales List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No sales found</p>
          </div>
        ) : (
          filteredSales.map((sale, index) => (
            <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedSale(sale)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{sale.customer_name}</p>
                      {sale.sales_count > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {sale.sales_count} sales
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {sale.products.length > 1 
                        ? `${sale.products[0]} +${sale.products.length - 1} more`
                        : sale.products[0]}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {sale.total_quantity} units
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(sale.last_sale_date), "MMM d")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-primary">
                      {formatCurrency(sale.total_value)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Sale Details Sheet */}
      <Sheet open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>{selectedSale?.customer_name}</SheetTitle>
          </SheetHeader>
          {selectedSale && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedSale.total_value)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{selectedSale.total_quantity}</p>
                  <p className="text-sm text-muted-foreground">Units Sold</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Products Purchased</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSale.products.map((product, i) => (
                    <Badge key={i} variant="outline">{product}</Badge>
                  ))}
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Last Sale: {format(new Date(selectedSale.last_sale_date), "PPpp")}</p>
                <p>Total Transactions: {selectedSale.sales_count}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
