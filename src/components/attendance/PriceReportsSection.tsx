import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { PriceReportDialog } from "@/components/attendance/PriceReportDialog";
import { ButtonLabelRows } from "@/components/reports/ButtonLabelRows";
import { useProjectComponents } from "@/hooks/useProjectComponents";

export interface PriceReportsSectionProps {
  storeId?: string | null;
  stockLevels: Record<string, string>;
}

export function PriceReportsSection({
  storeId = null,
  stockLevels,
}: PriceReportsSectionProps) {
  const { isEnabled } = useProjectComponents();
  const [showPriceReport, setShowPriceReport] = useState(false);

  if (!isEnabled("CRM-0025")) return null;

  const hasStockLevels = Object.keys(stockLevels).length > 0;

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-h3 text-black flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Reports
          </h3>
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-center gap-2"
            disabled={!hasStockLevels}
            onClick={() => setShowPriceReport(true)}
          >
            <DollarSign className="h-6 w-6" />
            <ButtonLabelRows label="Start Price Report" />
          </Button>
        </CardContent>
      </Card>

      <PriceReportDialog
        open={showPriceReport}
        onOpenChange={setShowPriceReport}
        storeId={storeId}
        stockLevels={stockLevels}
        onComplete={() => setShowPriceReport(false)}
      />
    </>
  );
}
