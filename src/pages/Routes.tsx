import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { calculateGoogleMapsDistance } from "@/utils/googleMapsDistance";
import { calculateDistance, formatDistance, debugDistanceCalculation } from "@/utils/distanceCalculator";
import { useAgentActions } from "@/hooks/useAgentActions";
import { StoreSuccessDialog } from "@/components/StoreSuccessDialog";
import { useWorkspace } from "@/hooks/useWorkspace";

interface Store {
  id: string;
  store_name: string;
  county: string;
  store_lat: number;
  store_long: number;
  contact?: string;
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
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCounty, setNewStoreCounty] = useState("");
  const [newStoreContact, setNewStoreContact] = useState("");

  // Load last selected county from localStorage on mount
  useEffect(() => {
    const lastCounty = localStorage.getItem('lastSelectedCounty');
    if (lastCounty && counties.includes(lastCounty)) {
      setNewStoreCounty(lastCounty);
    } else if (counties.length > 0 && !newStoreCounty) {
      setNewStoreCounty(counties[0]);
    }
  }, [counties]);
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [addedStore, setAddedStore] = useState<{ id: string; name: string; county: string } | null>(null);
  const { toast } = useToast();
  const { recordLocationSet } = useAgentActions();
  const { currentWorkspaceId } = useWorkspace();

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

  const filteredStores = (selectedCounty === "all" 
    ? stores 
    : stores.filter(store => store.county === selectedCounty))
    .sort((a, b) => a.store_name.localeCompare(b.store_name));


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
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };


  const handleAddLocation = async () => {
    if (!newStoreName.trim() || !newStoreCounty.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both store name and county.",
        variant: "destructive",
      });
      return;
    }

    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location access to add a new store.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingStore(true);

      // Save selected county to localStorage
      localStorage.setItem('lastSelectedCounty', newStoreCounty.trim());

      // Get current user for added_by field
      const { data: { user } } = await supabase.auth.getUser();

      const { data: insertedStore, error } = await supabase
        .from('stores')
        .insert({
          store_name: newStoreName.trim(),
          county: newStoreCounty.trim(),
          store_lat: currentLocation.latitude,
          store_long: currentLocation.longitude,
          contact: newStoreContact.trim() || null,
          products: [], // Empty products array for new store
          added_by: user?.id || null,
          workspace_id: currentWorkspaceId
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Store the added store info and show success dialog
      setAddedStore({
        id: insertedStore.id,
        name: newStoreName.trim(),
        county: newStoreCounty.trim()
      });
      setShowSuccessDialog(true);

      // Reset form
      setNewStoreName("");
      setNewStoreContact("");
      // Don't reset county - keep the last selected value
      setShowAddLocationForm(false);

      // Refresh stores list
      await fetchStores();

    } catch (error: any) {
      console.error('Error adding store:', error);
      toast({
        title: "Error adding location",
        description: error.message || "Failed to add the new store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingStore(false);
    }
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

      // Round both device and store locations to 1 decimal place for calculation
      const roundedUserLat = Math.round(userLocation.latitude * 10) / 10;
      const roundedUserLng = Math.round(userLocation.longitude * 10) / 10;
      const roundedStoreLat = Math.round(selectedStoreData.store_lat * 10) / 10;
      const roundedStoreLng = Math.round(selectedStoreData.store_long * 10) / 10;

      console.log('📍 Location coordinates:', {
        original: { 
          user: { lat: userLocation.latitude, lng: userLocation.longitude },
          store: { lat: selectedStoreData.store_lat, lng: selectedStoreData.store_long }
        },
        rounded: { 
          user: { lat: roundedUserLat, lng: roundedUserLng },
          store: { lat: roundedStoreLat, lng: roundedStoreLng }
        }
      });

      // Calculate distance using Haversine formula with rounded coordinates
      const distance = await calculateDistance(
        roundedUserLat,
        roundedUserLng,
        roundedStoreLat,
        roundedStoreLng
      );

      console.log('✅ Haversine distance calculation:', {
        distanceMeters: Math.round(distance),
        distanceText: formatDistance(distance),
        roundedUserCoords: { lat: roundedUserLat, lng: roundedUserLng },
        roundedStoreCoords: { lat: roundedStoreLat, lng: roundedStoreLng },
        store: selectedStoreData.store_name
      });

      // Enhanced debug logging
      await debugDistanceCalculation(
        roundedUserLat,
        roundedUserLng,
        roundedStoreLat,
        roundedStoreLng,
        'Set Location (Haversine with 1dp Rounded Coords)'
      );

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
          workspace_id: currentWorkspaceId,
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

        // Record location setting action
        await recordLocationSet(
          user.id,
          { lat: userLocation.latitude, lng: userLocation.longitude },
          selectedStoreData.store_name,
          {
            distance_from_store: distance,
            store_coordinates: {
              lat: selectedStoreData.store_lat,
              lng: selectedStoreData.store_long
            }
          }
        );
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

        {/* Add Location Form */}
        <Card className="p-4 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={20} className="text-primary" />
            <h2 className="text-h2">Add Location</h2>
          </div>
          
          {!showAddLocationForm ? (
            <Button 
              onClick={() => setShowAddLocationForm(true)}
              variant="outline"
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              Add New Store Location
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="store-name" className="text-sm font-medium text-foreground mb-2 block">
                  Store Name
                </Label>
                <Input
                  id="store-name"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Enter store name"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="store-county" className="text-sm font-medium text-foreground mb-2 block">
                  County
                </Label>
                <Select value={newStoreCounty} onValueChange={setNewStoreCounty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {counties.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="store-contact" className="text-sm font-medium text-foreground mb-2 block">
                  Contact Number
                </Label>
                <Input
                  id="store-contact"
                  type="tel"
                  value={newStoreContact}
                  onChange={(e) => setNewStoreContact(e.target.value)}
                  placeholder="Enter contact number"
                  className="w-full"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Location Coordinates</p>
                {currentLocation ? (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Latitude: {currentLocation.latitude.toFixed(6)}</p>
                    <p>Longitude: {currentLocation.longitude.toFixed(6)}</p>
                    <p className="text-green-600">✓ Using current location</p>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <p className="text-orange-600">⚠ Location not available</p>
                    <p>Please enable location access to add a store</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddLocationForm(false);
                    setNewStoreName("");
                    setNewStoreCounty("");
                    setNewStoreContact("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddLocation}
                  disabled={isSubmittingStore || !currentLocation}
                  className="flex-1"
                >
                  {isSubmittingStore ? "Adding..." : "Add Store"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {addedStore && (
        <StoreSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          storeId={addedStore.id}
          storeName={addedStore.name}
          storeCounty={addedStore.county}
        />
      )}
    </MobileLayout>
  );
};