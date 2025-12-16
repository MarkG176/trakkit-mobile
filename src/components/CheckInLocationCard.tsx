import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Camera, CheckCircle, Clock } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export const CheckInLocationCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const cameraRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);

  // Fetch last location check-in
  useEffect(() => {
    const fetchLastCheckIn = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('agent_status_log')
          .select('timestamp')
          .eq('agent_id', user.id)
          .eq('status', 'location_check_in')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setLastCheckIn(new Date(data.timestamp));
        }
      } catch (error) {
        // No previous check-in, that's fine
      } finally {
        setLoading(false);
      }
    };

    fetchLastCheckIn();

    // Loading timeout fallback
    const timeoutId = setTimeout(() => {
      setLoadingOverride(true);
      setLoading(false);
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, [user]);

  const handleCheckIn = useCallback(() => {
    if (!user || isCheckingIn || isProcessingRef.current) {
      return;
    }
    cameraRef.current?.click();
  }, [user, isCheckingIn]);

  const handleCameraCapture = useCallback(async (imageUrl: string) => {
    if (!user || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setIsCheckingIn(true);

    try {
      const location = await getCurrentLocation();

      const { error } = await supabase
        .from('agent_status_log')
        .insert({
          agent_id: user.id,
          status: 'location_check_in',
          location_lat: location.lat,
          location_lng: location.lng,
          selfie_url: imageUrl,
          workspace_id: currentWorkspaceId,
        });

      if (error) throw error;

      setLastCheckIn(new Date());
      toast({
        title: 'Location Check-In Successful',
        description: 'Your location and photo have been recorded.',
      });
    } catch (error) {
      console.error('Error checking in location:', error);
      toast({
        title: 'Error',
        description: 'Failed to check in location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingIn(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [user, currentWorkspaceId, toast]);

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0 });
        return;
      }

      const timeoutId = setTimeout(() => {
        toast({
          title: 'Location Warning',
          description: 'Could not get exact location, proceeding with approximate data.',
        });
        resolve({ lat: 0, lng: 0 });
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          clearTimeout(timeoutId);
          toast({
            title: 'Location Warning',
            description: 'Could not get location, proceeding without coordinates.',
          });
          resolve({ lat: 0, lng: 0 });
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  const effectiveLoading = loading && !loadingOverride;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Check In Location
        </CardTitle>
        <CardDescription>
          Capture your current location with photo verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastCheckIn && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Check-In:</span>
            <Badge variant="secondary">
              {lastCheckIn.toLocaleString()}
            </Badge>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>Camera will open for photo verification</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Location will be captured automatically</span>
          </div>
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={effectiveLoading || isCheckingIn}
          className="w-full"
        >
          {isCheckingIn ? (
            <>
              <Clock className="h-4 w-4 animate-spin mr-2" />
              Checking In...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check In at Location
            </>
          )}
        </Button>

        <CameraCapture
          ref={cameraRef}
          onCapture={handleCameraCapture}
          mode="status"
          variant="inline"
        />
      </CardContent>
    </Card>
  );
};
