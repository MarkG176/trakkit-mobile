// [CMP-71a723] QuickActions — dashboard quick-action grid gated by CRM action codes
import { Plus, ShoppingCart, Gift, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProjectComponents } from "@/hooks/useProjectComponents";

export const QuickActions = () => {
  const navigate = useNavigate();
  const { isEnabled } = useProjectComponents();

  const actions = [
    { code: "CRM-0097", label: "Start Survey", icon: Plus, path: "/surveys" },
    { code: "CRM-0034", label: "Record Sale", icon: ShoppingCart, path: "/record-sale" },
    { code: "CRM-0034G", label: "Give Products", icon: Gift, path: "/give-products" },
    { code: "CRM-0096", label: "Log Interaction", icon: MessageSquare, path: "/log-interaction" },
  ].filter((a) => isEnabled(a.code));

  if (actions.length === 0) return null;

  return (
    <div className="px-4 py-4">
      <h2 className="text-h3 mb-3 text-black">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ key, label, icon: Icon, path }) => (
          <Button
            key={key}
            className="h-14 flex flex-col gap-1"
            onClick={() => navigate(path)}
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
