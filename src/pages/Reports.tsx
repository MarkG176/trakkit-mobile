// [CMP-8d141b] Reports — field notes, images, and optional stock reports
import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PriceReportsSection } from "@/components/attendance/PriceReportsSection";
import { StockReportsSection } from "@/components/attendance/StockReportsSection";
import { CameraCapture } from "@/components/CameraCapture";
import {
  loadReportsStockLevels,
  saveReportsStockLevels,
  submitFieldNote,
  submitReportImages,
} from "@/services/fieldWriteService";
import { toast } from "sonner";

export const Reports = () => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
  const [capturedImageUrls, setCapturedImageUrls] = useState<string[]>([]);
  useEffect(() => {
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("pointer-events");
      document.body.removeAttribute("data-scroll-locked");
    };
  }, []);

  const handleSaveNotes = async () => {
    if (!user || !notes.trim()) {
      toast.error("Please enter some notes");
      return;
    }

    if (!currentWorkspaceId) {
      toast.error("No workspace selected.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitFieldNote({
        workspaceId: currentWorkspaceId,
        agentId: user.id,
        payload: { content: notes.trim(), noteType: "field" },
      });
      toast.success(result.queued ? "Notes saved on device" : "Notes saved!");
      setNotes("");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeferredCameraFile = (file: File, previewUrl: string) => {
    setCapturedFiles((prev) => [...prev, file]);
    setCapturedImageUrls((prev) => [...prev, previewUrl]);
    toast.success("Photo captured with location overlay");
  };

  const handleUploadImages = async () => {
    if (!user || !currentWorkspaceId) {
      toast.error("Please sign in and select a workspace");
      return;
    }

    const allFiles = [...images, ...capturedFiles];
    if (allFiles.length === 0) {
      toast.error("Please select or capture images to upload");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReportImages({
        workspaceId: currentWorkspaceId,
        agentId: user.id,
        files: allFiles,
        folder: `${user.id}/reports`,
        bucket: "store_images",
      });
      toast.success(
        result.queued ? "Images saved on device — will sync when online" : "Images uploaded successfully!",
      );
      setImages([]);
      setCapturedFiles([]);
      capturedImageUrls.forEach((url) => URL.revokeObjectURL(url));
      setCapturedImageUrls([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to save images");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout currentPage="reports">
      <ReportsPageBody
        notes={notes}
        setNotes={setNotes}
        submitting={submitting}
        handleSaveNotes={handleSaveNotes}
        images={images}
        setImages={setImages}
        capturedImageUrls={capturedImageUrls}
        onDeferredCameraFile={handleDeferredCameraFile}
        handleUploadImages={handleUploadImages}
        capturedFilesCount={capturedFiles.length}
      />
    </MobileLayout>
  );
};

function ReportsPageBody({
  notes,
  setNotes,
  submitting,
  handleSaveNotes,
  images,
  setImages,
  capturedImageUrls,
  onDeferredCameraFile,
  handleUploadImages,
  capturedFilesCount,
}: {
  notes: string;
  setNotes: (v: string) => void;
  submitting: boolean;
  handleSaveNotes: () => void;
  images: File[];
  setImages: (v: File[]) => void;
  capturedImageUrls: string[];
  onDeferredCameraFile: (file: File, previewUrl: string) => void;
  handleUploadImages: () => void;
  capturedFilesCount: number;
}) {
  const { currentWorkspaceId } = useWorkspace();
  const [stockLevels, setStockLevels] = useState<Record<string, string>>(() =>
    currentWorkspaceId ? loadReportsStockLevels(currentWorkspaceId) : {},
  );

  useEffect(() => {
    if (currentWorkspaceId) {
      setStockLevels(loadReportsStockLevels(currentWorkspaceId));
    }
  }, [currentWorkspaceId]);

  const handleStockLevelsChange = (levels: Record<string, string>) => {
    setStockLevels(levels);
    if (currentWorkspaceId) {
      saveReportsStockLevels(currentWorkspaceId, levels);
    }
  };

  const totalImages = images.length + capturedFilesCount;

  return (
    <>
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Reports</h1>
        <p className="text-sm opacity-90">
          Log customer feedback, competitor activity, notes, and photos from the field.
        </p>
      </div>

      <div className="p-4 space-y-6">
        <StockReportsSection
          includePriceReport={false}
          onStockLevelsChange={handleStockLevelsChange}
        />
        <PriceReportsSection stockLevels={stockLevels} />

        <NotesAndImagesSection
          notes={notes}
          setNotes={setNotes}
          submitting={submitting}
          handleSaveNotes={handleSaveNotes}
          images={images}
          setImages={setImages}
          capturedImageUrls={capturedImageUrls}
          onDeferredCameraFile={onDeferredCameraFile}
          handleUploadImages={handleUploadImages}
          totalImages={totalImages}
        />
      </div>
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
  capturedImageUrls,
  onDeferredCameraFile,
  handleUploadImages,
  totalImages,
}: {
  notes: string;
  setNotes: (v: string) => void;
  submitting: boolean;
  handleSaveNotes: () => void;
  images: File[];
  setImages: (v: File[]) => void;
  capturedImageUrls: string[];
  onDeferredCameraFile: (file: File, previewUrl: string) => void;
  handleUploadImages: () => void;
  totalImages: number;
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
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 z-10">
            <CameraCapture
              mode="general"
              variant="inline"
              storageBucket="store_images"
              uploadFolder="reports"
              deferUpload
              onCapturedFile={onDeferredCameraFile}
            />
          </div>
          <h3 className="text-h3 mb-6 pr-12 text-black">Attach Images</h3>

          <div className="space-y-4">
            <Label className="text-sm block">Select images to upload</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const selectedFiles = Array.from(e.target.files) as File[];
                  setImages(selectedFiles);
                  toast.success(`${selectedFiles.length} image(s) selected`);
                }
              }}
            />
            {(totalImages > 0 || capturedImageUrls.length > 0) && (
              <div className="text-sm text-muted-foreground space-y-1">
                {images.length > 0 && <p>{images.length} file(s) selected for upload</p>}
                {capturedImageUrls.length > 0 && (
                  <p>{capturedImageUrls.length} photo(s) captured with overlay</p>
                )}
              </div>
            )}
            <Button
              type="button"
              className="w-full"
              variant="outline"
              onClick={handleUploadImages}
              disabled={submitting || totalImages === 0}
            >
              <Camera className="mr-2 h-4 w-4" />
              {submitting ? "Saving..." : "Upload Images"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
