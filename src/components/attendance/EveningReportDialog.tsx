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
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package } from "lucide-react";

interface SalesSummaryItem {
  product_name: string;
  quantity_sold: number;
  total_value: number;
}

interface EveningReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const EveningReportDialog = ({ open, onOpenChange, onComplete }: EveningReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  const [salesSummary, setSalesSummary] = useState<SalesSummaryItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setNotes("");
    }
  }, [open]);

  useEffect(() => {
    if (open && user && currentWorkspaceId) {
      const fetchSalesSummary = async () => {
        setIsLoading(true);
        try {
          const today = new Date().toISOString().split("T")[0];

          const { data, error } = await supabase
            .from("daily_sales_tracking")
            .select("product_name, quantity_sold, total_value")
            .eq("agent_id", user.id)
            .eq("workspace_id", currentWorkspaceId)
            .eq("work_date", today);

          if (error) throw error;

          const aggregated: Record<string, SalesSummaryItem> = {};
          (data || []).forEach((item) => {
            const name = item.product_name || "Unknown Product";
            if (!aggregated[name]) {
              aggregated[name] = { product_name: name, quantity_sold: 0, total_value: 0 };
            }
            aggregated[name].quantity_sold += item.quantity_sold || 0;
            aggregated[name].total_value += Number(item.total_value) || 0;
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

      fetchSalesSummary();
    }
  }, [open, user, currentWorkspaceId, toast]);

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
      if (notes.trim()) {
        const { error } = await supabase.from("notes").insert({
          agent_id: user.id,
          workspace_id: currentWorkspaceId,
          content: notes.trim(),
          note_type: "daily_report",
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Evening report submitted successfully",
      });

      setNotes("");
      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error("Error submitting evening report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuantity = salesSummary.reduce((sum, item) => sum + item.quantity_sold, 0);
  const totalValue = salesSummary.reduce((sum, item) => sum + item.total_value, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evening Report</DialogTitle>
          <DialogDescription>Review your sales and add notes for the day</DialogDescription>
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
            <Label htmlFor="evening-notes">Daily Notes (Optional)</Label>
            <Textarea
              id="evening-notes"
              placeholder="Add any notes about your day, challenges, or feedback..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
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
