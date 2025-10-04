/**
 * Google Maps Distance Matrix API integration
 * Uses the Distance Matrix API to calculate accurate travel distances
 */

let isGoogleMapsLoaded = false;
let scriptElement: HTMLScriptElement | null = null;

/**
 * Initialize Google Maps API by loading the script
 */
export const initGoogleMaps = async (apiKey: string): Promise<void> => {
  if (isGoogleMapsLoaded) return;

  return new Promise((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleMapsLoaded = true;
      scriptElement = script;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Calculate distance using Google Maps Distance Matrix API
 * Returns the actual travel distance as calculated by Google Maps
 */
export const calculateGoogleMapsDistance = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  apiKey: string
): Promise<{ distance: number; duration: number }> => {
  try {
    // Initialize Google Maps if not already loaded
    if (!isGoogleMapsLoaded) {
      await initGoogleMaps(apiKey);
    }

    const origin = new google.maps.LatLng(lat1, lon1);
    const destination = new google.maps.LatLng(lat2, lon2);

    // Use Distance Matrix API
    const service = new google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: google.maps.TravelMode.WALKING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK' && response) {
            const result = response.rows[0]?.elements[0];
            
            if (result?.status === 'OK') {
              resolve({
                distance: result.distance.value, // in meters
                duration: result.duration.value, // in seconds
              });
            } else {
              reject(new Error(`Distance calculation failed: ${result?.status}`));
            }
          } else {
            reject(new Error(`Google Maps API error: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error calculating Google Maps distance:', error);
    throw error;
  }
};

/**
 * Get the Google Maps API key from localStorage
 */
export const getGoogleMapsApiKey = (): string | null => {
  const storedKey = localStorage.getItem('googleMapsApiKey');
  return storedKey;
};

/**
 * Store the Google Maps API key in localStorage
 */
export const setGoogleMapsApiKey = (apiKey: string): void => {
  localStorage.setItem('googleMapsApiKey', apiKey);
};
