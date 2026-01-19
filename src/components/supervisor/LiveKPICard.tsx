import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  isLive?: boolean;
}

const colorStyles = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: 'text-primary',
  },
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    icon: 'text-amber-500',
  },
  destructive: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    icon: 'text-destructive',
  },
};

export const LiveKPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'primary',
  onClick,
  isLive = false,
}: LiveKPICardProps) => {
  const styles = colorStyles[color];
  
  return (
    <Card 
      className={cn(
        "p-4 transition-all duration-200 relative overflow-hidden",
        onClick && "cursor-pointer hover:shadow-md active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      {isLive && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", styles.bg)}>
          <Icon className={cn("h-5 w-5", styles.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className={cn("text-xl font-bold truncate", styles.text)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
