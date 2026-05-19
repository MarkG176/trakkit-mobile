// [CMP-8d141b] Reports — notes and image uploads
import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

export const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);

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
      const { error } = await supabase.from("notes").insert({
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
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
      const uploadPromises = images.map(async (image) => {
        const fileExt = image.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${user.id}/reports/${fileName}`;

        const { error } = await supabase.storage
          .from("agent-selfies")
          .upload(filePath, image, { cacheControl: "3600", upsert: false });

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

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/more")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-h1">Notes & Images</h1>
            <p className="text-sm opacity-90">Submit your notes and upload images for the report.</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
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
    </MobileLayout>
  );
};