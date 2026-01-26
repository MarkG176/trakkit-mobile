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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Package, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useInventory, InventoryItem } from "@/hooks/useInventory";
import { toast } from "sonner";

type StockLevel = 'available' | 'low_stock' | 'unavailable';

interface StockReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'morning' | 'evening';
}

interface ProductStockReport {
  product_variant_id: string;
  stock_level: StockLevel;
}

export const StockReportDialog = ({ isOpen, onClose, reportType }: StockReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { inventory, loading: inventoryLoading } = useInventory();
  const [stockReports, setStockReports] = useState<Record<string, StockLevel>>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize stock reports when inventory loads
  useEffect(() => {
    if (inventory.length > 0) {
      const initialReports: Record<string, StockLevel> = {};
      inventory.forEach(item => {
        initialReports[item.product_variant_id] = 'available';
      });
      setStockReports(initialReports);
    }
  }, [inventory]);

  const handleStockLevelChange = (productVariantId: string, level: StockLevel) => {
    setStockReports(prev => ({
      ...prev,
      [productVariantId]: level
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to submit a stock report");
      return;
    }

    // Check if all items have been reported
    const allReported = inventory.every(item => stockReports[item.product_variant_id]);
    if (!allReported) {
      toast.error("Please report stock levels for all products");
      return;
    }

    setSubmitting(true);

    try {
      // Create stock report entries for each product
      const reports = inventory.map(item => ({
        agent_id: user.id,
        product_variant_id: item.product_variant_id,
        stock_level: stockReports[item.product_variant_id],
        report_type: reportType,
        workspace_id: currentWorkspaceId,
        reported_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('stock_reports')
        .insert(reports);

      if (error) throw error;

      toast.success(`${reportType === 'morning' ? 'Morning' : 'Evening'} stock report submitted successfully!`);
      onClose();
    } catch (error) {
      console.error("Error submitting stock report:", error);
      toast.error("Failed to submit stock report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStockLevelIcon = (level: StockLevel) => {
    switch (level) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStockLevelLabel = (level: StockLevel) => {
    switch (level) {
      case 'available':
        return 'Available';
      case 'low_stock':
        return 'Low Stock';
      case 'unavailable':
        return 'Unavailable';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {reportType === 'morning' ? 'Morning' : 'Evening'} Stock Report
          </DialogTitle>
          <DialogDescription>
            Report the current stock levels for each product in your inventory.
          </DialogDescription>
        </DialogHeader>

        {inventoryLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading inventory...</span>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No inventory items assigned</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inventory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{item.name || 'Unknown Product'}</span>
                </div>
                
                <RadioGroup
                  value={stockReports[item.product_variant_id] || 'available'}
                  onValueChange={(value) => handleStockLevelChange(item.product_variant_id, value as StockLevel)}
                  className="flex gap-4"
                >
                  {(['available', 'low_stock', 'unavailable'] as StockLevel[]).map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level} id={`${item.id}-${level}`} />
                      <Label 
                        htmlFor={`${item.id}-${level}`}
                        className="flex items-center gap-1 text-xs cursor-pointer"
                      >
                        {getStockLevelIcon(level)}
                        {getStockLevelLabel(level)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || inventoryLoading || inventory.length === 0}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
