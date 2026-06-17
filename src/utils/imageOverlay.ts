/**
 * Utility functions for adding text overlays to images
 */

export interface ImageOverlayData {
  agentName: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  workspaceName: string;
  projectName: string;
  caption?: string;
}

/**
 * Add text overlay to an image canvas
 */
export const addTextOverlayToImage = async (
  imageFile: File,
  overlayData: ImageOverlayData
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Cap longest side at 1280px to keep upload sizes small
      const MAX_DIM = 1280;
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const targetWidth = Math.round(img.width * scale);
      const targetHeight = Math.round(img.height * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw the (possibly downscaled) image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Set text properties (scaled to new width)
      const fontSize = Math.max(14, targetWidth / 30);
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      ctx.lineWidth = 4;

      // Prepare text lines
      const lines = [
        `Agent: ${overlayData.agentName}`,
        `Workspace: ${overlayData.workspaceName}`,
        `Location: ${overlayData.coordinates.lat.toFixed(6)}, ${overlayData.coordinates.lng.toFixed(6)}`,
        `Time: ${overlayData.timestamp}`,
        ...(overlayData.caption ? [`Caption: ${overlayData.caption}`] : [])
      ];

      // Calculate text positioning
      const lineHeight = fontSize + 4;
      const padding = 10;
      const startY = targetHeight - (lines.length * lineHeight) - padding;

      // Draw text with outline effect
      lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        
        // Draw text outline (stroke)
        ctx.strokeText(line, padding, y);
        // Draw text fill
        ctx.fillText(line, padding, y);
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not create image blob'));
          return;
        }

        // Create new file with overlay
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newFileName = `${overlayData.agentName.replace(/\s+/g, '_')}_${timestamp}.jpg`;
        const newFile = new File([blob], newFileName, { type: 'image/jpeg' });
        
        resolve(newFile);
      }, 'image/jpeg', 0.78);
    };


    img.onerror = () => {
      reject(new Error('Could not load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  const formatCoord = (coord: number) => {
    const abs = Math.abs(coord);
    const deg = Math.floor(abs);
    const min = Math.floor((abs - deg) * 60);
    const sec = ((abs - deg) * 60 - min) * 60;
    return `${deg}°${min}'${sec.toFixed(2)}"`;
  };

  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  return `${formatCoord(lat)}${latDir}, ${formatCoord(lng)}${lngDir}`;
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (date: Date): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
};
