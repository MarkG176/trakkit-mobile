import { Plus, ShoppingCart, Gift, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckInOutDialog } from "./CheckInOutDialog";

export const QuickActions = () => {
  const navigate = useNavigate();
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);

  return (
    <div className="px-4 py-4">
      <h2 className="text-h3 mb-3 text-black">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="h-14 flex flex-col gap-1"
          onClick={() => setIsCheckInDialogOpen(true)}
        >
          <Clock size={20} />
          <span className="text-xs">Check In/Out</span>
        </Button>
        <Button 
          className="h-14 flex flex-col gap-1"
          onClick={() => navigate('/surveys')}
        >
          <Plus size={20} />
          <span className="text-xs">Start Survey</span>
        </Button>
        <Button 
          className="h-14 flex flex-col gap-1"
          onClick={() => navigate('/record-sale')}
        >
          <ShoppingCart size={20} />
          <span className="text-xs">Record Sale</span>
        </Button>
        <Button 
          className="h-14 flex flex-col gap-1"
          onClick={() => navigate('/give-products')}
        >
          <Gift size={20} />
          <span className="text-xs">Give Products</span>
        </Button>
        <Button 
          className="h-14 flex flex-col gap-1"
          onClick={() => navigate('/log-interaction')}
        >
          <MessageSquare size={20} />
          <span className="text-xs">Log Interaction</span>
        </Button>
      </div>

      <CheckInOutDialog 
        isOpen={isCheckInDialogOpen} 
        onClose={() => setIsCheckInDialogOpen(false)} 
      />
    </div>
  );
};