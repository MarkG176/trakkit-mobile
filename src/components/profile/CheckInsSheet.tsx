import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "lucide-react";
import { useAgentCheckIns, type CheckInRange } from "@/hooks/useAgentCheckIns";
import { CheckInRecordCard } from "./CheckInRecordCard";

interface CheckInsSheetProps {
  range: CheckInRange | null;
  onOpenChange: (open: boolean) => void;
}

export const CheckInsSheet = ({ range, onOpenChange }: CheckInsSheetProps) => {
  const { data: checkIns = [], isLoading } = useAgentCheckIns(range);

  return (
    <Sheet open={!!range} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
        <SheetHeader className="p-4 border-b text-left">
          <SheetTitle>{range === "today" ? "Today's check-ins" : "All check-ins"}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
          ) : checkIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No check-ins found</p>
            </div>
          ) : (
            checkIns.map((checkIn) => <CheckInRecordCard key={checkIn.id} checkIn={checkIn} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
