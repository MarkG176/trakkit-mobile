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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface PriceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  storeId?: string | null;
  stockLevels: Record<string, string>;
}

export const PriceReportDialog = ({
  open,
  onOpenChange,
  onComplete,
  storeId,
  stockLevels,
}: PriceReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { toast } = useToast();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Filter inventory to only show products with stock levels (available, low_stock, unavailable)
  const eligibleProducts = inventory.filter((item) => {
    const level = stockLevels[item.product_variant_id];
    return level === "available" || level === "low_stock" || level === "unavailable";
  });

  const handlePriceChange = (productVariantId: string, value: string) => {
    setPrices((prev) => ({
      ...prev,
      [productVariantId]: value,
    }));
  };

  const getStockBadge = (level: string) => {
    switch (level) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Available
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
            <AlertTriangle className="h-3 w-3" /> Low Stock
          </span>
        );
      case "unavailable":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
            <XCircle className="h-3 w-3" /> Unavailable
          </span>
        );
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

    // Check all eligible products have prices
    const missingPrices = eligibleProducts.filter(
      (item) => !prices[item.product_variant_id] || parseFloat(prices[item.product_variant_id]) <= 0
    );

    if (missingPrices.length > 0) {
      toast({
        title: "Incomplete Report",
        description: `Please enter prices for all ${missingPrices.length} remaining product(s)`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      const reports = eligibleProducts.map((item) => ({
        agent_id: user.id,
        store_id: storeId || null,
        product_variant_id: item.product_variant_id,
        price: parseFloat(prices[item.product_variant_id]) || 0,
        stock_level: stockLevels[item.product_variant_id] || null,
        work_date: today,
        workspace_id: currentWorkspaceId,
      }));

      const { error } = await supabase
        .from("store_price_reports" as any)
        .insert(reports);

      if (error) throw error;

      toast({
        title: "Price Report Submitted",
        description: "Store price report saved successfully",
      });

      setPrices({});
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting price report:", error);
      toast({
        title: "Error",
        description: "Failed to submit price report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const allPricesEntered =
    eligibleProducts.length > 0 &&
    eligibleProducts.every(
      (item) => prices[item.product_variant_id] && parseFloat(prices[item.product_variant_id]) > 0
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Report
          </DialogTitle>
          <DialogDescription>
            Enter the selling price for each product at this store. Only products with stock levels are shown.
          </DialogDescription>
        </DialogHeader>

        {inventoryLoading ? (
          <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading products...
          </div>
        ) : eligibleProducts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No products with stock levels to report prices for. Please complete the Stock Report first.
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh] pr-4 [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
            <div className="space-y-3">
              {eligibleProducts.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-medium leading-tight">{item.name}</Label>
                    {getStockBadge(stockLevels[item.product_variant_id])}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground shrink-0">Price (KES):</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={prices[item.product_variant_id] || ""}
                      onChange={(e) => handlePriceChange(item.product_variant_id, e.target.value)}
                      className="w-28"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !allPricesEntered || eligibleProducts.length === 0}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Price Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
