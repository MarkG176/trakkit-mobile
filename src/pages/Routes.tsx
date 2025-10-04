import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

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

  const getStoreDistance = (store: Store): number | null => {
    if (!currentLocation) return null;
    return calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      store.store_lat,
      store.store_long
    );
  };

  const formatDistance = (distance: number | null): string => {
    if (distance === null) return '';
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

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

      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        selectedStoreData.store_lat,
        selectedStoreData.store_long
      );

      console.log('Distance calculation:', {
        userLocation,
        storeLocation: { lat: selectedStoreData.store_lat, lng: selectedStoreData.store_long },
        distanceInMeters: distance,
        distanceInKm: (distance / 1000).toFixed(2)
      });

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
          description: `You are ${Math.round(distance)}m from ${selectedStoreData.store_name}. Please move within 100m to check in.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Location set successfully",
          description: `Your assigned location is ${selectedStoreData.store_name}. You are ${Math.round(distance)}m from the store.`,
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
                  {filteredStores.map(store => {
                    const distance = getStoreDistance(store);
                    return (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_name} {distance !== null ? `- ${formatDistance(distance)}` : ''}
                      </SelectItem>
                    );
                  })}
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