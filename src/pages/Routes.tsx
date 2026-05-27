// [CMP-b80512] Routes — routes/store assignments page
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { calculateDistance, formatDistance, debugDistanceCalculation } from "@/utils/distanceCalculator";
import { reverseGeocode } from "@/utils/googleMapsGeocoding";
import { useAgentActions } from "@/hooks/useAgentActions";
import { StoreSuccessDialog } from "@/components/StoreSuccessDialog";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";

interface Store {
  id: string;
  store_name: string;
  county: string;
  country?: string;
  store_lat: number;
  store_long: number;
  contact?: string;
}

export const Routes = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [storeSearchText, setStoreSearchText] = useState<string>("");
  const [showStoreList, setShowStoreList] = useState<boolean>(false);
  const [countries, setCountries] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreContact, setNewStoreContact] = useState("");
  const [geocodedLocation, setGeocodedLocation] = useState<{ county: string; country: string } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const [isSubmittingStore, setIsSubmittingStore] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [addedStore, setAddedStore] = useState<{ id: string; name: string; county: string } | null>(null);
  const { toast } = useToast();
  const { recordLocationSet } = useAgentActions();
  const { currentWorkspaceId } = useWorkspace();
  const { isEnabled } = useProjectComponents();

  // Check if current team type is wholesale/instore - hide Add Location for these types
  const showAddStore = isEnabled('CRM-0098A');
  const showStoresList = isEnabled('CRM-0098L');

  useEffect(() => {
    if (!currentWorkspaceId) {
      setStores([]);
      setCountries([]);
      setSelectedCountry("");
      setSelectedStore("all");
      setStoreSearchText("");
      return;
    }

    fetchStores();
    requestLocation();
    setSelectedCountry("");
    setSelectedStore("all");
    setStoreSearchText("");
  }, [currentWorkspaceId]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
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
        maximumAge: 0,
      },
    );
  };

  const fetchStores = async () => {
    if (!currentWorkspaceId) {
      setStores([]);
      setCountries([]);
      return;
    }

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("workspace_id", currentWorkspaceId)
      .eq("is_deleted", false);

    if (error) {
      console.error("Error fetching stores:", error);
      return;
    }

    if (data) {
      setStores(data);
      const uniqueCountries = Array.from(new Set(data.map((store) => store.country).filter(Boolean))) as string[];
      setCountries(uniqueCountries);
      setSelectedCountry((prev) =>
        prev && uniqueCountries.includes(prev) ? prev : uniqueCountries[0] ?? "",
      );
    }
  };

  const filteredStores = (
    selectedCountry ? stores.filter((store) => store.country === selectedCountry) : stores
  ).sort((a, b) => a.store_name.localeCompare(b.store_name));

  const storeSearchResults = filteredStores.filter((store) =>
    store.store_name.toLowerCase().includes(storeSearchText.toLowerCase())
  );

  useEffect(() => {
    if (!currentLocation) {
      setGeocodedLocation(null);
      setGeocodingError(null);
      return;
    }

    let cancelled = false;
    setIsGeocoding(true);
    setGeocodingError(null);

    reverseGeocode(currentLocation.latitude, currentLocation.longitude)
      .then((result) => {
        if (!cancelled) {
          setGeocodedLocation(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setGeocodedLocation(null);
          setGeocodingError(error.message || "Failed to resolve address from location");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsGeocoding(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentLocation]);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
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
          maximumAge: 0,
        },
      );
    });
  };

  const resolveCountyAndCountry = async (
    location: { latitude: number; longitude: number },
  ): Promise<{ county: string; country: string }> => {
    if (
      geocodedLocation &&
      currentLocation?.latitude === location.latitude &&
      currentLocation?.longitude === location.longitude
    ) {
      return geocodedLocation;
    }

    const result = await reverseGeocode(location.latitude, location.longitude);
    setGeocodedLocation(result);
    setGeocodingError(null);
    return result;
  };

  const handleAddLocation = async () => {
    if (!newStoreName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a store name.",
        variant: "destructive",
      });
      return;
    }

    if (!currentWorkspaceId) {
      toast({
        title: "Workspace Required",
        description: "No workspace selected. Please select a workspace first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingStore(true);

      let location = currentLocation;
      if (!location) {
        location = await getCurrentLocation();
        setCurrentLocation(location);
      }

      let locationDetails: { county: string; country: string };
      try {
        locationDetails = await resolveCountyAndCountry(location);
      } catch (error: any) {
        toast({
          title: "Location Required",
          description:
            error.message ||
            geocodingError ||
            "Could not determine county and country from your location. Please enable location access and try again.",
          variant: "destructive",
        });
        return;
      }

      // Get current user for added_by field
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: insertedStore, error } = await supabase
        .from("stores")
        .insert({
          store_name: newStoreName.trim(),
          county: locationDetails.county,
          store_lat: location.latitude,
          store_long: location.longitude,
          contact: newStoreContact.trim() || null,
          added_by: user?.id || null,
          workspace_id: currentWorkspaceId,
          country: locationDetails.country,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      // Auto-add to project's target_stores
      if (currentWorkspaceId) {
        const { data: activeProject } = await supabase
          .from("project_plans")
          .select("id")
          .eq("workspace_id", currentWorkspaceId)
          .eq("status", "active")
          .eq("is_deleted", false)
          .limit(1)
          .single();

        if (activeProject && insertedStore) {
          // Fetch current target_stores and append the new store UUID
          const { data: currentProject } = await supabase
            .from("project_plans")
            .select("target_stores")
            .eq("id", activeProject.id)
            .single();

          // Ensure we work with a proper array of UUID strings
          const rawStores = currentProject?.target_stores;
          const currentStores: string[] = Array.isArray(rawStores)
            ? rawStores.filter((s): s is string => typeof s === "string")
            : [];

          const storeId = String(insertedStore.id);
          if (!currentStores.includes(storeId)) {
            const updatedStores = [...currentStores, storeId];
            await supabase.from("project_plans").update({ target_stores: updatedStores }).eq("id", activeProject.id);
          }
        }
      }

      // Store the added store info and show success dialog
      setAddedStore({
        id: insertedStore.id,
        name: newStoreName.trim(),
        county: locationDetails.county,
      });
      setShowSuccessDialog(true);

      // Reset form
      setNewStoreName("");
      setNewStoreContact("");
      setShowAddLocationForm(false);

      // Refresh stores list
      await fetchStores();
    } catch (error: any) {
      console.error("Error adding store:", error);
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const selectedStoreData = stores.find((s) => s.id === selectedStore);

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

      console.log("📍 Location coordinates:", {
        original: {
          user: { lat: userLocation.latitude, lng: userLocation.longitude },
          store: { lat: selectedStoreData.store_lat, lng: selectedStoreData.store_long },
        },
        rounded: {
          user: { lat: roundedUserLat, lng: roundedUserLng },
          store: { lat: roundedStoreLat, lng: roundedStoreLng },
        },
      });

      // Calculate distance using Haversine formula with rounded coordinates
      const distance = await calculateDistance(roundedUserLat, roundedUserLng, roundedStoreLat, roundedStoreLng);

      console.log("✅ Haversine distance calculation:", {
        distanceMeters: Math.round(distance),
        distanceText: formatDistance(distance),
        roundedUserCoords: { lat: roundedUserLat, lng: roundedUserLng },
        roundedStoreCoords: { lat: roundedStoreLat, lng: roundedStoreLng },
        store: selectedStoreData.store_name,
      });

      // Enhanced debug logging
      await debugDistanceCalculation(
        roundedUserLat,
        roundedUserLng,
        roundedStoreLat,
        roundedStoreLng,
        "Set Location (Haversine with 1dp Rounded Coords)",
      );

      const inRange = distance <= 100;

      const { error } = await supabase.from("agent_status_log").insert({
        agent_id: user.id,
        status: "set_location",
        location_lat: userLocation.latitude,
        location_lng: userLocation.longitude,
        assigned_location_lat: selectedStoreData.store_lat,
        assigned_location_lng: selectedStoreData.store_long,
        distance_from_assigned: distance,
        in_range: inRange,
        workspace_id: currentWorkspaceId,
        store_id: selectedStoreData.id,
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
              lng: selectedStoreData.store_long,
            },
          },
        );
      }

      setSelectedStore("all");
      setStoreSearchText("");
    } catch (error: any) {
      console.error("Error setting location:", error);
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
      {/* Set Assigned Location - Hidden for seeding */}
      {showAddStore && (
        <div className="px-4 pt-4 pb-20">
          <Card className="p-4">
            <h2 className="text-h2 mb-4">Set Your Assigned Location</h2>

            {/* Current Location Display */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">Current Location</p>
              {isLoadingLocation && <p className="text-xs text-muted-foreground">Getting your location...</p>}
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
                <label className="text-sm font-medium text-foreground mb-2 block">Country</label>
                <Select value={selectedCountry} onValueChange={(val) => { setSelectedCountry(val); setSelectedStore("all"); setStoreSearchText(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Store</label>
                <div className="relative">
                  <Input
                    placeholder="Search stores..."
                    value={storeSearchText}
                    onChange={(e) => {
                      setStoreSearchText(e.target.value);
                      setSelectedStore("all");
                      setShowStoreList(true);
                    }}
                    onFocus={() => setShowStoreList(true)}
                    onBlur={() => setTimeout(() => setShowStoreList(false), 150)}
                  />
                  {showStoreList && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {storeSearchResults.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No stores found</div>
                      ) : (
                        storeSearchResults.map((store) => (
                            <div
                              key={store.id}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                              onMouseDown={() => {
                                setSelectedStore(store.id);
                                setStoreSearchText(store.store_name);
                                setShowStoreList(false);
                              }}
                            >
                              {store.store_name}
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting || selectedStore === "all"} className="w-full">
                {isSubmitting ? "Setting Location..." : "Submit Location"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="px-4 pb-20">
        {/* Add Location Form - Hidden for wholesale, instore, sampling */}
        {showStoresList && (
          <Card className="p-4 mt-2">
            <div className="flex items-center gap-2 mb-4">
              <Plus size={20} className="text-primary" />
              <h2 className="text-h2">Add Store</h2>
            </div>

            {!showAddLocationForm ? (
              <Button
                onClick={() => {
                  setShowAddLocationForm(true);
                  if (!currentLocation && !isLoadingLocation) {
                    requestLocation();
                  }
                }}
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

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddLocationForm(false);
                      setNewStoreName("");
                      setNewStoreContact("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddLocation}
                    disabled={isSubmittingStore || isLoadingLocation}
                    className="flex-1"
                  >
                    {isSubmittingStore ? "Adding..." : isLoadingLocation ? "Getting location..." : "Add Store"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
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
