import React, { useState, useEffect, useRef } from 'react';
import { CameraCapture } from './CameraCapture';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, Camera, RefreshCw } from 'lucide-react';

interface WorkspaceImageGalleryProps {
  className?: string;
}

export const WorkspaceImageGallery: React.FC<WorkspaceImageGalleryProps> = ({ className }) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const cameraRef = useRef<any>(null);

  const loadImages = async () => {
    if (!cameraRef.current) return;
    
    setLoading(true);
    try {
      const imageUrls = await cameraRef.current.listWorkspaceImages();
      setImages(imageUrls);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageCapture = (imageData: string) => {
    // Reload images after new capture
    loadImages();
  };

  const handleImagesList = (imageUrls: string[]) => {
    setImages(imageUrls);
  };

  // Load images when workspace/project changes
  useEffect(() => {
    loadImages();
  }, [currentWorkspaceId, currentProjectId]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Workspace Images
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadImages}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <CameraCapture
              ref={cameraRef}
              onCapture={handleImageCapture}
              onImagesList={handleImagesList}
              mode="general"
              variant="inline"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          Folder Structure: Workspace Name → Project Name → Agent ID<br/>
          Images include: Agent name, coordinates, timestamp overlay
        </div>
        
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No images found in current workspace/project
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={imageUrl}
                  alt={`Workspace image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
