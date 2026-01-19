import { useState, useRef, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10",
          (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: isRefreshing ? 50 : pullDistance,
          transform: `translateY(${isRefreshing ? 0 : -50 + pullDistance}px)`
        }}
      >
        <div className={cn(
          "bg-primary text-primary-foreground rounded-full p-2",
          isRefreshing && "animate-spin"
        )}>
          <RefreshCw 
            className="h-5 w-5" 
            style={{ 
              transform: isRefreshing ? 'none' : `rotate(${progress * 360}deg)`,
              opacity: Math.max(0.3, progress)
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className={cn("h-full overflow-y-auto", className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: (pullDistance > 0 || isRefreshing) ? `translateY(${isRefreshing ? 50 : pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};
