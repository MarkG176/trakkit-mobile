import { MobileLayout } from "@/components/MobileLayout";
import { Package } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";

export const Inventory = () => {
  const { inventory, loading } = useInventory();

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
        <h1 className="text-h1">Inventory</h1>
        <p className="text-sm opacity-90">Your assigned products</p>
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
                    <h3 className="text-h3 mb-1">{item.name || 'Product'}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-secondary text-xs font-medium">{item.sku || 'N/A'}</p>
                    </div>
                    
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
    </MobileLayout>
  );
};
