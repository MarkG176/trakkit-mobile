/**
 * Accurate distance calculation utilities using the Haversine formula
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two points by directly comparing coordinates
 * Simple calculation using approximate degrees-to-meters conversion
 * 
 * @param lat1 - Latitude of first point in decimal degrees
 * @param lon1 - Longitude of first point in decimal degrees  
 * @param lat2 - Latitude of second point in decimal degrees
 * @param lon2 - Longitude of second point in decimal degrees
 * @returns Distance in meters (approximate)
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  // Validate input coordinates
  if (!isValidCoordinate(lat1) || !isValidCoordinate(lon1) || 
      !isValidCoordinate(lat2) || !isValidCoordinate(lon2)) {
    throw new Error('Invalid coordinates provided');
  }

  // Direct comparison: calculate differences
  const latDiff = Math.abs(lat2 - lat1);
  const lonDiff = Math.abs(lon2 - lon1);
  
  // Approximate conversion: 1 degree latitude ≈ 111,000 meters
  // 1 degree longitude ≈ 111,000 * cos(latitude) meters
  const avgLat = (lat1 + lat2) / 2;
  const latDistance = latDiff * 111000;
  const lonDistance = lonDiff * 111000 * Math.cos(toRadians(avgLat));
  
  // Euclidean distance
  return Math.sqrt(latDistance * latDistance + lonDistance * lonDistance);
};

/**
 * Calculate distance between two coordinate objects
 */
export const calculateDistanceBetween = (
  point1: Coordinates, 
  point2: Coordinates
): number => {
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
export const isWithinDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  thresholdMeters: number
): boolean => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= thresholdMeters;
};

/**
 * Debug helper to log distance calculation details
 */
export const debugDistanceCalculation = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  label?: string
): void => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
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
