import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const eligibleProducts = inventory.filter((item) => {
    const level = stockLevels[item.product_variant_id];
    return level === "available" || level === "low_stock" || level === "unavailable";
  });

  const currentProduct = eligibleProducts[currentIndex];
  const totalProducts = eligibleProducts.length;

  const handlePriceChange = (productVariantId: string, value: string) => {
    setPrices((prev) => ({
      ...prev,
      [productVariantId]: value,
    }));
  };

  const goNext = () => {
    if (currentIndex < totalProducts - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
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
            <XCircle className="h-3 w-3" /> Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  const filledCount = eligibleProducts.filter(
    (item) => prices[item.product_variant_id] && parseFloat(prices[item.product_variant_id]) > 0
  ).length;

  const allPricesEntered = totalProducts > 0 && filledCount === totalProducts;

  const handleSubmit = async () => {
    if (!user || !currentWorkspaceId) {
      toast({ title: "Error", description: "Missing user or workspace context", variant: "destructive" });
      return;
    }

    if (!allPricesEntered) {
      toast({
        title: "Incomplete Report",
        description: `Please enter prices for all products (${filledCount}/${totalProducts} done)`,
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

      const { error } = await supabase.from("store_price_reports" as any).insert(reports);
      if (error) throw error;

      toast({ title: "Price Report Submitted", description: "Store price report saved successfully" });
      setPrices({});
      setCurrentIndex(0);
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting price report:", error);
      toast({ title: "Error", description: "Failed to submit price report.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Report
          </DialogTitle>
        </DialogHeader>

        {inventoryLoading ? (
          <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading products...
          </div>
        ) : totalProducts === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No products with stock levels to report. Complete the Stock Report first.
          </div>
        ) : currentProduct ? (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Product {currentIndex + 1} of {totalProducts}</span>
              <span>{filledCount}/{totalProducts} priced</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary rounded-full h-1.5 transition-all"
                style={{ width: `${((currentIndex + 1) / totalProducts) * 100}%` }}
              />
            </div>

            {/* Product card */}
            <div className="p-6 rounded-xl border bg-card text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{currentProduct.name}</h3>
                {getStockBadge(stockLevels[currentProduct.product_variant_id])}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-sm text-muted-foreground">Selling Price (KES)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter price..."
                  value={prices[currentProduct.product_variant_id] || ""}
                  onChange={(e) => handlePriceChange(currentProduct.product_variant_id, e.target.value)}
                  className="text-center text-lg h-12"
                  autoFocus
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={currentIndex === totalProducts - 1}
                className="flex-1"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 flex-wrap">
              {eligibleProducts.map((item, idx) => {
                const hasPriceValue = prices[item.product_variant_id] && parseFloat(prices[item.product_variant_id]) > 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      idx === currentIndex
                        ? "bg-primary scale-125"
                        : hasPriceValue
                        ? "bg-primary/40"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !allPricesEntered || totalProducts === 0}
            className="w-full"
          >
            {submitting ? "Submitting..." : `Submit All Prices (${filledCount}/${totalProducts})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
