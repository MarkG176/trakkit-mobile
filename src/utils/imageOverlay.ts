/**
 * Utility functions for adding text overlays to images
 */

export interface ImageOverlayData {
  agentName: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  workspaceName: string;
  projectName: string;
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
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Set text properties
      const fontSize = Math.max(16, img.width / 30); // Responsive font size
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;

      // Prepare text lines
      const lines = [
        `Agent: ${overlayData.agentName}`,
        `Workspace: ${overlayData.workspaceName}`,
        `Project: ${overlayData.projectName}`,
        `Location: ${overlayData.coordinates.lat.toFixed(6)}, ${overlayData.coordinates.lng.toFixed(6)}`,
        `Time: ${overlayData.timestamp}`
      ];

      // Calculate text positioning
      const lineHeight = fontSize + 4;
      const padding = 10;
      const startY = img.height - (lines.length * lineHeight) - padding;

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
      }, 'image/jpeg', 0.9);
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
