import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addTextOverlayToImage, ImageOverlayData, formatTimestamp } from '@/utils/imageOverlay';
import { workspaceService } from '@/services/workspaceService';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
  mode?: 'status' | 'general'; // 'status' for check-in/out, 'general' for other uses
  variant?: 'floating' | 'inline'; // 'floating' for bottom nav, 'inline' for top bar
  onImagesList?: (images: string[]) => void; // Callback to get list of images in current workspace/project
}

export const CameraCapture = forwardRef<HTMLInputElement, CameraCaptureProps>(({ onCapture, mode = 'status', variant = 'floating', onImagesList }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentStatus, updateStatus } = useAgentStatus();
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const { displayName } = useUserProfile();
  const { toast } = useToast();

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

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const uploadToStorage = async (file: File, coordinates: { lat: number; lng: number }): Promise<string | null> => {
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
        projectName: projectName || 'No Project'
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

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out. Please try again.'));
      }, 15000);

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
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsProcessing(true);

    try {
      // Get current location first
      const location = await getCurrentLocation();

      // Upload to agent-selfies bucket with coordinates
      const imageUrl = await uploadToStorage(file, location);

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      // If onCapture callback is provided, let the parent handle status updates
      // This prevents double status updates when parent components manage their own status logic
      if (mode === 'status' && !onCapture) {
        // Status mode without callback: Update agent status with the uploaded image
        // Determine next status based on current status
        let nextStatus = currentStatus;
        if (currentStatus === 'checked_out') {
          nextStatus = 'checked_in';
        } else if (currentStatus === 'checked_in') {
          nextStatus = 'lunch';
        } else if (currentStatus === 'lunch') {
          nextStatus = 'checked_in';
        }

        // Update status with selfie
        const result = await updateStatus(nextStatus, imageUrl, location.lat, location.lng);

        if (result.success) {
          toast({
            title: 'Success',
            description: result.message,
          });
        } else {
          toast({
            title: 'Error',
            description: result.message,
            variant: 'destructive',
          });
        }
      } else if (!onCapture) {
        // General mode without callback: Just upload and notify
        toast({
          title: 'Photo captured',
          description: 'Image uploaded successfully with agent details',
        });
      }

      // Call the optional onCapture callback with image data
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        onCapture?.(imageData);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process image',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    </>
  );
});

CameraCapture.displayName = 'CameraCapture';
