// [CMP-8d141b] Reports — field notes, images, and optional stock reports
import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, FileText, Package, Sunrise, Sunset } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";
import { workspaceService } from "@/services/workspaceService";
import { InstoreClosingReportDialog } from "@/components/attendance/InstoreClosingReportDialog";
import { InstoreMorningStockCountDialog } from "@/components/attendance/InstoreMorningStockCountDialog";
import { toast } from "sonner";

export const Reports = () => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { isEnabled } = useProjectComponents();

  const showMorningStock = isEnabled("CRM-0021");
  const showClosingStock = isEnabled("CRM-0020");
  const showStockSection = showMorningStock || showClosingStock;

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [showMorningReport, setShowMorningReport] = useState(false);
  const [showEveningReport, setShowEveningReport] = useState(false);

  const resolveWorkspaceId = () =>
    currentWorkspaceId ?? workspaceService.getCurrentWorkspaceId();

  const handleSaveNotes = async () => {
    if (!user || !notes.trim()) {
      toast.error("Please enter some notes");
      return;
    }

    const workspaceId = resolveWorkspaceId();
    if (!workspaceId) {
      toast.error("No workspace selected.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("notes").insert({
        agent_id: user.id,
        workspace_id: workspaceId,
        content: notes.trim(),
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
      await Promise.all(
        images.map(async (image) => {
          const fileExt = image.name.split(".").pop() ?? "jpg";
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
          const filePath = `${user.id}/reports/${fileName}`;

          const { error } = await supabase.storage
            .from("agent-selfies")
            .upload(filePath, image, { cacheControl: "3600", upsert: false });

          if (error) throw error;
        }),
      );

      toast.success("Images uploaded successfully!");
      setImages([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout currentPage="reports">
      <TopBar />

      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Reports</h1>
        <p className="text-sm opacity-90">
          Log customer feedback, competitor activity, notes, and photos from the field.
        </p>
      </div>

      <div className="p-4 space-y-6">
        {showStockSection && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-h3 mb-6 text-black flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Reports
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {showMorningStock && (
                  <Button
                    type="button"
                    className="w-full h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setShowMorningReport(true)}
                  >
                    <Sunrise className="h-6 w-6" />
                    <span>Start Morning Report</span>
                  </Button>
                )}
                {showClosingStock && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setShowEveningReport(true)}
                  >
                    <Sunset className="h-6 w-6" />
                    <span>Start Evening Report</span>
                  </Button>
                )}
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
              <Label className="text-sm block">Select images to upload</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const selectedFiles = Array.from(e.target.files);
                    setImages(selectedFiles);
                    toast.success(`${selectedFiles.length} image(s) selected`);
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
      </div>

      {showMorningStock && (
        <InstoreMorningStockCountDialog
          open={showMorningReport}
          onOpenChange={setShowMorningReport}
          onComplete={() => setShowMorningReport(false)}
        />
      )}
      {showClosingStock && (
        <InstoreClosingReportDialog
          open={showEveningReport}
          onOpenChange={setShowEveningReport}
          onComplete={() => setShowEveningReport(false)}
        />
      )}
    </MobileLayout>
  );
};
