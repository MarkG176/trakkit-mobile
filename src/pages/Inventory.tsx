import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Gift, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  product_variant_id: string;
  amount_issued: number;
  product_variant: {
    id: string;
    name: string;
    sku: string;
    price: number;
  };
}

export const Inventory = () => {
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your inventory.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('agent_task_inventory')
        .select(`
          id,
          product_variant_id,
          amount_issued,
          product_variant:product_variants!agent_task_inventory_product_variant_id_fkey (
            id,
            name,
            sku,
            price
          )
        `)
        .eq('agent_id', user.id)
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching inventory:', error);
        toast({
          title: "Error loading inventory",
          description: "Could not load your assigned inventory.",
          variant: "destructive",
        });
      } else {
        setInventory(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout currentPage="inventory">
        <div className="bg-primary text-primary-foreground p-4">
          <h1 className="text-h1">Inventory</h1>
          <p className="text-sm opacity-90">Manage your assigned products</p>
        </div>
        <div className="p-4 flex justify-center items-center h-48">
          <p className="text-secondary-foreground">Loading inventory...</p>
        </div>
      </MobileLayout>
    );
  }

  if (selectedProduct) {
    return (
      <MobileLayout currentPage="inventory">
        <div className="min-h-screen bg-background">
          {/* Product Header */}
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedProduct(null)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-lg font-medium">{selectedProduct.product_variant.name}</h1>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6">
            {/* Product Image Placeholder */}
            <div className="w-full h-48 bg-accent rounded-lg flex items-center justify-center mb-6">
              <Package size={64} className="text-primary" />
            </div>

            {/* SKU and Stock Status */}
            <div className="performance-card mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-body text-secondary-foreground">SKU</span>
                <span className="text-h3 font-medium">{selectedProduct.product_variant.sku}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-secondary-foreground">Stock Available</span>
                <span className={`text-h3 font-bold ${
                  selectedProduct.amount_issued < 5 ? "text-destructive" : 
                  selectedProduct.amount_issued < 10 ? "text-warning" : "text-success"
                }`}>
                  {selectedProduct.amount_issued} units
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="performance-card mb-4">
              <div className="flex items-center justify-between">
                <span className="text-body">Unit Price</span>
                <span className="text-h3">KES {selectedProduct.product_variant.price}</span>
              </div>
            </div>

            {/* Product Info */}
            <div className="performance-card mb-6">
              <h3 className="text-h3 mb-2">Product Details</h3>
              <p className="text-body text-secondary-foreground">SKU: {selectedProduct.product_variant.sku}</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full h-12">
                <ShoppingCart size={20} className="mr-2" />
                Record a Sale
              </Button>
              <Button variant="outline" className="w-full h-12">
                <Gift size={20} className="mr-2" />
                Record a Giveaway
              </Button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="inventory">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Inventory</h1>
        <p className="text-sm opacity-90">Manage your assigned products</p>
      </div>

      <div className="p-4">
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-secondary-foreground mb-4" />
            <p className="text-secondary-foreground">No inventory assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {inventory.map((item) => (
              <div 
                key={item.id} 
                className="performance-card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProduct(item)}
              >
                <div className="flex items-center gap-4">
                  {/* Product Image Placeholder */}
                  <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-h3 mb-1">{item.product_variant.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-secondary text-xs font-medium">{item.product_variant.sku}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-body font-medium">KES {item.product_variant.price}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-medium ${
                          item.amount_issued < 5 ? "text-destructive" : 
                          item.amount_issued < 10 ? "text-warning" : "text-success"
                        }`}>
                          {item.amount_issued} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};