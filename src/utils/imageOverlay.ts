/**
 * Utility functions for adding text overlays to images
 * Optimized for memory efficiency on budget devices
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
 * Memory-optimized with explicit cleanup and fallback
 */
export const addTextOverlayToImage = async (
  imageFile: File,
  overlayData: ImageOverlayData
): Promise<File> => {
  return new Promise((resolve, reject) => {
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let img: HTMLImageElement | null = null;
    let objectUrl: string | null = null;

    const cleanup = () => {
      // Explicit memory cleanup
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (e) {
          // Ignore cleanup errors
        }
        objectUrl = null;
      }
      
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
      
      if (ctx) {
        ctx = null;
      }
      
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = '';
        img = null;
      }
    };

    try {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      
      if (!ctx) {
        cleanup();
        reject(new Error('Could not get canvas context'));
        return;
      }

      img = new Image();
      
      img.onload = () => {
        try {
          if (!img || !canvas || !ctx) {
            cleanup();
            reject(new Error('Elements were cleaned up'));
            return;
          }

          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the original image
          ctx.drawImage(img, 0, 0);

          // Set text properties
          const fontSize = Math.max(16, img.width / 30); // Responsive font size
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
          ctx.lineWidth = 4;

          // Prepare text lines
          const lines = [
            `Agent: ${overlayData.agentName}`,
            `Workspace: ${overlayData.workspaceName}`,
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
            ctx!.strokeText(line, padding, y);
            // Draw text fill
            ctx!.fillText(line, padding, y);
          });

          // Convert canvas to blob with reduced quality for memory efficiency
          canvas.toBlob((blob) => {
            if (!blob) {
              cleanup();
              reject(new Error('Could not create image blob'));
              return;
            }

            // Create new file with overlay
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const newFileName = `${overlayData.agentName.replace(/\s+/g, '_')}_${timestamp}.jpg`;
            const newFile = new File([blob], newFileName, { type: 'image/jpeg' });
            
            cleanup();
            resolve(newFile);
          }, 'image/jpeg', 0.8); // Reduced from 0.9 to 0.8 for memory efficiency
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      img.onerror = () => {
        cleanup();
        reject(new Error('Could not load image'));
      };

      // Use object URL instead of FileReader for better memory efficiency
      objectUrl = URL.createObjectURL(imageFile);
      img.src = objectUrl;
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
};

/**
 * Memory-safe wrapper that falls back to original file if overlay fails
 */
export const addTextOverlayWithFallback = async (
  imageFile: File,
  overlayData: ImageOverlayData
): Promise<File> => {
  try {
    return await addTextOverlayToImage(imageFile, overlayData);
  } catch (error) {
    console.warn('Overlay processing failed, using original image:', error);
    // Return original file if overlay fails (memory or other issues)
    return imageFile;
  }
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
