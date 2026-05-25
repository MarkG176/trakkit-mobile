// [CMP-c5aa7b] CameraCapture — camera capture component
import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addTextOverlayToImage, ImageOverlayData, formatTimestamp } from '@/utils/imageOverlay';
import { workspaceService } from '@/services/workspaceService';
import { ImageCaptionInput } from '@/components/ImageCaptionInput';
import { PermissionGuidance } from '@/components/PermissionGuidance';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
  mode?: 'status' | 'general'; // 'status' for check-in/out, 'general' for other uses
  variant?: 'floating' | 'inline'; // 'floating' for bottom nav, 'inline' for top bar
  onImagesList?: (images: string[]) => void; // Callback to get list of images in current workspace/project
}

export const CameraCapture = forwardRef<HTMLInputElement, CameraCaptureProps>(({ onCapture, mode = 'status', variant = 'floating', onImagesList }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [captionDialogOpen, setCaptionDialogOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentStatus, updateStatus } = useAgentStatus();
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const { displayName } = useUserProfile();
  const { toast } = useToast();
  const { permissions, requestPermission, browserType } = usePermissions();

  // Expose the file input ref and listWorkspaceImages function to parent component
  useImperativeHandle(ref, () => ({
    ...fileInputRef.current!,
    listWorkspaceImages,
    click: () => fileInputRef.current?.click()
  }));

  // Function to list images in current workspace/project/agent context
  const listWorkspaceImages = async (): Promise<string[]> => {
    if (!user) return [];

    try {
      // Get workspace and project names to build folder path
      const workspaceName = workspaceService.getWorkspaceName();
      const projectName = await workspaceService.getProjectNameAsync();

      // Build the folder path: workspaceName/projectName/userId
      let folderPath = '';
      
      if (workspaceName && workspaceName !== 'Unknown Workspace') {
        // Sanitize workspace name for folder path
        const sanitizedWorkspaceName = workspaceName.replace(/[^a-zA-Z0-9-_]/g, '_');
        folderPath += sanitizedWorkspaceName;
      } else {
        // Fallback to user ID if no workspace
        folderPath = user.id;
      }
      
      if (projectName && projectName !== 'No Project') {
        // Sanitize project name for folder path
        const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
        folderPath += `/${sanitizedProjectName}`;
      }
      
      // Always include agent (user) as the final level
      folderPath += `/${user.id}`;

      // List files in the workspace/project/agent folder
      const { data, error } = await supabase.storage
        .from('agent-selfies')
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error listing images:', error);
        return [];
      }

      // Get public URLs for all images
      const imageUrls = data?.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('agent-selfies')
          .getPublicUrl(`${folderPath}/${file.name}`);
        return publicUrl;
      }) || [];

      // Call the callback if provided
      onImagesList?.(imageUrls);

      return imageUrls;
    } catch (error) {
      console.error('Error listing workspace images:', error);
      return [];
    }
  };

  const handleCameraClick = async () => {
    const cameraStatus = permissions?.camera?.status;
    
    if (cameraStatus === 'denied') {
      setShowPermissionDenied(true);
      return;
    }
    
    if (cameraStatus !== 'granted') {
      // Try to request camera permission
      const result = await requestPermission('camera');
      if (!result) {
        setShowPermissionDenied(true);
        return;
      }
    }
    
    fileInputRef.current?.click();
  };

  const uploadToStorage = async (file: File, coordinates: { lat: number; lng: number }, imageCaption?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Get workspace and project names
      const workspaceName = workspaceService.getWorkspaceName();
      const projectName = await workspaceService.getProjectNameAsync();

      // Create overlay data
      const overlayData: ImageOverlayData = {
        agentName: displayName || user.email?.split('@')[0] || 'Unknown Agent',
        coordinates,
        timestamp: formatTimestamp(new Date()),
        workspaceName: workspaceName || 'Unknown Workspace',
        projectName: projectName || 'No Project',
        caption: imageCaption || undefined
      };

      // Add text overlay to image
      const imageWithOverlay = await addTextOverlayToImage(file, overlayData);

      // Create folder structure: workspaceName/projectName/userId
      let folderPath = '';
      
      if (workspaceName && workspaceName !== 'Unknown Workspace') {
        // Sanitize workspace name for folder path
        const sanitizedWorkspaceName = workspaceName.replace(/[^a-zA-Z0-9-_]/g, '_');
        folderPath += sanitizedWorkspaceName;
      } else {
        // Fallback to user ID if no workspace
        folderPath = user.id;
      }
      
      if (projectName && projectName !== 'No Project') {
        // Sanitize project name for folder path
        const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
        folderPath += `/${sanitizedProjectName}`;
      }
      
      // Always include agent (user) as the final level
      folderPath += `/${user.id}`;

      // Create filename with agent name and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const agentName = overlayData.agentName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const fileName = `${folderPath}/${agentName}_${timestamp}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('agent-selfies')
        .upload(fileName, imageWithOverlay);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('agent-selfies')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error processing image with overlay:', error);
      return null;
    }
  };

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number }> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported by this device');
    }

    const attemptLocation = (options: PositionOptions): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve, reject) => {
        const timeoutMs = options.timeout || 15000;
        const timeoutId = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, timeoutMs);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          options
        );
      });
    };

    // First attempt: high accuracy (for GPS chips that need warmup, this may fail)
    try {
      return await attemptLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    } catch (firstError) {
      console.log('High-accuracy location failed, retrying with low accuracy:', firstError);
      // Fallback: low accuracy, longer timeout, fresh fix (maximumAge: 10s to still allow cached)
      try {
        return await attemptLocation({ enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 });
      } catch (secondError) {
        const err = secondError as GeolocationPositionError;
        let message = 'Unable to get your location';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location access denied. Please enable location permissions and try again.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location unavailable. Please ensure GPS is enabled and try again.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Location request timed out. Please try again in an open area with clear sky.';
        }
        throw new Error(message);
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (isProcessing) {
      console.log('CameraCapture: Already processing, ignoring duplicate event');
      return;
    }

    // Reset the file input immediately
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Show caption dialog
    const previewUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingPreviewUrl(previewUrl);
    setCaption('');
    setCaptionDialogOpen(true);
  };

  const handleCaptionConfirm = async () => {
    if (!pendingFile || !user) return;

    setCaptionDialogOpen(false);
    setIsProcessing(true);

    const currentFile = pendingFile;
    const currentCaption = caption;

    // Clean up preview
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setCaption('');

    try {
      const location = await getCurrentLocation();
      const imageUrl = await uploadToStorage(currentFile, location, currentCaption || undefined);

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      if (mode === 'status' && !onCapture) {
        let nextStatus = currentStatus;
        if (currentStatus === 'checked_out') {
          nextStatus = 'checked_in';
        } else if (currentStatus === 'checked_in') {
          nextStatus = 'lunch';
        } else if (currentStatus === 'lunch') {
          nextStatus = 'checked_in';
        }

        const result = await updateStatus(nextStatus, imageUrl, location.lat, location.lng);

        if (result.success) {
          toast({ title: 'Success', description: result.message });
        } else {
          toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
      } else if (!onCapture) {
        toast({ title: 'Photo captured', description: 'Image uploaded successfully with agent details' });
      }

      if (onCapture) {
        onCapture(imageUrl);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process image',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  const handleCaptionCancel = () => {
    setCaptionDialogOpen(false);
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setCaption('');
  };

  const buttonClasses = variant === 'floating' 
    ? "absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-50 disabled:opacity-50 disabled:cursor-not-allowed"
    : "w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const iconSize = variant === 'floating' ? 24 : 20;

  return (
    <>
      <button
        onClick={handleCameraClick}
        disabled={isProcessing}
        className={buttonClasses}
        aria-label="Open Camera"
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground" />
        ) : (
          <Camera size={iconSize} className="text-primary-foreground" />
        )}
      </button>
      
      {/* Hidden file input that opens the camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Caption dialog */}
      <Dialog open={captionDialogOpen} onOpenChange={(open) => { if (!open) handleCaptionCancel(); }}>
        <DialogContent className="max-w-sm">
          <div className="space-y-3">
            {pendingPreviewUrl && (
              <img src={pendingPreviewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            )}
            <ImageCaptionInput
              value={caption}
              onChange={setCaption}
              placeholder="Add a caption..."
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCaptionCancel}>Skip</Button>
              <Button className="flex-1" onClick={handleCaptionConfirm}>
                {isProcessing ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Denied Dialog */}
      <Dialog open={showPermissionDenied} onOpenChange={setShowPermissionDenied}>
        <DialogContent className="max-w-sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Camera Permission Denied</h3>
                <p className="text-sm text-red-700 mt-1">
                  Camera permission is required to capture photos. Please enable it in your browser settings.
                </p>
              </div>
            </div>
            
            <PermissionGuidance
              permissionType="camera"
              browserType={browserType}
              onRetry={() => setShowPermissionDenied(false)}
            />

            <Button 
              onClick={() => setShowPermissionDenied(false)} 
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

CameraCapture.displayName = 'CameraCapture';
