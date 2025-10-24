import React, { useState, useRef } from "react";
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

  const handleStatusChange = async (newStatus: 'checked_in' | 'lunch' | 'checked_out') => {
    if (!user || isCheckingIn) return;

    // Check if user has set their location before checking in
    if (newStatus === 'checked_in' && (currentStatus === 'checked_out' || !currentStatus)) {
      const { data: locationCheck, error: locationError } = await supabase
        .from('agent_status_log')
        .select('id')
        .eq('agent_id', user.id)
        .eq('status', 'set_location')
        .order('created_at', { ascending: false })
        .limit(1);

      if (locationError || !locationCheck || locationCheck.length === 0) {
        toast({
          title: 'Set your location first',
          description: 'Please go to Routes & Planning to set your assigned location before checking in.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Set the pending status and trigger camera
    setPendingStatus(newStatus);
    cameraRef.current?.click();
  };

  const handleCameraCapture = async (imageData: string) => {
    if (!user || !pendingStatus) return;

    setIsCheckingIn(true);
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Update status with the captured image
      const result = await updateStatus(pendingStatus, imageData, location.lat, location.lng);
      
      if (result.success) {
        // Custom success messages for lunch breaks
        let successMessage = result.message;
        if (pendingStatus === 'lunch') {
          successMessage = 'Successfully started lunch break';
        } else if (currentStatus === 'lunch' && pendingStatus === 'checked_in') {
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
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true }
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
