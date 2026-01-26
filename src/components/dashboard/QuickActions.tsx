import { Plus, ShoppingCart, Gift, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { Skeleton } from "@/components/ui/skeleton";

export const QuickActions = () => {
  const navigate = useNavigate();
  const { features, isLoading } = useProjectConfig();

  const actions = [
    {
      id: 'startSurvey',
      icon: Plus,
      label: 'Start Survey',
      path: '/surveys',
      enabled: features.quickActions.startSurvey,
    },
    {
      id: 'recordSale',
      icon: ShoppingCart,
      label: 'Record Sale',
      path: '/record-sale',
      enabled: features.quickActions.recordSale,
    },
    {
      id: 'giveProducts',
      icon: Gift,
      label: 'Give Products',
      path: '/give-products',
      enabled: features.quickActions.giveProducts,
    },
    {
      id: 'logInteraction',
      icon: MessageSquare,
      label: 'Log Interaction',
      path: '/log-interaction',
      enabled: features.quickActions.logInteraction,
    },
  ];

  const enabledActions = actions.filter(action => action.enabled);

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-h3 mb-3 text-black">Quick Actions</h2>
      <div className={`grid gap-3 ${enabledActions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {enabledActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button 
              key={action.id}
              className="h-14 flex flex-col gap-1"
              onClick={() => navigate(action.path)}
            >
              <Icon size={20} />
              <span className="text-xs">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
