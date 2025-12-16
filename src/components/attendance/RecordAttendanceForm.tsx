import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, MapPin, Camera } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { supabase } from "@/integrations/supabase/client";

export const RecordAttendanceForm = () => {
  const { user } = useAuth();
  const { currentStatus, loading, updateStatus } = useAgentStatus();
  const { toast } = useToast();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'checked_in' | 'lunch' | 'checked_out' | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  // Ref-based guard to prevent duplicate calls (survives re-renders and is synchronous)
  const isProcessingRef = useRef(false);

  const handleStatusChange = useCallback(async (newStatus: 'checked_in' | 'lunch' | 'checked_out') => {
    // Synchronous check using ref to prevent race conditions
    if (!user || isCheckingIn || isProcessingRef.current) {
      console.log('Status change blocked - already processing or not authenticated');
      return;
    }

    // Set the pending status and trigger camera
    setPendingStatus(newStatus);
    cameraRef.current?.click();
  }, [user, isCheckingIn]);

  const handleCameraCapture = useCallback(async (imageData: string) => {
    // Double-check with ref to prevent duplicate processing
    if (!user || !pendingStatus || isProcessingRef.current) {
      console.log('Camera capture blocked - missing data or already processing');
      return;
    }

    // Set ref immediately to prevent any concurrent calls
    isProcessingRef.current = true;
    setIsCheckingIn(true);
    
    // Store the status we're setting to prevent issues if pendingStatus changes
    const statusToSet = pendingStatus;
    const previousStatus = currentStatus;
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Update status with the captured image
      const result = await updateStatus(statusToSet, imageData, location.lat, location.lng);
      
      if (result.success) {
        // Custom success messages for lunch breaks
        let successMessage = result.message;
        if (statusToSet === 'lunch') {
          successMessage = 'Successfully started lunch break';
        } else if (previousStatus === 'lunch' && statusToSet === 'checked_in') {
          successMessage = 'Successfully finished lunch break';
        }
        
        toast({
          title: 'Success',
          description: successMessage,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingIn(false);
      setPendingStatus(null);
      // Add a small delay before allowing next action to prevent rapid re-triggering on budget devices
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [user, pendingStatus, currentStatus, updateStatus, toast]);

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out. Please try again.'));
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'checked_in':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Checked In</Badge>;
      case 'lunch':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">On Lunch</Badge>;
      case 'checked_out':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Checked Out</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getNextAction = () => {
    switch (currentStatus) {
      case 'checked_out':
        return {
          action: 'Check In',
          status: 'checked_in' as const,
          variant: 'default' as const,
          icon: CheckCircle
        };
      case 'checked_in':
        return {
          action: 'Go to Lunch',
          status: 'lunch' as const,
          variant: 'secondary' as const,
          icon: Clock
        };
      case 'lunch':
        return {
          action: 'Back from Lunch',
          status: 'checked_in' as const,
          variant: 'outline' as const,
          icon: CheckCircle
        };
      default:
        return {
          action: 'Check In',
          status: 'checked_in' as const,
          variant: 'default' as const,
          icon: CheckCircle
        };
    }
  };

  const nextAction = getNextAction();
  const ActionIcon = nextAction.icon;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Record Attendance
        </CardTitle>
        <CardDescription>
          Update your current status and location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Status:</span>
          {getStatusBadge()}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="h-4 w-4" />
            <span>Camera will open automatically for selfie verification</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Location will be captured automatically</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => handleStatusChange(nextAction.status)}
            disabled={loading || isCheckingIn}
            variant={nextAction.variant}
            className="flex-1"
          >
            {isCheckingIn ? (
              <Clock className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ActionIcon className="h-4 w-4 mr-2" />
            )}
            {nextAction.action}
          </Button>
        </div>

        {currentStatus === 'checked_in' && (
          <Button 
            onClick={() => handleStatusChange('checked_out')}
            disabled={loading || isCheckingIn}
            variant="destructive"
            className="w-full"
          >
            Check Out
          </Button>
        )}
      </CardContent>

      <CameraCapture 
        ref={cameraRef}
        onCapture={handleCameraCapture}
        mode="status"
        variant="inline"
      />
    </Card>
  );
};
