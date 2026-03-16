import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const EXCLUDED_EMAILS = ['mark@darajaplus.com'];

export const BackgroundLocationTracker = () => {
  const { user } = useAuth();
  const { currentStatus } = useAgentStatus();
  const { currentWorkspaceId } = useWorkspace();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCheckedIn = currentStatus === 'checked_in' || currentStatus === 'lunch';

  const recordLocation = async () => {
    if (!user || !navigator.geolocation) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      await supabase.from('agent_device_status').upsert(
        {
          agent_id: user.id,
          location_lat: latitude,
          location_lng: longitude,
          last_update: new Date().toISOString(),
          workspace_id: currentWorkspaceId,
          device_info: {
            battery_api: 'getBattery' in navigator,
            user_agent: navigator.userAgent,
            tracked_at: new Date().toISOString(),
          },
        },
        { onConflict: 'agent_id' }
      );

      console.log('[BackgroundLocationTracker] Location recorded:', latitude.toFixed(4), longitude.toFixed(4));
    } catch (error) {
      console.warn('[BackgroundLocationTracker] Failed to record location:', error);
    }
  };

  useEffect(() => {
    if (isCheckedIn && user) {
      // Record immediately on check-in
      recordLocation();

      // Then every 15 minutes
      intervalRef.current = setInterval(recordLocation, INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCheckedIn, user?.id, currentWorkspaceId]);

  // Renders nothing — purely background
  return null;
};
