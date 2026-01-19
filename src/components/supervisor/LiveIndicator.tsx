import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  isConnected: boolean;
  className?: string;
  showLabel?: boolean;
}

export const LiveIndicator = ({ isConnected, className, showLabel = true }: LiveIndicatorProps) => {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span 
        className={cn(
          "relative flex h-2.5 w-2.5",
        )}
      >
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        )}
        <span 
          className={cn(
            "relative inline-flex rounded-full h-2.5 w-2.5",
            isConnected ? "bg-green-500" : "bg-muted-foreground"
          )} 
        />
      </span>
      {showLabel && (
        <span className={cn(
          "text-xs font-medium",
          isConnected ? "text-green-600" : "text-muted-foreground"
        )}>
          {isConnected ? "Live" : "Offline"}
        </span>
      )}
    </div>
  );
};
