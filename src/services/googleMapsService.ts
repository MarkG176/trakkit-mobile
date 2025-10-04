/**
 * Google Maps API service for distance calculations
 * Uses Google Maps Distance Matrix API for accurate road distances
 */

interface GoogleMapsConfig {
  apiKey: string;
  baseUrl: string;
}

interface DistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: Array<{
    elements: Array<{
      distance?: {
        text: string;
        value: number; // Distance in meters
      };
      duration?: {
        text: string;
        value: number; // Duration in seconds
      };
      status: string;
    }>;
  }>;
  status: string;
}

interface DistanceResult {
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'MAX_ROUTE_LENGTH_EXCEEDED' | 'ERROR';
}

class GoogleMapsService {
  private config: GoogleMapsConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      baseUrl: 'https://maps.googleapis.com/maps/api/distancematrix/json'
    };

    if (!this.config.apiKey) {
      console.warn('Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
    }
  }

  /**
   * Calculate distance between two coordinates using Google Maps Distance Matrix API
   */
  async calculateDistance(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number
  ): Promise<DistanceResult> {
    if (!this.config.apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const origin = `${originLat},${originLng}`;
    const destination = `${destinationLat},${destinationLng}`;

    const url = new URL(this.config.baseUrl);
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('units', 'metric');
    url.searchParams.set('mode', 'driving'); // Can be 'walking', 'bicycling', 'transit'

    try {
      console.log('🌍 Fetching distance from Google Maps API...', {
        origin,
        destination,
        url: url.toString()
      });

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Google Maps API request failed: ${response.status} ${response.statusText}`);
      }

      const data: DistanceMatrixResponse = await response.json();

      console.log('🗺️ Google Maps API Response:', data);

      if (data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${data.status}`);
      }

      const element = data.rows[0]?.elements[0];

      if (!element) {
        throw new Error('No route found between the specified locations');
      }

      if (element.status !== 'OK') {
        return {
          distanceMeters: 0,
          distanceText: 'Route not available',
          durationSeconds: 0,
          durationText: 'Route not available',
          status: element.status as any
        };
      }

      const result: DistanceResult = {
        distanceMeters: element.distance?.value || 0,
        distanceText: element.distance?.text || '0 m',
        durationSeconds: element.duration?.value || 0,
        durationText: element.duration?.text || '0 mins',
        status: 'OK'
      };

      console.log('✅ Distance calculated successfully:', result);

      return result;

    } catch (error) {
      console.error('❌ Google Maps API error:', error);
      throw error;
    }
  }

  /**
   * Calculate distance with fallback to Haversine formula if Google Maps fails
   */
  async calculateDistanceWithFallback(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number
  ): Promise<DistanceResult> {
    try {
      // Try Google Maps API first
      return await this.calculateDistance(originLat, originLng, destinationLat, destinationLng);
    } catch (error) {
      console.warn('🔄 Google Maps API failed, falling back to Haversine formula:', error);
      
      // Fallback to Haversine formula
      const { calculateDistance } = await import('@/utils/distanceCalculator');
      const haversineDistance = await calculateDistance(originLat, originLng, destinationLat, destinationLng);
      
      return {
        distanceMeters: Math.round(haversineDistance),
        distanceText: `${Math.round(haversineDistance)} m`,
        durationSeconds: 0,
        durationText: 'Not available',
        status: 'OK'
      };
    }
  }

  /**
   * Check if the API key is configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Get the configured API key (masked for security)
   */
  getMaskedApiKey(): string {
    if (!this.config.apiKey) return 'Not configured';
    return `${this.config.apiKey.substring(0, 8)}...${this.config.apiKey.substring(this.config.apiKey.length - 4)}`;
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();

// Export types
export type { DistanceResult, DistanceMatrixResponse };
