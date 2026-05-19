// [CMP-8d141b] Reports — agent reports hub
import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, FileText, Download, Package, Loader2, Sunrise, Sunset } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";
import { useInventory } from "@/hooks/useInventory";
import { formatProductName } from "@/utils/formatProductName";
import { workspaceService } from "@/services/workspaceService";
import { InstoreClosingReportDialog } from "@/components/attendance/InstoreClosingReportDialog";
import { InstoreMorningStockCountDialog } from "@/components/attendance/InstoreMorningStockCountDialog";
import { toast } from "sonner";

export const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const showSalesReport = isEnabled('CRM-0099S');
  const showStockReports = isEnabled('CRM-0099K');
  const showExportReport = isEnabled('CRM-0099X');
  const [showMorningReport, setShowMorningReport] = useState(false);
  const [showEveningReport, setShowEveningReport] = useState(false);
  const { inventory, loading: inventoryLoading } = useInventory();
  const [submitting, setSubmitting] = useState(false);
  const [salesQuantities, setSalesQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [reportType, setReportType] = useState("");

  const handleQuantityChange = (productVariantId: string, value: string) => {
    const num = parseInt(value) || 0;
    setSalesQuantities(prev => ({ ...prev, [productVariantId]: num }));
  };

  const handleSubmitSales = async () => {
    if (!user || !currentWorkspaceId) {
      toast.error("Missing user or workspace context");
      return;
    }

    const entries = inventory.filter(item => (salesQuantities[item.product_variant_id] || 0) > 0);
    if (entries.length === 0) {
      toast.error("Please enter quantities for at least one product");
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = entries.map(item => ({
        agent_id: user.id,
        product_variant_id: item.product_variant_id,
        product_name: formatProductName(item.name, item.sku),
        quantity_sold: salesQuantities[item.product_variant_id],
        total_value: 0,
        status_event: 'sale',
        work_date: today,
        workspace_id: currentWorkspaceId,
      }));

      const { error } = await supabase.from('daily_sales_tracking').insert(records);
      if (error) throw error;

      toast.success("Sales report submitted!");
      setSalesQuantities({});
    } catch (error) {
      console.error("Error submitting sales:", error);
      toast.error("Failed to submit sales report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !notes.trim()) {
      toast.error("Please enter some notes");
      return;
    }

    const workspaceId = currentWorkspaceId || workspaceService.getCurrentWorkspaceId();
    if (!workspaceId) {
      toast.error("No workspace selected.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('notes').insert({
        agent_id: user.id,
        workspace_id: workspaceId,
        content: notes,
      });
      if (error) throw error;
      toast.success("Notes saved!");
      setNotes("");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImages = async () => {
    if (!user || images.length === 0) {
      toast.error("Please select images to upload");
      return;
    }

    setSubmitting(true);
    try {
      const uploadPromises = images.map(async (image) => {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/Capwell/${fileName}`;

        const { error } = await supabase.storage
          .from('agent-selfies')
          .upload(filePath, image, { cacheControl: '3600', upsert: false });

        if (error) throw error;
        return filePath;
      });

      await Promise.all(uploadPromises);
      toast.success("Images uploaded successfully!");
      setImages([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user || !currentWorkspaceId) {
      toast.error("Missing user or workspace context");
      return;
    }

    if (!reportType) {
      toast.error("Please select a report type");
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Submit all product quantities as a report with the selected type
      const records = inventory.map(item => ({
        agent_id: user.id,
        product_variant_id: item.product_variant_id,
        product_name: formatProductName(item.name, item.sku),
        quantity_sold: salesQuantities[item.product_variant_id] || 0,
        total_value: 0,
        status_event: reportType,
        work_date: today,
        workspace_id: currentWorkspaceId,
        agent_name: user.user_metadata?.display_name || user.email || '',
      }));

      const { error } = await supabase.from('daily_sales_tracking').insert(records);
      if (error) throw error;

      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated and saved!`);
      setSalesQuantities({});
      setReportType("");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout currentPage="reports">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
              <h1 className="text-h1">{showSalesReport ? 'Sales Report' : 'Notes & Images'}</h1>
        </div>
        <p className="text-sm opacity-90">{showSalesReport ? 'Record your sales for the day' : 'Add notes and attach images'}</p>
      </div>

      <div className="p-4 space-y-6">
        {showStockReports && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-h3 mb-6 text-black flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Reports
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setShowMorningReport(true)}
                >
                  <Sunrise className="h-6 w-6" />
                  <span>Start Morning Report</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setShowEveningReport(true)}
                >
                  <Sunset className="h-6 w-6" />
                  <span>Start Evening Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <h3 className="text-h3 mb-6 text-black">Notes</h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Add your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={submitting || !notes.trim()}
              >
                <FileText className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-h3 mb-6 text-black">Attach Images</h3>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setImages(Array.from(e.target.files));
                    toast.success(`${e.target.files.length} image(s) selected`);
                  }
                }}
              />
              {images.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {images.length} image(s) selected
                </div>
              )}
              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={handleUploadImages}
                disabled={submitting || images.length === 0}
              >
                <Camera className="mr-2 h-4 w-4" />
                {submitting ? "Uploading..." : "Upload Images"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showExportReport && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-h3 mb-6 text-black">Export Report</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="midday">Midday</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleGenerateReport}
                  disabled={submitting || !reportType}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {submitting ? "Generating..." : "Generate and Export Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {inventoryLoading && (
          <div className="text-center text-muted-foreground">
            Loading products...
          </div>
        )}
      </div>

      {!showSalesReport && (
        <>
          <InstoreMorningStockCountDialog
            open={showMorningReport}
            onOpenChange={setShowMorningReport}
            onComplete={() => setShowMorningReport(false)}
          />
          <InstoreClosingReportDialog
            open={showEveningReport}
            onOpenChange={setShowEveningReport}
            onComplete={() => setShowEveningReport(false)}
          />
        </>
      )}
    </MobileLayout>
  );
};
