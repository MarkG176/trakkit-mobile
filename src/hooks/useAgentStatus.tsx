import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agent_status_log')
        .select('*')
        .eq('agent_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentStatus(data.status as AgentStatus);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
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
    
    if (newStatus === 'checked_in' && assignedLocation) {
      distance = calculateDistance(
        currentLat,
        currentLng,
        assignedLocation.lat,
        assignedLocation.lng
      );
      inRange = distance <= 500;
      checkInSuccessful = inRange; // Within 500 meters

      if (!checkInSuccessful) {
        return {
          success: false,
          message: `Check-in failed. You are ${Math.round(distance)}m away from your assigned location. Must be within 500m.`,
        };
      }
    } else if (assignedLocation) {
      // Calculate range for other status changes
      distance = calculateDistance(
        currentLat,
        currentLng,
        assignedLocation.lat,
        assignedLocation.lng
      );
      inRange = distance <= 500;
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
      });

      if (error) throw error;

      setCurrentStatus(newStatus);
      return { success: true, message: `Successfully ${newStatus.replace('_', ' ')}` };
    } catch (error) {
      console.error('Error updating status:', error);
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
