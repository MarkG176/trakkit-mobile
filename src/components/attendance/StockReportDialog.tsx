import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

type StockLevel = "available" | "low_stock" | "unavailable" | "not_sold";

interface StockReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: "morning" | "evening";
  onComplete: () => void;
  storeId?: string | null;
  onStockLevelsChange?: (levels: Record<string, string>) => void;
}

export const StockReportDialog = ({
  open,
  onOpenChange,
  reportType,
  onComplete,
  storeId,
  onStockLevelsChange,
}: StockReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { toast } = useToast();
  const [stockLevels, setStockLevels] = useState<Record<string, StockLevel>>({});
  const [salesData, setSalesData] = useState<Record<string, number>>({});
  const [loadingSales, setLoadingSales] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch sales data for evening report
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!open || reportType !== "evening" || !user) return;
      
      setLoadingSales(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        
        const { data, error } = await supabase
          .from("daily_sales_tracking")
          .select("product_variant_id, quantity_sold")
          .eq("agent_id", user.id)
          .eq("work_date", today);

        if (error) throw error;

        // Aggregate sales by product variant (in case of multiple entries)
        const salesByProduct: Record<string, number> = {};
        (data || []).forEach((sale) => {
          const currentQty = salesByProduct[sale.product_variant_id] || 0;
          salesByProduct[sale.product_variant_id] = currentQty + sale.quantity_sold;
        });

        setSalesData(salesByProduct);
      } catch (error) {
        console.error("Error fetching sales data:", error);
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive",
        });
      } finally {
        setLoadingSales(false);
      }
    };

    fetchSalesData();
  }, [open, reportType, user]);

  const handleStockLevelChange = (productVariantId: string, level: StockLevel) => {
    const newLevels = {
      ...stockLevels,
      [productVariantId]: level,
    };
    setStockLevels(newLevels);
    onStockLevelsChange?.(newLevels as Record<string, string>);
  };

  const getStockIcon = (level: StockLevel | undefined) => {
    switch (level) {
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
      case "low_stock":
        return <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />;
      case "unavailable":
        return <XCircle className="h-4 w-4 text-red-600 shrink-0" />;
      case "not_sold":
        return <Package className="h-4 w-4 text-muted-foreground shrink-0" />;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!user || !currentWorkspaceId) {
      toast({
        title: "Error",
        description: "Missing user or workspace context",
        variant: "destructive",
      });
      return;
    }

    if (reportType === "morning") {
      // Check if all products have been reported for morning
      const unreportedProducts = inventory.filter(
        (item) => !stockLevels[item.product_variant_id]
      );

      if (unreportedProducts.length > 0) {
        toast({
          title: "Incomplete Report",
          description: `Please report stock level for all ${unreportedProducts.length} remaining product(s)`,
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      
      if (reportType === "morning") {
        // Morning report - stock levels
        const reports = inventory.map((item) => ({
          agent_id: user.id,
          product_variant_id: item.product_variant_id,
          stock_level: stockLevels[item.product_variant_id],
          quantity_sold: null,
          report_type: reportType,
          work_date: today,
          workspace_id: currentWorkspaceId,
          store_id: storeId || null,
        }));

        const { error } = await supabase
          .from("daily_stock_reports")
          .insert(reports);

        if (error) throw error;
      } else {
        // Evening report - numbers sold (read from sales data)
        const reports = inventory.map((item) => ({
          agent_id: user.id,
          product_variant_id: item.product_variant_id,
          stock_level: null,
          quantity_sold: salesData[item.product_variant_id] || 0,
          report_type: reportType,
          work_date: today,
          workspace_id: currentWorkspaceId,
          store_id: storeId || null,
        }));

        const { error } = await supabase
          .from("daily_stock_reports")
          .insert(reports);

        if (error) throw error;
      }

      toast({
        title: "Stock Report Submitted",
        description: `${reportType === "morning" ? "Morning" : "Evening"} stock report saved successfully`,
      });

      // Reset state and close
      setStockLevels({});
      setSalesData({});
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting stock report:", error);
      toast({
        title: "Error",
        description: "Failed to submit stock report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const allMorningReported = inventory.length > 0 && 
    inventory.every((item) => stockLevels[item.product_variant_id]);
  
  const canSubmitEvening = inventory.length > 0 && !loadingSales;
  const canSubmit = reportType === "morning" ? allMorningReported : canSubmitEvening;

  const isLoading = inventoryLoading || (reportType === "evening" && loadingSales);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {reportType === "morning" ? "Morning" : "Evening"} Stock Report
          </DialogTitle>
          <DialogDescription>
            {reportType === "morning" 
              ? "Report the current stock level for each product in your inventory."
              : "Review the number of units sold for each product today."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading {reportType === "evening" ? "sales data" : "inventory"}...
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No products in your inventory to report.
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4 [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
            <div className="space-y-3">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  {reportType === "morning" ? (
                    // Morning layout - vertical stack for mobile
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        {getStockIcon(stockLevels[item.product_variant_id])}
                        <Label className="font-medium leading-tight">{item.name}</Label>
                      </div>
                      <Select
                        value={stockLevels[item.product_variant_id] || ""}
                        onValueChange={(value) =>
                          handleStockLevelChange(item.product_variant_id, value as StockLevel)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select stock level..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Available
                            </span>
                          </SelectItem>
                          <SelectItem value="low_stock">
                            <span className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              Low Stock
                            </span>
                          </SelectItem>
                          <SelectItem value="unavailable">
                            <span className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              Unavailable
                            </span>
                          </SelectItem>
                          <SelectItem value="not_sold">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              Not Sold
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    // Evening layout - read-only sales display
                    <div className="space-y-2">
                      <Label className="font-medium leading-tight block">{item.name}</Label>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground shrink-0">Number sold:</Label>
                        <Input
                          type="number"
                          value={salesData[item.product_variant_id] || 0}
                          readOnly
                          disabled
                          className="w-24 bg-muted"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit || inventory.length === 0}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};