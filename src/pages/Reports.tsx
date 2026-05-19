// [CMP-8d141b] Reports — field notes, images, and optional stock reports
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, FileText, Package, Sunrise, Sunset } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { workspaceService } from "@/services/workspaceService";
import {
  getStockReportCapabilities,
  hasAnyStockReportCapability,
} from "@/utils/stockReportConfig";
import { toast } from "sonner";

const StockReportDialog = lazy(() =>
  import("@/components/attendance/StockReportDialog").then((m) => ({
    default: m.StockReportDialog,
  })),
);

const InstoreMorningStockCountDialog = lazy(() =>
  import("@/components/attendance/InstoreMorningStockCountDialog").then((m) => ({
    default: m.InstoreMorningStockCountDialog,
  })),
);

const InstoreClosingReportDialog = lazy(() =>
  import("@/components/attendance/InstoreClosingReportDialog").then((m) => ({
    default: m.InstoreClosingReportDialog,
  })),
);

type MorningDialog = "availability" | "count" | null;
type EveningDialog = "availability" | "count" | null;

export const Reports = () => {
  const { user } = useAuth();
  const { currentWorkspaceId, userWorkspaces } = useWorkspace();

  const stockCaps = useMemo(() => {
    const raw =
      userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.active_components ??
      workspaceService.getCurrentActiveComponents();
    return getStockReportCapabilities(raw);
  }, [userWorkspaces, currentWorkspaceId]);

  const showStockSection = hasAnyStockReportCapability(stockCaps);

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [morningDialog, setMorningDialog] = useState<MorningDialog>(null);
  const [eveningDialog, setEveningDialog] = useState<EveningDialog>(null);

  const showMorningColumn = stockCaps.morningAvailability || stockCaps.morningCount;
  const showEveningColumn = stockCaps.eveningAvailability || stockCaps.eveningCount;

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("pointer-events");
      document.body.removeAttribute("data-scroll-locked");
    };
  }, []);

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

  const openMorningReport = () => {
    if (stockCaps.morningAvailability) {
      setMorningDialog("availability");
    } else if (stockCaps.morningCount) {
      setMorningDialog("count");
    }
  };

  const openEveningReport = () => {
    if (stockCaps.eveningCount) {
      setEveningDialog("count");
    } else if (stockCaps.eveningAvailability) {
      setEveningDialog("availability");
    }
  };

  return (
    <MobileLayout currentPage="reports">
      <ReportsPageBody
        showStockSection={showStockSection}
        showMorningColumn={showMorningColumn}
        showEveningColumn={showEveningColumn}
        stockCaps={stockCaps}
        openMorningReport={openMorningReport}
        openEveningReport={openEveningReport}
        setMorningDialog={setMorningDialog}
        notes={notes}
        setNotes={setNotes}
        submitting={submitting}
        handleSaveNotes={handleSaveNotes}
        images={images}
        setImages={setImages}
        handleUploadImages={handleUploadImages}
        morningDialog={morningDialog}
        eveningDialog={eveningDialog}
        setEveningDialog={setEveningDialog}
      />
    </MobileLayout>
  );
};

