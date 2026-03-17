import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, MapPin, Camera } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { StockReportDialog } from "@/components/attendance/StockReportDialog";
import { EveningReportDialog } from "@/components/attendance/EveningReportDialog";
import { SeedingEveningReportDialog } from "@/components/attendance/SeedingEveningReportDialog";
import { InstoreClosingReportDialog } from "@/components/attendance/InstoreClosingReportDialog";
import { supabase } from "@/integrations/supabase/client";

export const RecordAttendanceForm = () => {
  const { user } = useAuth();
  const { currentStatus, loading, updateStatus } = useAgentStatus();
  const { currentTeamType } = useWorkspace();
  const { toast } = useToast();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'checked_in' | 'lunch' | 'checked_out' | null>(null);
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [showStockReport, setShowStockReport] = useState(false);
  const [stockReportType, setStockReportType] = useState<'morning' | 'evening'>('morning');
  const [showEveningReport, setShowEveningReport] = useState(false);
  const [showSeedingEveningReport, setShowSeedingEveningReport] = useState(false);
  const [showInstoreClosingReport, setShowInstoreClosingReport] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  // Ref-based guard to prevent duplicate calls (survives re-renders and is synchronous)
  const isProcessingRef = useRef(false);

  // Loading timeout fallback - if loading takes too long, allow user to proceed
  useEffect(() => {
    if (loading && !loadingOverride) {
      const timeoutId = setTimeout(() => {
        console.log('Loading timeout - enabling button override');
        setLoadingOverride(true);
      }, 10000); // 10 second fallback
      return () => clearTimeout(timeoutId);
    }
  }, [loading, loadingOverride]);

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

        // Check if we need to show stock report dialog for wholesale team_type
        const isWholesale = currentTeamType?.toLowerCase() === 'wholesale';
        const isSeeding = currentTeamType?.toLowerCase() === 'seeding';
        
        if (isWholesale) {
          // Show stock report after check-in (morning) or evening report after check-out
          if (statusToSet === 'checked_in' && previousStatus === 'checked_out') {
            // Morning check-in - show stock report
            setStockReportType('morning');
            setShowStockReport(true);
          } else if (statusToSet === 'checked_out') {
            // Evening check-out - show evening report (sales summary + notes)
            setShowEveningReport(true);
          }
        } else if (isSeeding && statusToSet === 'checked_out') {
          // Seeding check-out - show seeding evening report (sales + notes + photos)
          setShowSeedingEveningReport(true);
        } else if (currentTeamType?.toLowerCase() === 'instore' && statusToSet === 'checked_out') {
          // Instore check-out - show closing stock report
          setShowInstoreClosingReport(true);
        }
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
  }, [user, pendingStatus, currentStatus, updateStatus, toast, currentTeamType]);

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback to 0,0 if geolocation not supported rather than blocking
        console.warn('Geolocation not supported, using fallback');
        resolve({ lat: 0, lng: 0 });
        return;
      }

      const timeoutId = setTimeout(() => {
        // On timeout, resolve with fallback coordinates instead of rejecting
        console.warn('Location request timed out, using fallback');
        toast({
          title: 'Location Warning',
          description: 'Could not get exact location, proceeding with approximate data.',
          variant: 'default',
        });
        resolve({ lat: 0, lng: 0 });
      }, 10000); // Reduced to 10 seconds

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
          console.warn('Location error:', error.message);
          // Resolve with fallback instead of rejecting to allow check-in to proceed
          toast({
            title: 'Location Warning',
            description: 'Could not get location, proceeding without coordinates.',
            variant: 'default',
          });
          resolve({ lat: 0, lng: 0 });
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 } // Lower accuracy, longer cache
      );
    });
  };

  // Effective loading state considers both actual loading and override
  const effectiveLoading = loading && !loadingOverride;

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
            disabled={effectiveLoading || isCheckingIn}
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
            disabled={effectiveLoading || isCheckingIn}
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

      {/* Stock Report Dialog for Wholesale (Morning only) */}
      <StockReportDialog
        open={showStockReport}
        onOpenChange={setShowStockReport}
        reportType={stockReportType}
        onComplete={() => {
          console.log('Stock report completed');
        }}
      />

      {/* Evening Report Dialog for Wholesale */}
      <EveningReportDialog
        open={showEveningReport}
        onOpenChange={setShowEveningReport}
        onComplete={() => {
          console.log('Evening report completed');
        }}
      />

      {/* Seeding Evening Report Dialog */}
      <SeedingEveningReportDialog
        open={showSeedingEveningReport}
        onOpenChange={setShowSeedingEveningReport}
        onComplete={() => {
          console.log('Seeding evening report completed');
        }}
      />
      {/* Instore Closing Report Dialog */}
      <InstoreClosingReportDialog
        open={showInstoreClosingReport}
        onOpenChange={setShowInstoreClosingReport}
        onComplete={() => {
          console.log('Instore closing report completed');
        }}
      />
    </Card>
  );
};
