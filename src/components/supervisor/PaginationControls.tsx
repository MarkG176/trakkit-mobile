import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPrevPage,
  onNextPage,
  hasPrevPage,
  hasNextPage,
}: PaginationControlsProps) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="text-xs text-muted-foreground">
        Showing {startIndex}-{endIndex} of {totalItems}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-xs text-muted-foreground min-w-[60px] text-center">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
