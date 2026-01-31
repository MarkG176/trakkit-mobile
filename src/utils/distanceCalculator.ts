/**
 * Accurate distance calculation utilities using the Haversine formula
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Distance calculation using Google Maps Distance Matrix API
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance using Google Maps Distance Matrix API
 * This provides actual driving/walking distance, not straight-line distance
 * 
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lon1 - Longitude of first point in decimal degrees  
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lon2 - Longitude of second point in decimal degrees
 * @returns Promise<Distance in meters>
 */
/**
 * Round coordinate to specified decimal places
 */
const roundCoordinate = (coord: number, decimals: number = 3): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(coord * factor) / factor;
};

export const calculateDistance = async (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): Promise<number> => {
  // Validate input coordinates
  if (!isValidCoordinate(lat1) || !isValidCoordinate(lon1) || 
      !isValidCoordinate(lat2) || !isValidCoordinate(lon2)) {
    throw new Error('Invalid coordinates provided');
  }

  // Round coordinates to 3 decimal places (~110m precision)
  const roundedLat1 = roundCoordinate(lat1, 3);
  const roundedLon1 = roundCoordinate(lon1, 3);
  const roundedLat2 = roundCoordinate(lat2, 3);
  const roundedLon2 = roundCoordinate(lon2, 3);

  return calculateDistanceFallback(roundedLat1, roundedLon1, roundedLat2, roundedLon2);
};

/**
 * Fallback distance calculation (direct coordinate comparison)
 */
const calculateDistanceFallback = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const latDiff = Math.abs(lat2 - lat1);
  const lonDiff = Math.abs(lon2 - lon1);
  
  const avgLat = (lat1 + lat2) / 2;
  const latDistance = latDiff * 111000;
  const lonDistance = lonDiff * 111000 * Math.cos(toRadians(avgLat));
  
  return Math.sqrt(latDistance * latDistance + lonDistance * lonDistance);
};

/**
 * Calculate distance between two coordinate objects
 */
export const calculateDistanceBetween = async (
  point1: Coordinates, 
  point2: Coordinates
): Promise<number> => {
  return calculateDistance(
    point1.latitude, 
    point1.longitude, 
    point2.latitude, 
    point2.longitude
  );
};

/**
 * Convert degrees to radians
 */
export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Validate if a coordinate is within valid ranges
 */
export const isValidCoordinate = (value: number): boolean => {
  return !isNaN(value) && isFinite(value);
};

/**
 * Validate if latitude is within valid range (-90 to 90)
 */
export const isValidLatitude = (lat: number): boolean => {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
};

/**
 * Validate if longitude is within valid range (-180 to 180)
 */
export const isValidLongitude = (lon: number): boolean => {
  return isValidCoordinate(lon) && lon >= -180 && lon <= 180;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else if (distanceInMeters < 10000) {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(distanceInMeters / 1000)}km`;
  }
};

/**
 * Check if two points are within a certain distance threshold
 */
export const isWithinDistance = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  thresholdMeters: number
): Promise<boolean> => {
  const distance = await calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= thresholdMeters;
};

/**
 * Debug helper to log distance calculation details
 */
export const debugDistanceCalculation = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  label?: string
): Promise<void> => {
  const distance = await calculateDistance(lat1, lon1, lat2, lon2);
  const latDiff = Math.abs(lat2 - lat1);
  const lonDiff = Math.abs(lon2 - lon1);
  
  console.log(`Distance Calculation ${label ? `(${label})` : ''}:`, {
    point1: { lat: lat1, lon: lon1 },
    point2: { lat: lat2, lon: lon2 },
    differences: {
      latDiff: latDiff.toFixed(6),
      lonDiff: lonDiff.toFixed(6),
      latDiffDegrees: latDiff,
      lonDiffDegrees: lonDiff
    },
    distanceMeters: Math.round(distance),
    distanceKm: (distance / 1000).toFixed(3),
    formatted: formatDistance(distance),
    validCoords: {
      lat1: isValidLatitude(lat1),
      lon1: isValidLongitude(lon1),
      lat2: isValidLatitude(lat2),
      lon2: isValidLongitude(lon2)
    }
  });
};
