/**
 * Coordinate validation and debugging utilities
 */

export interface CoordinateInfo {
  lat: number;
  lng: number;
  isValid: boolean;
  precision: number;
  hemisphere: {
    lat: 'North' | 'South' | 'Equator';
    lng: 'East' | 'West' | 'Prime Meridian';
  };
}

export const validateCoordinate = (lat: number, lng: number): CoordinateInfo => {
  return {
    lat,
    lng,
    isValid: lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
    precision: Math.max(
      lat.toString().split('.')[1]?.length || 0,
      lng.toString().split('.')[1]?.length || 0
    ),
    hemisphere: {
      lat: lat > 0 ? 'North' : lat < 0 ? 'South' : 'Equator',
      lng: lng > 0 ? 'East' : lng < 0 ? 'West' : 'Prime Meridian'
    }
  };
};

export const formatCoordinate = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
};

export const calculateCoordinateDifference = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
) => {
  return {
    latDiff: Math.abs(lat1 - lat2),
    lngDiff: Math.abs(lng1 - lng2),
    totalDiff: Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)),
    // Rough distance in meters (1 degree ≈ 111,000m)
    roughDistanceMeters: Math.sqrt(
      Math.pow((lat1 - lat2) * 111000, 2) + 
      Math.pow((lng1 - lng2) * 111000 * Math.cos((lat1 + lat2) / 2 * Math.PI / 180), 2)
    )
  };
};

// Known locations for reference
export const KNOWN_LOCATIONS = {
  CLEANSHELF_LANGATA: {
    name: 'Cleanshelf Langata',
    lat: -1.32415,
    lng: 36.78283,
    address: 'Lang\'ata Road, Nairobi, Kenya'
  },
  NAIROBI_CENTER: {
    name: 'Nairobi City Center',
    lat: -1.286389,
    lng: 36.817223,
    address: 'Nairobi, Kenya'
  },
  KAREN: {
    name: 'Karen, Nairobi',
    lat: -1.3191,
    lng: 36.6816,
    address: 'Karen, Nairobi, Kenya'
  }
};

export const debugCoordinates = (
  label: string,
  lat: number,
  lng: number,
  compareTo?: { lat: number; lng: number; name: string }
) => {
  const info = validateCoordinate(lat, lng);
  const formatted = formatCoordinate(lat, lng);
  
  console.log(`📍 ${label}:`, {
    coordinates: { lat, lng },
    formatted,
    precision: `${info.precision} decimal places`,
    hemisphere: info.hemisphere,
    isValid: info.isValid
  });

  if (compareTo) {
    const diff = calculateCoordinateDifference(lat, lng, compareTo.lat, compareTo.lng);
    console.log(`🔍 Distance from ${compareTo.name}:`, {
      latDiff: diff.latDiff.toFixed(6),
      lngDiff: diff.lngDiff.toFixed(6),
      totalDiff: diff.totalDiff.toFixed(6),
      roughDistanceMeters: Math.round(diff.roughDistanceMeters),
      roughDistanceKm: (diff.roughDistanceMeters / 1000).toFixed(2)
    });
  }
};
