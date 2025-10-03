import { Geolocation, Position } from '@capacitor/geolocation';
import { useState, useEffect } from 'react';

export const useNativeLocation = () => {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = async (): Promise<Position> => {
    setLoading(true);
    setError(null);

    try {
      // Request permissions first
      await Geolocation.requestPermissions();
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      setPosition(position);
      return position;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const watchPosition = (callback: (position: Position) => void) => {
    return Geolocation.watchPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }, callback);
  };

  const clearWatch = (watchId: string) => {
    Geolocation.clearWatch({ id: watchId });
  };

  useEffect(() => {
    // Get initial position
    getCurrentPosition().catch(() => {
      // Ignore initial errors
    });
  }, []);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    watchPosition,
    clearWatch
  };
};
