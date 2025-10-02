import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    // Trigger the file input which will open the camera
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        onCapture?.(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <button
        onClick={handleCameraClick}
        className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-50"
        aria-label="Open Camera"
      >
        <Camera size={24} className="text-primary-foreground" />
      </button>
      
      {/* Hidden file input that opens the camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};
