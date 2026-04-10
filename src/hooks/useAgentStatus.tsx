import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { calculateDistance, debugDistanceCalculation } from '@/utils/distanceCalculator';
import { workspaceService } from '@/services/workspaceService';
import { useAgentActions } from './useAgentActions';
import { useWorkspace } from './useWorkspace';
import { logActivity, logFailedActivity } from '@/utils/activityLogger';

export type AgentStatus = 'checked_out' | 'checked_in' | 'lunch';

interface StatusLog {
  id: string;
  status: AgentStatus;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
  distance_from_assigned: number | null;
  check_in_successful: boolean | null;
}

export const useAgentStatus = () => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { recordStatusChange } = useAgentActions();
  const [currentStatus, setCurrentStatus] = useState<AgentStatus>('checked_out');
  const [loading, setLoading] = useState(true);
  const [assignedLocation, setAssignedLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentStatus();
      fetchAssignedLocation();
    }
  }, [user]);

  const fetchCurrentStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Create a timeout promise to prevent hanging on slow networks
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Status fetch timeout')), 8000);
    });

    try {
      const queryPromise = supabase
        .from('agent_status_log')
        .select('*')
        .eq('agent_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentStatus(data.status as AgentStatus);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      // Default to checked_out on error/timeout so button is not stuck
      setCurrentStatus('checked_out');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedLocation = async () => {
    if (!user) return;

    try {
      // Get the most recent route assignment for the agent
      const { data: routeData, error: routeError } = await supabase
        .from('route_assignments')
        .select('area_id')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (routeError && routeError.code !== 'PGRST116') throw routeError;

      if (routeData?.area_id) {
        const { data: areaData, error: areaError } = await supabase
          .from('areas')
          .select('center_lat, center_lng')
          .eq('id', routeData.area_id)
          .single();

        if (areaError) throw areaError;

        if (areaData) {
          setAssignedLocation({ 
            lat: Number(areaData.center_lat), 
            lng: Number(areaData.center_lng) 
          });
        }
      }
    } catch (error) {
      console.error('Error fetching assigned location:', error);
    }
  };


  const updateStatus = async (
    newStatus: AgentStatus,
    selfieUrl: string | null,
    currentLat: number,
    currentLng: number
  ) => {
    if (!user) return { success: false, message: 'User not authenticated' };

    let distance: number | null = null;
    let checkInSuccessful: boolean | null = null;
    let inRange: boolean | null = null;
    
    // Only validate distance if an assigned location exists
    if (assignedLocation) {
      distance = await calculateDistance(
        currentLat,
        currentLng,
        assignedLocation.lat,
        assignedLocation.lng
      );
      inRange = distance <= 600;
      
      // For check-in, set success based on distance
      if (newStatus === 'checked_in') {
        checkInSuccessful = inRange;
      }

      // Debug logging
      await debugDistanceCalculation(
        currentLat,
        currentLng,
        assignedLocation.lat,
        assignedLocation.lng,
        `${newStatus} status change`
      );
    } else if (newStatus === 'checked_in') {
      // Allow check-in without assigned location
      checkInSuccessful = true;
    }

    try {
      const { error } = await supabase.from('agent_status_log').insert({
        agent_id: user.id,
        status: newStatus,
        location_lat: currentLat,
        location_lng: currentLng,
        assigned_location_lat: assignedLocation?.lat,
        assigned_location_lng: assignedLocation?.lng,
        distance_from_assigned: distance,
        selfie_url: selfieUrl,
        check_in_successful: checkInSuccessful,
        in_range: inRange,
        workspace_id: currentWorkspaceId,
      });

      if (error) throw error;

      // Record agent action for status change
      await recordStatusChange(
        user.id,
        newStatus,
        { lat: currentLat, lng: currentLng },
        {
          distance_from_assigned: distance,
          in_range: inRange,
          check_in_successful: checkInSuccessful,
          assigned_location: assignedLocation
        }
      );

      setCurrentStatus(newStatus);
      logActivity({
        action: `status_${newStatus}`,
        category: 'attendance',
        details: { distance, inRange, checkInSuccessful, lat: currentLat, lng: currentLng },
        workspaceId: currentWorkspaceId,
      });
      return { success: true, message: `Successfully ${newStatus.replace('_', ' ')}` };
    } catch (error) {
      console.error('Error updating status:', error);
      logFailedActivity(`status_${newStatus}`, 'attendance', error, { lat: currentLat, lng: currentLng }, currentWorkspaceId);
      return { success: false, message: 'Failed to update status' };
    }
  };

  return {
    currentStatus,
    loading,
    assignedLocation,
    updateStatus,
  };
};
