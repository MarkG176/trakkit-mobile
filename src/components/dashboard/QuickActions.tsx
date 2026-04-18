import { Plus, ShoppingCart, Gift, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";

export const QuickActions = () => {
  const navigate = useNavigate();
  const { currentProjectId } = useWorkspace();
  const { flags } = useProjectComponents(currentProjectId);

  const actions = [
    {
      key: "enable_take_surveys" as const,
      label: "Start Survey",
      icon: Plus,
      path: "/surveys",
    },
    {
      key: "enable_record_sale" as const,
      label: "Record Sale",
      icon: ShoppingCart,
      path: "/record-sale",
    },
    {
      key: "enable_give_products" as const,
      label: "Give Products",
      icon: Gift,
      path: "/give-products",
    },
    {
      key: "enable_log_interaction" as const,
      label: "Log Interaction",
      icon: MessageSquare,
      path: "/log-interaction",
    },
  ].filter((a) => flags[a.key]);

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
