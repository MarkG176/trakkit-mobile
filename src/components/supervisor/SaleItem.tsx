import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShoppingCart, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface SaleItemProps {
  id: string;
  agentName: string;
  productName: string;
  quantity: number;
  value: number;
  timestamp: string;
  isNew?: boolean;
}

export const SaleItem = ({
  agentName,
  productName,
  quantity,
  value,
  timestamp,
  isNew = false,
}: SaleItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  const initials = agentName.substring(0, 2).toUpperCase();

  return (
    <Card className={cn(
      "p-3 transition-all duration-300",
      isNew && "ring-2 ring-green-500/50 bg-green-50/50"
    )}>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-sm truncate">{agentName}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShoppingCart className="h-3 w-3" />
            <span className="truncate">{quantity}× {productName}</span>
          </div>
        </div>
        
        <div className="text-right shrink-0">
          <p className="font-semibold text-sm text-green-600">
            KES {value.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
