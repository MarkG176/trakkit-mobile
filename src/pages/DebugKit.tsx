import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Mic, MapPin, StopCircle, Navigation } from "lucide-react";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { GoogleMapsStatus } from "@/components/GoogleMapsStatus";
import { WorkspaceContext } from "@/components/WorkspaceContext";
import { DistanceDebugger } from "@/components/DistanceDebugger";
import { StoreCoordinateChecker } from "@/components/StoreCoordinateChecker";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance, formatDistance, debugDistanceCalculation } from "@/utils/distanceCalculator";
import { googleMapsService } from "@/services/googleMapsService";

interface Store {
  id: string;
  store_name: string;
  county: string;
  store_lat: number;
  store_long: number;
}

export const DebugKit = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  
  // Store selection and distance calculation
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [storeDistance, setStoreDistance] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const { position, error: locationError } = useLiveLocation(showLocation);

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  // Calculate distance when position or selected store changes
  useEffect(() => {
    if (position && selectedStore) {
      calculateDistanceToStore();
    }
  }, [position, selectedStore]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('store_name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to fetch stores');
    }
  };

  const calculateDistanceToStore = async () => {
    if (!position || !selectedStore) return;

    setIsCalculatingDistance(true);
    
    try {
      const store = stores.find(s => s.id === selectedStore);
      if (!store) return;

      // Round device location to 2 decimal places for calculation
      const roundedLat = Math.round(position.latitude * 100) / 100;
      const roundedLng = Math.round(position.longitude * 100) / 100;

      console.log('📍 Debug Kit coordinates:', {
        original: { lat: position.latitude, lng: position.longitude },
        rounded: { lat: roundedLat, lng: roundedLng },
        store: { lat: store.store_lat, lng: store.store_long }
      });

      // Use Haversine formula for distance calculation with rounded coordinates
      const distance = await calculateDistance(
        roundedLat,
        roundedLng,
        store.store_lat,
        store.store_long
      );

      setStoreDistance(distance);

      // Debug logging
      await debugDistanceCalculation(
        roundedLat,
        roundedLng,
        store.store_lat,
        store.store_long,
        `Debug Kit - ${store.store_name} (Rounded Coords)`
      );

      toast.success(`Distance calculated: ${formatDistance(distance)}`);
    } catch (error) {
      console.error('Error calculating distance:', error);
      toast.error('Failed to calculate distance');
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    toast.success("Photo captured successfully!");
    console.log("Captured image:", imageData);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        toast.success("Recording saved!");
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (err) {
      toast.error("Failed to start recording");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Debug Kit</h1>
        <p className="text-sm opacity-90">Test device capabilities: camera, microphone, and location</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Camera Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Test
            </CardTitle>
            <CardDescription>Test camera capture functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCameraOpen(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Open Camera
            </Button>
          </CardContent>
        </Card>

        {/* Recording Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Recording Test
            </CardTitle>
            <CardDescription>Test microphone and audio recording</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {!isRecording ? (
                <Button onClick={startRecording}>
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive">
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              )}
            </div>
            {recordedAudio && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Recorded Audio:</p>
                <audio controls src={recordedAudio} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Test
            </CardTitle>
            <CardDescription>Test geolocation functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setShowLocation(!showLocation)}>
              <MapPin className="mr-2 h-4 w-4" />
              {showLocation ? "Hide Location" : "Show Location"}
            </Button>

            {showLocation && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                {locationError ? (
                  <p className="text-destructive">Error: {locationError}</p>
                ) : position ? (
                  <>
                    <div className="space-y-2">
                      <p className="font-medium">Current Location:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Latitude:</span>
                          <p className="font-mono">{position.latitude.toFixed(6)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Longitude:</span>
                          <p className="font-mono">{position.longitude.toFixed(6)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rounded (2dp):</span>
                          <p className="font-mono">{(Math.round(position.latitude * 100) / 100).toFixed(2)}, {(Math.round(position.longitude * 100) / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Accuracy:</span>
                          <p className="font-mono">{position.accuracy.toFixed(2)}m</p>
                        </div>
                      </div>
                    </div>

                    {/* Store Selection Form */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        <p className="font-medium">Calculate Distance to Store</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Store:</label>
                        <Select value={selectedStore} onValueChange={setSelectedStore}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a store" />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.store_name} - {store.county}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedStore && storeDistance !== null && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Distance to Store:</span>
                            <span className="text-lg font-bold text-blue-600">
                              {Math.round(storeDistance)}m
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Using Haversine formula with 2 decimal place precision
                          </div>
                        </div>
                      )}

                      {isCalculatingDistance && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          Calculating distance...
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Getting location...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Maps API Status */}
        <GoogleMapsStatus />

        {/* Workspace Context */}
        <WorkspaceContext />

        {/* Distance Debugger */}
        <DistanceDebugger />

        {/* Store Coordinate Checker */}
        <StoreCoordinateChecker />

        {/* Note: CameraCapture component would need to be created or imported */}
        {/* <CameraCapture
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Debug Camera Test"
        /> */}
      </div>
    </MobileLayout>
  );
};
