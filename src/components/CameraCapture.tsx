import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
  mode?: 'status' | 'general'; // 'status' for check-in/out, 'general' for other uses
  variant?: 'floating' | 'inline'; // 'floating' for bottom nav, 'inline' for top bar
}

export const CameraCapture = ({ onCapture, mode = 'status', variant = 'floating' }: CameraCaptureProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentStatus, updateStatus } = useAgentStatus();
  const { user } = useAuth();
  const { toast } = useToast();

  // Expose the file input ref to parent component
  useImperativeHandle(ref, () => fileInputRef.current!);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileName = `${user.id}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('agent-selfies')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('agent-selfies')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true }
      );
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsProcessing(true);

    try {
      // Upload to agent-selfies bucket
      const imageUrl = await uploadToStorage(file);

      if (!imageUrl) {
        throw new Error('Failed to upload image');
      }

      if (mode === 'status') {
        // Status mode: Get location and update agent status
        const location = await getCurrentLocation();

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
      } else {
        // General mode: Just upload and notify
        toast({
          title: 'Photo captured',
          description: 'Image uploaded successfully to agent-selfies bucket',
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
