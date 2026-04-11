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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sun, DollarSign, Moon, Package } from "lucide-react";
import { logActivity, logFailedActivity } from "@/utils/activityLogger";

interface ProductReport {
  product_variant_id: string;
  name: string;
  opening_stock: string;
  quantity_sold: string;
  closing_stock: string;
}

interface InstoreClosingReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  storeId?: string | null;
}

export const InstoreClosingReportDialog = ({
  open,
  onOpenChange,
  onComplete,
  storeId,
}: InstoreClosingReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const { inventory, loading: inventoryLoading } = useInventory();

  const [products, setProducts] = useState<ProductReport[]>([]);
  const [isLoadingMorningCounts, setIsLoadingMorningCounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user || !currentWorkspaceId || inventoryLoading) return;

    const syncProducts = async () => {
      setIsLoadingMorningCounts(true);
      try {
        const today = new Date().toISOString().split("T")[0];

        let query = supabase
          .from("daily_stock_reports")
          .select("product_variant_id, opening_stock, reported_at")
          .eq("agent_id", user.id)
          .eq("work_date", today)
          .eq("report_type", "morning")
          .eq("workspace_id", currentWorkspaceId)
          .is("stock_level", null)
          .order("reported_at", { ascending: false });

        if (storeId) {
          query = query.eq("store_id", storeId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const morningStockMap = new Map<string, number>();
        (data || []).forEach((row) => {
          if (!morningStockMap.has(row.product_variant_id) && row.opening_stock !== null) {
            morningStockMap.set(row.product_variant_id, row.opening_stock);
          }
        });

        setProducts(
          inventory.map((item) => ({
            product_variant_id: item.product_variant_id,
            name: item.sku ? `${item.sku} - ${item.name}` : item.name || "Unknown Product",
            opening_stock: morningStockMap.has(item.product_variant_id)
              ? String(morningStockMap.get(item.product_variant_id) ?? "")
              : "",
            quantity_sold: "",
            closing_stock: "",
          }))
        );
      } catch (error) {
        console.error("Error fetching closing report data:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMorningCounts(false);
      }
    };

    syncProducts();
  }, [open, user, currentWorkspaceId, inventory, inventoryLoading, storeId, toast]);

  const updateProduct = (
    index: number,
    field: "opening_stock" | "quantity_sold" | "closing_stock",
    value: string
  ) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!user || !currentWorkspaceId) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a report",
        variant: "destructive",
      });
      return;
    }

    const hasData = products.some(
      (p) => p.opening_stock !== "" || p.quantity_sold !== "" || p.closing_stock !== ""
    );

    if (!hasData) {
      toast({
        title: "Error",
        description: "Please fill in at least one product's data",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const reportsToInsert = products
        .filter((p) => p.opening_stock !== "" || p.quantity_sold !== "" || p.closing_stock !== "")
        .map((p) => ({
          agent_id: user.id,
          product_variant_id: p.product_variant_id,
          opening_stock: parseInt(p.opening_stock) || 0,
          quantity_sold: parseInt(p.quantity_sold) || 0,
          closing_stock: parseInt(p.closing_stock) || 0,
          report_type: "evening",
          work_date: today,
          workspace_id: currentWorkspaceId,
          store_id: storeId || null,
        }));

      const { error } = await supabase
        .from("daily_stock_reports")
        .insert(reportsToInsert);

      if (error) throw error;

      logActivity({
        action: "closing_report",
        category: "stock_report",
        details: { productsCount: reportsToInsert.length, storeId },
        workspaceId: currentWorkspaceId,
      });

      toast({
        title: "Success",
        description: "Closing report submitted successfully",
      });

      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error("Error submitting closing report:", error);
      logFailedActivity("closing_report", "stock_report", error, { storeId }, currentWorkspaceId);
      toast({
        title: "Error",
        description: "Failed to submit closing report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = inventoryLoading || isLoadingMorningCounts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Closing Report</DialogTitle>
          <DialogDescription>
            Enter your stock numbers for each product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isLoading && products.length > 0 && (
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <div />
              <div className="grid grid-cols-3 gap-2 w-[180px]">
                <div className="flex flex-col items-center">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] text-muted-foreground">Open</span>
                </div>
                <div className="flex flex-col items-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-[10px] text-muted-foreground">Sales</span>
                </div>
                <div className="flex flex-col items-center">
                  <Moon className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] text-muted-foreground">Close</span>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mb-2" />
              <p className="text-sm">No products assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => (
                <div
                  key={product.product_variant_id}
                  className="grid grid-cols-[1fr_auto] items-start gap-2 bg-muted/50 rounded-lg p-3"
                >
                  <Label className="text-sm font-medium break-words whitespace-normal leading-snug">
                    {product.name}
                  </Label>
                  <div className="grid grid-cols-3 gap-2 w-[180px]">
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={product.opening_stock}
                      onChange={(e) => updateProduct(index, "opening_stock", e.target.value)}
                      className="h-9 text-center text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={product.quantity_sold}
                      onChange={(e) => updateProduct(index, "quantity_sold", e.target.value)}
                      className="h-9 text-center text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={product.closing_stock}
                      onChange={(e) => updateProduct(index, "closing_stock", e.target.value)}
                      className="h-9 text-center text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || products.length === 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
