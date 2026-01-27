import React, { useState } from "react";
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
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

type StockLevel = "available" | "low_stock" | "unavailable";

interface StockReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: "morning" | "evening";
  onComplete: () => void;
}

export const StockReportDialog = ({
  open,
  onOpenChange,
  reportType,
  onComplete,
}: StockReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { toast } = useToast();
  const [stockLevels, setStockLevels] = useState<Record<string, StockLevel>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleStockLevelChange = (productVariantId: string, level: StockLevel) => {
    setStockLevels((prev) => ({
      ...prev,
      [productVariantId]: level,
    }));
  };

  const getStockIcon = (level: StockLevel | undefined) => {
    switch (level) {
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "low_stock":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "unavailable":
        return <XCircle className="h-4 w-4 text-red-600" />;
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

    // Check if all products have been reported
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

    setSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      
      // Prepare batch insert
      const reports = inventory.map((item) => ({
        agent_id: user.id,
        product_variant_id: item.product_variant_id,
        stock_level: stockLevels[item.product_variant_id],
        report_type: reportType,
        work_date: today,
        workspace_id: currentWorkspaceId,
      }));

      const { error } = await supabase
        .from("daily_stock_reports")
        .insert(reports);

      if (error) throw error;

      toast({
        title: "Stock Report Submitted",
        description: `${reportType === "morning" ? "Morning" : "Evening"} stock report saved successfully`,
      });

      // Reset state and close
      setStockLevels({});
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

  const allReported = inventory.length > 0 && 
    inventory.every((item) => stockLevels[item.product_variant_id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {reportType === "morning" ? "Morning" : "Evening"} Stock Report
          </DialogTitle>
          <DialogDescription>
            Report the current stock level for each product in your inventory.
          </DialogDescription>
        </DialogHeader>

        {inventoryLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading inventory...
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No products in your inventory to report.
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStockIcon(stockLevels[item.product_variant_id])}
                    <Label className="font-medium truncate">{item.name}</Label>
                  </div>
                  <Select
                    value={stockLevels[item.product_variant_id] || ""}
                    onValueChange={(value) =>
                      handleStockLevelChange(item.product_variant_id, value as StockLevel)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Select..." />
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
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !allReported || inventory.length === 0}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
