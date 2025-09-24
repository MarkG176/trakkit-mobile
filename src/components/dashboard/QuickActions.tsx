import { Plus, ShoppingCart, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export const QuickActions = () => {
  return (
    <div className="px-4 py-4">
      <h2 className="text-h3 mb-3">Quick Actions</h2>
      <div className="flex gap-3">
        <Button className="flex-1 h-14 flex flex-col gap-1">
          <Plus size={20} />
          <span className="text-xs">Start Survey</span>
        </Button>
        <Button className="flex-1 h-14 flex flex-col gap-1">
          <ShoppingCart size={20} />
          <span className="text-xs">Record Sale</span>
        </Button>
        <Button className="flex-1 h-14 flex flex-col gap-1">
          <Gift size={20} />
          <span className="text-xs">Give Products</span>
        </Button>
      </div>
    </div>
  );
};