// [CMP-2388e4] GoogleMapsStatus — google maps status component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { googleMapsService } from '@/services/googleMapsService';

export const GoogleMapsStatus = () => {
  const isConfigured = googleMapsService.isConfigured();
  const maskedApiKey = googleMapsService.getMaskedApiKey();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Google Maps API Status
        </CardTitle>
        <CardDescription>
          Distance calculation service configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Key Status:</span>
            <Badge 
              variant={isConfigured ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {isConfigured ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Configured
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Key:</span>
            <span className="text-xs font-mono text-muted-foreground">
              {maskedApiKey}
            </span>
          </div>

          {!isConfigured && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Google Maps API Key Required</p>
                  <p className="text-xs mt-1">
                    Add <code className="bg-yellow-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file for accurate road distance calculations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isConfigured && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Distance Calculation Active</p>
                  <p className="text-xs mt-1">
                    Using Google Maps Distance Matrix API for accurate road distances with Haversine fallback.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
