// [CMP-92a1d6] MobileGalleryTab — mobile gallery tab component
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface GalleryImage {
  url: string;
  timestamp: string;
  agent_name: string | null;
}

interface MobileGalleryTabProps {
  workspaceId: string | undefined;
  startDate: string | null;
  endDate: string | null;
}

export function MobileGalleryTab({ workspaceId, startDate, endDate }: MobileGalleryTabProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['mobile-gallery', workspaceId, startDate, endDate],
    queryFn: async (): Promise<GalleryImage[]> => {
      const start = startDate || "2020-01-01";
      const end = endDate || new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("agent_status_log")
        .select("id, timestamp, selfie_url, agent_display_name")
        .eq("workspace_id", workspaceId!)
        .gte("timestamp", start)
        .lte("timestamp", end + "T23:59:59")
        .not("selfie_url", "is", null)
        .order("timestamp", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []).map(s => ({
        url: s.selfie_url!,
        timestamp: s.timestamp,
        agent_name: s.agent_display_name
      }));
    },
    enabled: !!workspaceId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 p-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <span className="font-semibold">Photo Gallery</span>
          </div>
          <span className="text-sm text-muted-foreground">{images.length} photos</span>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Image className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No photos found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                />
                {image.agent_name && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-md truncate">
                    <p className="truncate">{image.agent_name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <button
            className="absolute right-2 top-2 z-10 bg-black/50 text-white p-2 rounded-full"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {selectedImage && (
            <div className="flex flex-col">
              <img
                src={selectedImage.url}
                alt="Full size"
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-background">
                {selectedImage.agent_name && (
                  <p className="font-medium">{selectedImage.agent_name}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedImage.timestamp), "PPpp")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
