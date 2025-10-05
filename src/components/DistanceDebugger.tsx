import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calculator, AlertCircle } from 'lucide-react';
import { calculateDistance, debugDistanceCalculation } from '@/utils/distanceCalculator';
import { googleMapsService } from '@/services/googleMapsService';
import { debugCoordinates, KNOWN_LOCATIONS, calculateCoordinateDifference } from '@/utils/coordinateValidator';

// Cleanshelf Langata coordinates
const CLEANSHELF_COORDS = {
  name: 'Cleanshelf Langata',
  latitude: -1.32415,
  longitude: 36.78283
};

export const DistanceDebugger: React.FC = () => {
  const [deviceCoords, setDeviceCoords] = useState({ lat: '', lng: '' });
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [googleDistance, setGoogleDistance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    const lat = parseFloat(deviceCoords.lat);
    const lng = parseFloat(deviceCoords.lng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Haversine calculation
      const haversineDistance = calculateDistance(
        lat,
        lng,
        CLEANSHELF_COORDS.latitude,
        CLEANSHELF_COORDS.longitude
      );
      setCalculatedDistance(haversineDistance);

      // Google Maps calculation
      try {
        const googleResult = await googleMapsService.calculateDistanceWithFallback(
          lat,
          lng,
          CLEANSHELF_COORDS.latitude,
          CLEANSHELF_COORDS.longitude
        );
        setGoogleDistance(googleResult);
      } catch (googleError) {
        console.warn('Google Maps calculation failed:', googleError);
        setGoogleDistance({ error: 'Google Maps calculation failed' });
      }

      // Enhanced debug logging
      debugCoordinates('Device Location', lat, lng, CLEANSHELF_COORDS);
      debugDistanceCalculation(
        lat,
        lng,
        CLEANSHELF_COORDS.latitude,
        CLEANSHELF_COORDS.longitude,
        'Manual Debug Test'
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceCoords({
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString()
        });
        setError(null);
      },
      (err) => {
        setError(`Geolocation error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Distance Calculation Debugger
        </CardTitle>
        <CardDescription>
          Debug distance calculation issues between your device and Cleanshelf Langata
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Location */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Target Location (Cleanshelf Langata)</Label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">{CLEANSHELF_COORDS.name}</span>
            </div>
            <div className="text-sm font-mono">
              <div>Latitude: {CLEANSHELF_COORDS.latitude}</div>
              <div>Longitude: {CLEANSHELF_COORDS.longitude}</div>
            </div>
          </div>
        </div>

        {/* Device Location Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Your Device Location</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="lat" className="text-xs">Latitude</Label>
              <Input
                id="lat"
                placeholder="-1.32415"
                value={deviceCoords.lat}
                onChange={(e) => setDeviceCoords(prev => ({ ...prev, lat: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lng" className="text-xs">Longitude</Label>
              <Input
                id="lng"
                placeholder="36.78283"
                value={deviceCoords.lng}
                onChange={(e) => setDeviceCoords(prev => ({ ...prev, lng: e.target.value }))}
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={getCurrentLocation}>
            Get Current Location
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
          {isLoading ? 'Calculating...' : 'Calculate Distance'}
        </Button>

        {/* Results */}
        {calculatedDistance !== null && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 border rounded-lg">
              <h4 className="font-medium mb-2">Haversine Formula Result:</h4>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(calculatedDistance)}m
              </div>
              <div className="text-sm text-gray-600">
                ({Math.round(calculatedDistance / 1000 * 100) / 100}km)
              </div>
            </div>

            {googleDistance && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium mb-2">Google Maps API Result:</h4>
                {googleDistance.error ? (
                  <div className="text-red-600 text-sm">{googleDistance.error}</div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {googleDistance.distanceMeters}m
                    </div>
                    <div className="text-sm text-gray-600">
                      {googleDistance.distanceText} • {googleDistance.durationText}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comparison */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium mb-2">Analysis:</h4>
              <div className="space-y-1 text-sm">
                <div>Expected Range: 400-600m</div>
                <div>Haversine Distance: {Math.round(calculatedDistance)}m</div>
                {googleDistance && !googleDistance.error && (
                  <div>Google Maps Distance: {googleDistance.distanceMeters}m</div>
                )}
                <div className="mt-2">
                  <Badge 
                    variant={calculatedDistance >= 400 && calculatedDistance <= 600 ? "default" : "destructive"}
                  >
                    {calculatedDistance >= 400 && calculatedDistance <= 600 ? "✅ In Expected Range" : "❌ Outside Expected Range"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="text-xs font-mono space-y-1 p-2 bg-gray-100 rounded">
          <div>Target: [{CLEANSHELF_COORDS.latitude}, {CLEANSHELF_COORDS.longitude}]</div>
          <div>Device: [{deviceCoords.lat || '?'}, {deviceCoords.lng || '?'}]</div>
          <div>Difference: Lat {deviceCoords.lat ? (parseFloat(deviceCoords.lat) - CLEANSHELF_COORDS.latitude).toFixed(6) : '?'}, Lng {deviceCoords.lng ? (parseFloat(deviceCoords.lng) - CLEANSHELF_COORDS.longitude).toFixed(6) : '?'}</div>
        </div>
      </CardContent>
    </Card>
  );
};
