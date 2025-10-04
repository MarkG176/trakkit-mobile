import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useLiveLocation = (enabled: boolean = false) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Clear any existing watch
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch({ id: watchIdRef.current.toString() });
        watchIdRef.current = null;
      }
      setPosition(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const startTracking = async () => {
      try {
        // Request permissions
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const requested = await Geolocation.requestPermissions();
          if (requested.location !== 'granted') {
            setError('Location access denied by user');
            setLoading(false);
            return;
          }
        }

        // Get initial position
        const initialPosition = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });

        setPosition({
          latitude: initialPosition.coords.latitude,
          longitude: initialPosition.coords.longitude,
          accuracy: initialPosition.coords.accuracy,
          timestamp: initialPosition.timestamp,
        });
        setLoading(false);
        setError(null);

        // Start watching position for live updates
        const watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          },
          (position, err) => {
            if (err) {
              setError(err.message || 'Location tracking error');
              setLoading(false);
              return;
            }

            if (position) {
              setPosition({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              });
              setError(null);
            }
          }
        );

        watchIdRef.current = parseInt(watchId);
      } catch (error: any) {
        setError(error.message || 'Failed to access location');
        setLoading(false);
      }
    };

    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch({ id: watchIdRef.current.toString() });
        watchIdRef.current = null;
      }
    };
  }, [enabled]);

  return { position, error, loading };
};
