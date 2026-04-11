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
import { Loader2, Package, ClipboardList } from "lucide-react";
import { logActivity, logFailedActivity } from "@/utils/activityLogger";

interface ProductCount {
  product_variant_id: string;
  name: string;
  opening_stock: string;
}

interface InstoreMorningStockCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  storeId?: string | null;
  stockLevels?: Record<string, string>;
}

export const InstoreMorningStockCountDialog = ({
  open,
  onOpenChange,
  onComplete,
  storeId,
  stockLevels,
}: InstoreMorningStockCountDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const { inventory, loading: inventoryLoading } = useInventory();

  const [products, setProducts] = useState<ProductCount[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user || !currentWorkspaceId || inventoryLoading) return;

    const syncProducts = async () => {
      setIsLoadingExisting(true);
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

        const existingCounts = new Map<string, number>();
        (data || []).forEach((row) => {
          if (!existingCounts.has(row.product_variant_id) && row.opening_stock !== null) {
            existingCounts.set(row.product_variant_id, row.opening_stock);
          }
        });

        const eligibleInventory = inventory.filter((item) => {
          const level = stockLevels?.[item.product_variant_id];
          return level !== "unavailable" && level !== "not_sold";
        });

        setProducts(
          eligibleInventory.map((item) => ({
            product_variant_id: item.product_variant_id,
            name: item.sku ? `${item.sku} - ${item.name}` : item.name || "Unknown Product",
            opening_stock: existingCounts.has(item.product_variant_id)
              ? String(existingCounts.get(item.product_variant_id) ?? "")
              : "",
          }))
        );
      } catch (error) {
        console.error("Error fetching morning stock count data:", error);
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        });
      } finally {
        setIsLoadingExisting(false);
      }
    };

    syncProducts();
  }, [open, user, currentWorkspaceId, inventory, inventoryLoading, storeId, stockLevels, toast]);

  const updateProduct = (index: number, value: string) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], opening_stock: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!user || !currentWorkspaceId) {
      toast({
        title: "Error",
        description: "You must be logged in to submit",
        variant: "destructive",
      });
      return;
    }

    const hasData = products.some((p) => p.opening_stock !== "");
    if (!hasData) {
      toast({
        title: "Error",
        description: "Please enter stock count for at least one product",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const reportsToInsert = products
        .filter((p) => p.opening_stock !== "")
        .map((p) => ({
          agent_id: user.id,
          product_variant_id: p.product_variant_id,
          opening_stock: parseInt(p.opening_stock) || 0,
          quantity_sold: 0,
          closing_stock: 0,
          report_type: "morning",
          work_date: today,
          workspace_id: currentWorkspaceId,
          store_id: storeId || null,
        }));

      const { error } = await supabase
        .from("daily_stock_reports")
        .insert(reportsToInsert);

      if (error) throw error;

      logActivity({
        action: "morning_stock_count",
        category: "stock_report",
        details: { productsCount: reportsToInsert.length, storeId },
        workspaceId: currentWorkspaceId,
      });

      toast({
        title: "Success",
        description: "Morning stock count submitted successfully",
      });

      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error("Error submitting stock count:", error);
      logFailedActivity("morning_stock_count", "stock_report", error, { storeId }, currentWorkspaceId);
      toast({
        title: "Error",
        description: "Failed to submit stock count",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = inventoryLoading || isLoadingExisting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Morning Stock Count
          </DialogTitle>
          <DialogDescription>
            Enter the opening stock quantity for each product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
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
            products.map((product, index) => (
              <div
                key={product.product_variant_id}
                className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
              >
                <Label className="text-sm font-medium flex-1 break-words whitespace-normal leading-snug">
                  {product.name}
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={product.opening_stock}
                  onChange={(e) => updateProduct(index, e.target.value)}
                  className="h-9 w-24 text-center text-sm"
                />
              </div>
            ))
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
              "Submit Count"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
