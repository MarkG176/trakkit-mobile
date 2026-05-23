// Stock report entry points (morning/evening) shared by Reports page and Store Success Dialog
import { lazy, Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, Sunrise, Sunset } from "lucide-react";
import { PriceReportDialog } from "@/components/attendance/PriceReportDialog";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";
import {
  getStockReportCapabilities,
  hasAnyStockReportCapability,
} from "@/utils/stockReportConfig";

const StockReportDialog = lazy(() =>
  import("@/components/attendance/StockReportDialog").then((m) => ({
    default: m.StockReportDialog,
  })),
);

const InstoreMorningStockCountDialog = lazy(() =>
  import("@/components/attendance/InstoreMorningStockCountDialog").then((m) => ({
    default: m.InstoreMorningStockCountDialog,
  })),
);

const InstoreClosingReportDialog = lazy(() =>
  import("@/components/attendance/InstoreClosingReportDialog").then((m) => ({
    default: m.InstoreClosingReportDialog,
  })),
);

type MorningDialog = "availability" | "count" | null;
type EveningDialog = "availability" | "count" | null;

export interface StockReportsSectionProps {
  /** When set, all `daily_stock_reports` rows are linked to this store in Supabase */
  storeId?: string | null;
  /** Called when morning availability levels change (e.g. for Price Report) */
  onStockLevelsChange?: (levels: Record<string, string>) => void;
  /** Hide outer card wrapper (e.g. inside Store Success Dialog) */
  embedded?: boolean;
}

export function StockReportsSection({
  storeId = null,
  onStockLevelsChange,
  embedded = false,
}: StockReportsSectionProps) {
  const { currentWorkspaceId, userWorkspaces } = useWorkspace();
  const { isEnabled } = useProjectComponents();

  const stockCaps = useMemo(() => {
    const raw = userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.active_components;
    return getStockReportCapabilities(raw);
  }, [userWorkspaces, currentWorkspaceId]);

  const showStockSection = hasAnyStockReportCapability(stockCaps);
  const showMorningColumn = stockCaps.morningAvailability || stockCaps.morningCount;
  const showEveningColumn = stockCaps.eveningAvailability || stockCaps.eveningCount;

  const [morningDialog, setMorningDialog] = useState<MorningDialog>(null);
  const [eveningDialog, setEveningDialog] = useState<EveningDialog>(null);
  const [showPriceReport, setShowPriceReport] = useState(false);
  const [instoreStockLevels, setInstoreStockLevels] = useState<Record<string, string>>({});
  const showPriceReportButton = isEnabled("CRM-0025");
  const hasStockLevels = Object.keys(instoreStockLevels).length > 0;

  const handleStockLevelsChange = (levels: Record<string, string>) => {
    setInstoreStockLevels(levels);
    onStockLevelsChange?.(levels);
  };

  const openMorningReport = () => {
    if (stockCaps.morningAvailability) {
      setMorningDialog("availability");
    } else if (stockCaps.morningCount) {
      setMorningDialog("count");
    }
  };

  const openEveningReport = () => {
    if (stockCaps.eveningCount) {
      setEveningDialog("count");
    } else if (stockCaps.eveningAvailability) {
      setEveningDialog("availability");
    }
  };

  if (!showStockSection) return null;

  const buttons = (
    <div
      className={`grid gap-3 ${
        showMorningColumn && showEveningColumn ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      {showMorningColumn && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Morning</p>
          {stockCaps.morningAvailability && stockCaps.morningCount ? (
            <div className="space-y-2">
              {stockCaps.morningAvailability && (
                <Button
                  type="button"
                  className="w-full h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => setMorningDialog("availability")}
                >
                  <Sunrise className="h-5 w-5" />
                  <span className="text-sm">Stock Availability</span>
                </Button>
              )}
              {stockCaps.morningCount && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => setMorningDialog("count")}
                >
                  <Sunrise className="h-5 w-5" />
                  <span className="text-sm">Opening Stock Count</span>
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              onClick={openMorningReport}
            >
              <Sunrise className="h-6 w-6" />
              <span>Start Morning Report</span>
            </Button>
          )}
        </div>
      )}

      {showEveningColumn && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Evening</p>
          {stockCaps.eveningAvailability && stockCaps.eveningCount ? (
            <div className="space-y-2">
              {stockCaps.eveningCount && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => setEveningDialog("count")}
                >
                  <Sunset className="h-5 w-5" />
                  <span className="text-sm">Closing Stock Count</span>
                </Button>
              )}
              {stockCaps.eveningAvailability && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => setEveningDialog("availability")}
                >
                  <Sunset className="h-5 w-5" />
                  <span className="text-sm">Stock Availability</span>
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
              onClick={openEveningReport}
            >
              <Sunset className="h-6 w-6" />
              <span>Start Evening Report</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const priceReportButton = showPriceReportButton ? (
    <Button
      type="button"
      variant="outline"
      className="w-full h-auto py-4 flex flex-col items-center gap-2"
      disabled={!hasStockLevels}
      onClick={() => setShowPriceReport(true)}
    >
      <DollarSign className="h-6 w-6" />
      <span>Start Price Report</span>
    </Button>
  ) : null;

  return (
    <>
      {embedded ? (
        <div className="space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock Reports
          </p>
          {buttons}
          {priceReportButton}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="text-h3 text-black flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Reports
            </h3>
            {buttons}
            {priceReportButton}
          </CardContent>
        </Card>
      )}

      <Suspense fallback={null}>
        {morningDialog === "availability" && (
          <StockReportDialog
            open
            reportType="morning"
            storeId={storeId}
            onStockLevelsChange={handleStockLevelsChange}
            onOpenChange={(open) => {
              if (!open) setMorningDialog(null);
            }}
            onComplete={() => {
              setMorningDialog(null);
              if (isEnabled("CRM-0021") && stockCaps.morningCount) {
                setMorningDialog("count");
              }
            }}
          />
        )}
        {morningDialog === "count" && (
          <InstoreMorningStockCountDialog
            open
            storeId={storeId}
            stockLevels={instoreStockLevels}
            onOpenChange={(open) => {
              if (!open) setMorningDialog(null);
            }}
            onComplete={() => setMorningDialog(null)}
          />
        )}
        {eveningDialog === "availability" && (
          <StockReportDialog
            open
            reportType="evening"
            storeId={storeId}
            onOpenChange={(open) => {
              if (!open) setEveningDialog(null);
            }}
            onComplete={() => setEveningDialog(null)}
          />
        )}
        {eveningDialog === "count" && (
          <InstoreClosingReportDialog
            open
            storeId={storeId}
            onOpenChange={(open) => {
              if (!open) setEveningDialog(null);
            }}
            onComplete={() => setEveningDialog(null)}
          />
        )}
      </Suspense>

      {showPriceReportButton && (
        <PriceReportDialog
          open={showPriceReport}
          onOpenChange={setShowPriceReport}
          storeId={storeId}
          stockLevels={instoreStockLevels}
          onComplete={() => setShowPriceReport(false)}
        />
      )}
    </>
  );
}
