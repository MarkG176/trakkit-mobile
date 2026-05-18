// [CMP-e927b3] Inventory — agent inventory view
import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Package, Plus, Minus } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { formatProductName } from "@/utils/formatProductName";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
}

export const Inventory = () => {
  const { inventory, loading, refetch } = useInventory();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  const [isSupervisor, setIsSupervisor] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [assigning, setAssigning] = useState(false);

  // Check if user is supervisor
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      setIsSupervisor(data?.role === 'supervisor');
    };
    checkRole();
  }, [user]);

  const fetchProducts = async () => {
    if (!currentWorkspaceId) return;
    const { data } = await supabase
      .from('product_variants')
      .select('id, name, sku, price')
      .eq('workspace_id', currentWorkspaceId)
      .eq('is_deleted', false);
    setProducts((data as ProductVariant[]) || []);
  };

  const openAssignDialog = () => {
    fetchProducts();
    setQuantities({});
    setAssignDialogOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const setQuantityDirect = (productId: string, value: string) => {
    const num = parseInt(value) || 0;
    setQuantities(prev => {
      if (num <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: num };
    });
  };

  const handleAssign = async () => {
    if (!user || !currentWorkspaceId) return;
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (entries.length === 0) return;

    setAssigning(true);
    try {
      const inserts = entries.map(([productId, qty]) => ({
        agent_id: user.id,
        product_variant_id: productId,
        amount_issued: qty,
        name: products.find(p => p.id === productId)?.name || null,
      }));

      const { error } = await supabase.from('agent_task_inventory').insert(inserts);
      if (error) throw error;

      toast({ title: "Inventory assigned", description: `${entries.length} product(s) added` });
      setAssignDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Failed to assign", description: err.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const selectedCount = Object.values(quantities).filter(q => q > 0).length;

  if (loading) {
    return (
      <MobileLayout currentPage="inventory">
        <div className="bg-primary text-primary-foreground p-4">
          <h1 className="text-h1">Inventory</h1>
          <p className="text-sm opacity-90">Your assigned products</p>
        </div>
        <div className="p-4 flex justify-center items-center h-48">
          <p className="text-secondary-foreground">Loading inventory...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="inventory">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1">Inventory</h1>
            <p className="text-sm opacity-90">Your assigned products</p>
          </div>
          {isSupervisor && (
            <Button
              size="icon"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 h-9 w-9"
              onClick={openAssignDialog}
            >
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>
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
              <div key={item.id} className="performance-card">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-h3 mb-1">{formatProductName(item.name, item.sku)}</h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-body font-medium">KES {item.price || 0}</span>
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
            ))}
          </div>
        )}
      </div>

      {/* Assign Inventory Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Assign Inventory
            </DialogTitle>
          </DialogHeader>

          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No products available in this workspace</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {products.map((product) => {
                const qty = quantities[product.id] || 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={product.id}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-colors cursor-pointer ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
                    }`}
                    onClick={() => {
                      if (qty === 0) updateQuantity(product.id, 1);
                    }}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-1 ${
                      isSelected ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Package className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <p className="text-[10px] font-medium text-center leading-tight line-clamp-2 h-6 mb-1">
                      {formatProductName(product.name, product.sku)}
                    </p>
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      )}
                      <Input
                        type="number"
                        min={0}
                        value={qty || ''}
                        placeholder="0"
                        onChange={(e) => { e.stopPropagation(); setQuantityDirect(product.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 w-10 text-center text-xs p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {isSelected && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={selectedCount === 0 || assigning}
            >
              {assigning ? 'Assigning...' : `Assign ${selectedCount} item${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};