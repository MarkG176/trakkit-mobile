import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useNativeCamera = () => {
  const { user } = useAuth();

  const takePicture = async (): Promise<string | null> => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Take picture using native camera
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (!image.webPath) throw new Error('No image captured');

      // Convert to blob for upload
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `agent-selfie-${user.id}-${timestamp}.jpg`;

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('agent-selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('agent-selfies')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  };

  const selectFromGallery = async (): Promise<string | null> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (!image.webPath) throw new Error('No image selected');

      // Convert to blob for upload
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `agent-selfie-${user.id}-${timestamp}.jpg`;

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('agent-selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('agent-selfies')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Gallery error:', error);
      throw error;
    }
  };

  return {
    takePicture,
    selectFromGallery
  };
};
