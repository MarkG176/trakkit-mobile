import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { calculateDistance, debugDistanceCalculation } from '@/utils/distanceCalculator';
import { googleMapsService } from '@/services/googleMapsService';

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
      try {
        console.log('🌍 Using Google Maps API for check-in distance validation...');
        const googleResult = await googleMapsService.calculateDistanceWithFallback(
          currentLat,
          currentLng,
          assignedLocation.lat,
          assignedLocation.lng
        );

        distance = googleResult.distanceMeters;
        inRange = distance <= 500;
        checkInSuccessful = inRange; // Within 500 meters

        console.log('✅ Check-in distance validation:', {
          distanceMeters: distance,
          distanceText: googleResult.distanceText,
          durationText: googleResult.durationText,
          inRange,
          status: googleResult.status
        });

      } catch (error) {
        console.warn('⚠️ Google Maps failed for check-in, using Haversine fallback:', error);
        
        // Fallback to Haversine formula
        distance = calculateDistance(
          currentLat,
          currentLng,
          assignedLocation.lat,
          assignedLocation.lng
        );
        inRange = distance <= 500;
        checkInSuccessful = inRange;

        // Debug logging for fallback
        debugDistanceCalculation(
          currentLat,
          currentLng,
          assignedLocation.lat,
          assignedLocation.lng,
          `Check-in (${newStatus}) - Haversine Fallback`
        );
      }

      if (!checkInSuccessful) {
        return {
          success: false,
          message: `Check-in failed. You are ${Math.round(distance)}m away from your assigned location. Must be within 500m.`,
        };
      }
    } else if (assignedLocation) {
      // Calculate range for other status changes using Google Maps with fallback
      try {
        const googleResult = await googleMapsService.calculateDistanceWithFallback(
          currentLat,
          currentLng,
          assignedLocation.lat,
          assignedLocation.lng
        );
        distance = googleResult.distanceMeters;
        inRange = distance <= 500;
        
        console.log('✅ Status change distance validation:', {
          distanceMeters: distance,
          distanceText: googleResult.distanceText,
          inRange,
          status: googleResult.status
        });
        
      } catch (error) {
        console.warn('⚠️ Google Maps failed for status change, using Haversine fallback:', error);
        
        distance = calculateDistance(
          currentLat,
          currentLng,
          assignedLocation.lat,
          assignedLocation.lng
        );
        inRange = distance <= 500;
        
        // Debug logging for fallback
        debugDistanceCalculation(
          currentLat,
          currentLng,
          assignedLocation.lat,
          assignedLocation.lng,
          `Status change (${newStatus}) - Haversine Fallback`
        );
      }
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
