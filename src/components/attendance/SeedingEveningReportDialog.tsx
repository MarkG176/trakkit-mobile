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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Camera, X, ImageIcon } from "lucide-react";

interface SalesSummaryItem {
  product_name: string;
  quantity_sold: number;
  total_value: number;
}

interface SeedingEveningReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const SeedingEveningReportDialog = ({ open, onOpenChange, onComplete }: SeedingEveningReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  const [salesSummary, setSalesSummary] = useState<SalesSummaryItem[]>([]);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetFormState = () => {
    setNotes("");
    setImages([]);
    setUploadProgress(0);
  };

  useEffect(() => {
    if (open) {
      resetFormState();
    }
  }, [open]);

  useEffect(() => {
    if (open && user) {
      fetchSalesSummary();
    }
  }, [open, user]);

  const fetchSalesSummary = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // Fetch from daily_sales_tracking
      const { data: salesTrackingData, error: salesError } = await supabase
        .from("daily_sales_tracking")
        .select("product_name, quantity_sold, total_value")
        .eq("agent_id", user.id)
        .eq("work_date", today);

      if (salesError) throw salesError;

      // Fetch from customer_purchases with product variant details
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("customer_purchases")
        .select("quantity, total_value, product_variant_id, product_variants(name)")
        .eq("agent_id", user.id)
        .gte("purchase_date", todayStart.toISOString())
        .lt("purchase_date", todayEnd.toISOString());

      if (purchasesError) throw purchasesError;

      // Fetch from sale_items
      const { data: saleItemsData, error: saleItemsError } = await supabase
        .from("sale_items")
        .select("product_name, quantity, total_price")
        .eq("agent_id", user.id)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", todayEnd.toISOString());

      if (saleItemsError) throw saleItemsError;

      // Aggregate all data by product name
      const aggregated: Record<string, SalesSummaryItem> = {};

      (salesTrackingData || []).forEach((item) => {
        const name = item.product_name || "Unknown Product";
        if (!aggregated[name]) {
          aggregated[name] = { product_name: name, quantity_sold: 0, total_value: 0 };
        }
        aggregated[name].quantity_sold += item.quantity_sold || 0;
        aggregated[name].total_value += Number(item.total_value) || 0;
      });

      (purchasesData || []).forEach((item) => {
        const productVariant = item.product_variants as { name: string } | null;
        const name = productVariant?.name || "Unknown Product";
        if (!aggregated[name]) {
          aggregated[name] = { product_name: name, quantity_sold: 0, total_value: 0 };
        }
        aggregated[name].quantity_sold += item.quantity || 0;
        aggregated[name].total_value += Number(item.total_value) || 0;
      });

      // Add sale_items data
      (saleItemsData || []).forEach((item) => {
        const name = item.product_name || "Unknown Product";
        if (!aggregated[name]) {
          aggregated[name] = { product_name: name, quantity_sold: 0, total_value: 0 };
        }
        aggregated[name].quantity_sold += item.quantity || 0;
        aggregated[name].total_value += Number(item.total_price) || 0;
      });

      setSalesSummary(Object.values(aggregated));
    } catch (error) {
      console.error("Error fetching sales summary:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sales summary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a report",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save notes if provided
      if (notes.trim()) {
        const { error } = await supabase.from("notes").insert({
          agent_id: user.id,
          workspace_id: currentWorkspaceId,
          content: notes.trim(),
          note_type: "daily_report",
        });
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notes",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // 2. Upload engagement photos to agent-selfies bucket (same path as Report page)
    let imageUploadFailed = false;
    if (images.length > 0) {
      try {
        let uploaded = 0;
        const uploadPromises = images.map(async (image) => {
          const fileExt = image.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${user.id}/Capwell/${fileName}`;

          const { error } = await supabase.storage.from("agent-selfies").upload(filePath, image, {
            cacheControl: "3600",
            upsert: false,
          });

          if (error) {
            console.error("Upload error for", filePath, ":", error);
            throw error;
          }

          uploaded++;
          setUploadProgress(Math.round((uploaded / images.length) * 100));
          return filePath;
        });

        await Promise.all(uploadPromises);
      } catch (error) {
        console.error("Error uploading images:", error);
        imageUploadFailed = true;
      }
    }

    setIsSubmitting(false);

    if (imageUploadFailed) {
      toast({
        title: "Partial Success",
        description: "Notes saved, but some photos failed to upload. Please try uploading photos again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Evening report submitted successfully",
      });
    }

    resetFormState();
    onOpenChange(false);
    onComplete?.();
  };

  const totalQuantity = salesSummary.reduce((sum, item) => sum + item.quantity_sold, 0);
  const totalValue = salesSummary.reduce((sum, item) => sum + item.total_value, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evening Report</DialogTitle>
          <DialogDescription>Review your sales, add notes, and upload engagement photos</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sales Summary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Today's Sales Summary</Label>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : salesSummary.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                <Package className="h-8 w-8 mb-2" />
                <p className="text-sm">No sales recorded today</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  {salesSummary.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-foreground">{item.product_name}</span>
                      <span className="text-muted-foreground font-medium">{item.quantity_sold} units</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t text-sm font-medium">
                  <span>Total Units Sold</span>
                  <span className="text-primary">{totalQuantity}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>Total Value</span>
                  <span className="text-primary">KES {totalValue.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="seeding-notes">Daily Notes (Optional)</Label>
            <Textarea
              id="seeding-notes"
              placeholder="Add any notes about your day, challenges, or feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Engagement Photos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Engagement Photos
            </Label>
            <p className="text-xs text-muted-foreground">Upload photos from today's field engagement</p>

            <Input type="file" accept="image/*" multiple onChange={handleImageSelect} className="cursor-pointer" />

            {images.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{images.length} photo(s) selected</p>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : "Submitting..."}
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
