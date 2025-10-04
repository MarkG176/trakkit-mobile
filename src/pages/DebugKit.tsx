import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Mic, MapPin, StopCircle } from "lucide-react";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { toast } from "sonner";
import { MobileLayout } from "@/components/MobileLayout";
import { GoogleMapsStatus } from "@/components/GoogleMapsStatus";
import { WorkspaceContext } from "@/components/WorkspaceContext";

export const DebugKit = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);

  const { position, error: locationError } = useLiveLocation(showLocation);

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
              <div className="mt-4 p-4 bg-muted rounded-lg">
                {locationError ? (
                  <p className="text-destructive">Error: {locationError}</p>
                ) : position ? (
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
                        <span className="text-muted-foreground">Accuracy:</span>
                        <p className="font-mono">{position.accuracy.toFixed(2)}m</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timestamp:</span>
                        <p className="font-mono">{new Date(position.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
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
