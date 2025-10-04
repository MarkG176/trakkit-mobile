import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { calculateDistance, formatDistance, debugDistanceCalculation } from "@/utils/distanceCalculator";
import { googleMapsService } from "@/services/googleMapsService";

interface Store {
  id: string;
  store_name: string;
  county: string;
  store_lat: number;
  store_long: number;
}


export const Routes = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [counties, setCounties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStores();
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*');

    if (error) {
      console.error('Error fetching stores:', error);
      return;
    }

    if (data) {
      setStores(data);
      const uniqueCounties = Array.from(new Set(data.map(store => store.county)));
      setCounties(uniqueCounties);
    }
  };

  const filteredStores = selectedCounty === "all" 
    ? stores 
    : stores.filter(store => store.county === selectedCounty);


  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const handleSubmit = async () => {
    if (selectedStore === "all") {
      toast({
        title: "Select a store",
        description: "Please select a specific store to set as your location.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please log in to set your location.",
          variant: "destructive",
        });
        return;
      }

      let userLocation = currentLocation;
      if (!userLocation) {
        userLocation = await getCurrentLocation();
      }
      const selectedStoreData = stores.find(s => s.id === selectedStore);

      if (!selectedStoreData) {
        toast({
          title: "Store not found",
          description: "The selected store could not be found.",
          variant: "destructive",
        });
        return;
      }

      // Calculate distance using Google Maps API with fallback to Haversine
      let distance: number;
      let distanceText: string;
      let durationText: string;

      try {
        console.log('🌍 Using Google Maps API for distance calculation...');
        const googleResult = await googleMapsService.calculateDistanceWithFallback(
          userLocation.latitude,
          userLocation.longitude,
          selectedStoreData.store_lat,
          selectedStoreData.store_long
        );

        distance = googleResult.distanceMeters;
        distanceText = googleResult.distanceText;
        durationText = googleResult.durationText;

        console.log('✅ Google Maps distance result:', {
          distanceMeters: distance,
          distanceText,
          durationText,
          status: googleResult.status
        });

      } catch (error) {
        console.warn('⚠️ Google Maps failed, using Haversine fallback:', error);
        
        // Fallback to Haversine formula
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          selectedStoreData.store_lat,
          selectedStoreData.store_long
        );
        distanceText = formatDistance(distance);
        durationText = 'Not available';

        // Enhanced debug logging for fallback
        debugDistanceCalculation(
          userLocation.latitude,
          userLocation.longitude,
          selectedStoreData.store_lat,
          selectedStoreData.store_long,
          'Set Location (Haversine Fallback)'
        );
      }

      const inRange = distance <= 100;

      const { error } = await supabase
        .from('agent_status_log')
        .insert({
          agent_id: user.id,
          status: 'set_location',
          location_lat: userLocation.latitude,
          location_lng: userLocation.longitude,
          assigned_location_lat: selectedStoreData.store_lat,
          assigned_location_lng: selectedStoreData.store_long,
          distance_from_assigned: distance,
          in_range: inRange,
        });

      if (error) throw error;

      if (!inRange) {
        toast({
          title: "Out of Range",
          description: `You are ${distanceText} from ${selectedStoreData.store_name}. Please move within 100m to check in.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Location set successfully",
          description: `Your assigned location is ${selectedStoreData.store_name}. Distance: ${distanceText}${durationText !== 'Not available' ? ` (${durationText})` : ''}.`,
        });
      }

      setSelectedStore("all");
    } catch (error: any) {
      console.error('Error setting location:', error);
      toast({
        title: "Error setting location",
        description: error.message || "Failed to set your location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout currentPage="routes">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Routes & Planning</h1>
        <p className="text-sm opacity-90">Manage and optimize your routes</p>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="relative h-64 bg-muted m-4 rounded-lg overflow-hidden border border-border">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent to-muted">
          <div className="text-center">
            <MapPin size={48} className="text-primary mx-auto mb-3 opacity-60" />
            <p className="text-base font-medium text-foreground">Interactive Route Map</p>
            <p className="text-xs text-muted-foreground mt-1">Routes and agent locations will display here</p>
          </div>
        </div>
      </div>

      {/* Location Selection Form */}
      <div className="px-4 pb-20">
        <Card className="p-4">
          <h2 className="text-h2 mb-4">Set Your Assigned Location</h2>
          
          {/* Current Location Display */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Current Location</p>
            {isLoadingLocation && (
              <p className="text-xs text-muted-foreground">Getting your location...</p>
            )}
            {locationError && (
              <div>
                <p className="text-xs text-destructive mb-2">{locationError}</p>
                <Button size="sm" variant="outline" onClick={requestLocation}>
                  Retry
                </Button>
              </div>
            )}
            {currentLocation && !isLoadingLocation && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Latitude: {currentLocation.latitude.toFixed(6)}</p>
                <p>Longitude: {currentLocation.longitude.toFixed(6)}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">County</label>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {counties.map(county => (
                    <SelectItem key={county} value={county}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Store</label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select a store</SelectItem>
                  {filteredStores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || selectedStore === "all"}
              className="w-full"
            >
              {isSubmitting ? "Setting Location..." : "Submit Location"}
            </Button>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
};