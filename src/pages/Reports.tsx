// [CMP-8d141b] Reports — field notes, images, and optional stock reports
import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/utils/imageCompression";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PriceReportsSection } from "@/components/attendance/PriceReportsSection";
import { StockReportsSection } from "@/components/attendance/StockReportsSection";
import { CameraCapture } from "@/components/CameraCapture";
import { toast } from "sonner";

export const Reports = () => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
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

    const workspaceId = currentWorkspaceId;

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

  const handleReportCameraCapture = (imageUrl: string) => {
    setCapturedImageUrls((prev) => [...prev, imageUrl]);
    toast.success("Photo captured with location overlay");
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
          const compressed = await compressImage(image);
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          const filePath = `${user.id}/reports/${fileName}`;

          const { error } = await supabase.storage
            .from("store_images")
            .upload(filePath, compressed, { cacheControl: "3600", upsert: false });

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
      <ReportsPageBody
        notes={notes}
        setNotes={setNotes}
        submitting={submitting}
        handleSaveNotes={handleSaveNotes}
        images={images}
        setImages={setImages}
        capturedImageUrls={capturedImageUrls}
        onReportCameraCapture={handleReportCameraCapture}
        handleUploadImages={handleUploadImages}
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
  onReportCameraCapture,
  handleUploadImages,
}: {
  notes: string;
  setNotes: (v: string) => void;
  submitting: boolean;
  handleSaveNotes: () => void;
  images: File[];
  setImages: (v: File[]) => void;
  capturedImageUrls: string[];
  onReportCameraCapture: (imageUrl: string) => void;
  handleUploadImages: () => void;
}) {
  const [stockLevels, setStockLevels] = useState<Record<string, string>>({});

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
          onStockLevelsChange={setStockLevels}
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
          onReportCameraCapture={onReportCameraCapture}
          handleUploadImages={handleUploadImages}
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
  onReportCameraCapture,
  handleUploadImages,
}: {
  notes: string;
  setNotes: (v: string) => void;
  submitting: boolean;
  handleSaveNotes: () => void;
  images: File[];
  setImages: (v: File[]) => void;
  capturedImageUrls: string[];
  onReportCameraCapture: (imageUrl: string) => void;
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
        <CardContent className="p-6 relative">
          <div className="absolute top-4 right-4 z-10">
            <CameraCapture
              mode="general"
              variant="inline"
              storageBucket="store_images"
              uploadFolder="reports"
              onCapture={onReportCameraCapture}
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
                    const selectedFiles = Array.from(e.target.files);
                    setImages(selectedFiles);
                    toast.success(`${selectedFiles.length} image(s) selected`);
                  }
                }}
              />
              {(images.length > 0 || capturedImageUrls.length > 0) && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {images.length > 0 && (
                    <p>{images.length} file(s) selected for upload</p>
                  )}
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