function ReportsPageBody({
  showStockSection,
  showMorningColumn,
  showEveningColumn,
  stockCaps,
  openMorningReport,
  openEveningReport,
  setMorningDialog,
  notes,
  setNotes,
  submitting,
  handleSaveNotes,
  images,
  setImages,
  handleUploadImages,
  morningDialog,
  eveningDialog,
  setEveningDialog,
}: {
  showStockSection: boolean;
  showMorningColumn: boolean;
  showEveningColumn: boolean;
  stockCaps: ReturnType<typeof getStockReportCapabilities>;
  openMorningReport: () => void;
  openEveningReport: () => void;
  setMorningDialog: (v: MorningDialog) => void;
  notes: string;
  setNotes: (v: string) => void;
  submitting: boolean;
  handleSaveNotes: () => void;
  images: File[];
  setImages: (v: File[]) => void;
  handleUploadImages: () => void;
  morningDialog: MorningDialog;
  eveningDialog: EveningDialog;
  setEveningDialog: (v: EveningDialog) => void;
}) {
  return (
    <>
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
              <div
                className={`grid gap-3 ${
                  showMorningColumn && showEveningColumn ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {showMorningColumn && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Morning</p>
                    {stockCaps.morningAvailability && stockCaps.morningCount ? (
                      
                      <div className="space-y-2">
                        {stockCaps.morningAvailability && (
                          <Button
                            type="button"
                            className="w-full h-auto py-3 flex flex-col items-center gap-2"
                            onClick={() => setMorningDialog("availability")}
                          >
                            <Sunrise className="h-5 w-5" />
                            <span className="text-sm">Stock Availability</span>
                          </Button>
                        )}
                        {stockCaps.morningCount && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-auto py-3 flex flex-col items-center gap-2"
                            onClick={() => setMorningDialog("count")}
                          >
                            <Sunrise className="h-5 w-5" />
                            <span className="text-sm">Opening Stock Count</span>
                          </Button>
                        )}
                      </div>

                    ) : (
                      <Button
                        type="button"
                        className="w-full h-auto py-4 flex flex-col items-center gap-2"
                        onClick={openMorningReport}
                      >
                        <Sunrise className="h-6 w-6" />
                        <span>Start Morning Report</span>
                      </Button>
                    )}
                  </div>
                )}

                {showEveningColumn && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">Evening</p>
                    {stockCaps.eveningAvailability && stockCaps.eveningCount ? (
                      
                      
                      <div className="space-y-2">
                        {stockCaps.eveningCount && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full h-auto py-3 flex flex-col items-center gap-2"
                            onClick={() => setEveningDialog("count")}
                          >
                            <Sunset className="h-5 w-5" />
                            <span className="text-sm">Closing Stock Count</span>
                          </Button>
                        )}
                        {stockCaps.eveningAvailability && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-auto py-3 flex flex-col items-center gap-2"
                            onClick={() => setEveningDialog("availability")}
                          >
                            <Sunset className="h-5 w-5" />
                            <span className="text-sm">Stock Availability</span>
                          </Button>
                        )}
                      </div>


                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full h-auto py-4 flex flex-col items-center gap-2"
                        onClick={openEveningReport}
                      >
                        <Sunset className="h-6 w-6" />
                        <span>Start Evening Report</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <NotesAndImagesSection
          notes={notes}
          setNotes={setNotes}
          submitting={submitting}
          handleSaveNotes={handleSaveNotes}
          images={images}
          setImages={setImages}
          handleUploadImages={handleUploadImages}
        />
      </div>

      <Suspense fallback={null}>
        {morningDialog === "availability" && (
          <StockReportDialog
            open
            reportType="morning"
            onOpenChange={(open) => {
              if (!open) setMorningDialog(null);
            }}
            onComplete={() => setMorningDialog(null)}
          />
        )}
        {morningDialog === "count" && (
          <InstoreMorningStockCountDialog
            open
            onOpenChange={(open) => {
              if (!open) setMorningDialog(null);
            }}
            onComplete={() => setMorningDialog(null)}
          />
        )}
        {eveningDialog === "availability" && (
          <StockReportDialog
            open
            reportType="evening"
            onOpenChange={(open) => {
              if (!open) setEveningDialog(null);
            }}
            onComplete={() => setEveningDialog(null)}
          />
        )}
        {eveningDialog === "count" && (
          <InstoreClosingReportDialog
            open
            onOpenChange={(open) => {
              if (!open) setEveningDialog(null);
            }}
            onComplete={() => setEveningDialog(null)}
          />
        )}
      </Suspense>
    </>
  );
}

function NotesAndImagesSection({
  notes,
  setNotes,
  submitting,
  handleSaveNotes,
  images,
  setImages,
  handleUploadImages,
}: {
  notes: string;
  setNotes: (v: string) => void;
  submitting: boolean;
  handleSaveNotes: () => void;
  images: File[];
  setImages: (v: File[]) => void;
  handleUploadImages: () => void;
}) {
  return (
    <>
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
    </>
  );
}
