import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

interface ProductSummary {
  productId: string;
  productName: string;
  productCategory: string | null;
  totalQuantitySold: number;
  totalValue: number;
}

export const InventoryManagement = () => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchProductSummary();
  }, []);

  const fetchProductSummary = async () => {
    try {
      // Get Capwell workspace ID
      const { data: capwellWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('name', 'Capwell')
        .single();

      if (workspaceError) throw workspaceError;

      // Fetch sale_items from Capwell workspace
      const { data: saleItems, error } = await supabase
        .from("sale_items")
        .select(`
          product_id,
          product_name,
          product_category,
          quantity,
          total_price
        `)
        .eq("workspace_id", capwellWorkspace.id);

      if (error) throw error;

      // Group by product and calculate totals
      const productMap = new Map<string, ProductSummary>();
      
      saleItems?.forEach(item => {
        const productId = item.product_id || 'unknown';
        const existing = productMap.get(productId);
        
        if (existing) {
          existing.totalQuantitySold += item.quantity;
          existing.totalValue += item.total_price || 0;
        } else {
          productMap.set(productId, {
            productId,
            productName: item.product_name || 'Unknown Product',
            productCategory: item.product_category,
            totalQuantitySold: item.quantity,
            totalValue: item.total_price || 0,
          });
        }
      });

      setProducts(Array.from(productMap.values()));
    } catch (error: any) {
      toast({
        title: "Error loading inventory",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <SupervisorMobileLayout currentPage="inventory">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-sm opacity-90">Product sales summary</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Package className="w-6 h-6" />
          </div>
        </div>
        
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchProductSummary} />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Products Sold</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} from Capwell workspace
          </p>
        </div>

        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.productId} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.productName}</h3>
                  {product.productCategory && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Category: {product.productCategory}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Total Quantity Sold</p>
                  <p className="text-2xl font-bold text-primary">{product.totalQuantitySold}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-success">
                    ${product.totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {products.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No products found</p>
            </Card>
          )}
        </div>
      </div>
    </SupervisorMobileLayout>
  );
};
