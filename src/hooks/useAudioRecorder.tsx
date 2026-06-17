import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  resetRecording: () => void;
  uploading: boolean;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // collect in 1s chunks
      setIsRecording(true);
      setDuration(0);
      setAudioUrl(null);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to record audio.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorderRef.current.onstop = async () => {
        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });

        setIsRecording(false);

        if (!user) {
          resolve(null);
          return;
        }

        if (!navigator.onLine) {
          const { saveAttachment } = await import('@/services/offline/attachmentStore');
          const attachmentId = await saveAttachment(
            blob,
            `${user.id}/${Date.now()}.webm`,
            blob.type
          );
          setUploading(false);
          resolve(`attachment:${attachmentId}`);
          return;
        }

        // Upload to Supabase
        setUploading(true);
        try {
          const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
          const fileName = `${user.id}/${Date.now()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('sale-recordings')
            .upload(fileName, blob, {
              contentType: blob.type,
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('sale-recordings')
            .getPublicUrl(fileName);

          const publicUrl = urlData.publicUrl;
          setAudioUrl(publicUrl);
          resolve(publicUrl);
        } catch (err) {
          console.error('Upload failed:', err);
          toast({
            title: 'Upload Failed',
            description: 'Could not upload the recording. Please try again.',
            variant: 'destructive',
          });
          resolve(null);
        } finally {
          setUploading(false);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [user, toast]);

  const resetRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setDuration(0);
    setAudioUrl(null);
    chunksRef.current = [];
  }, []);

  return {
    isRecording,
    duration,
    audioUrl,
    startRecording,
    stopRecording,
    resetRecording,
    uploading,
  };
};
