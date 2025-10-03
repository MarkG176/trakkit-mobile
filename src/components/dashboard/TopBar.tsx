import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface TopBarProps {
  onCameraCapture?: (imageData: string) => void;
}

export const TopBar = ({ onCameraCapture }: TopBarProps) => {
  const { user } = useAuth();
  const { currentStatus, loading, updateStatus } = useAgentStatus();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState<string>("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching display name:', error);
          setDisplayName(user.email?.split('@')[0] || 'User');
        } else {
          setDisplayName(data?.display_name || user.email?.split('@')[0] || 'User');
        }
      } catch (error) {
        console.error('Error:', error);
        setDisplayName(user.email?.split('@')[0] || 'User');
      }
    };

    fetchDisplayName();
  }, [user]);

  const handleCheckIn = async () => {
    if (!user || isCheckingIn) return;

    setIsCheckingIn(true);
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Determine next status based on current status
      let nextStatus = currentStatus;
      if (currentStatus === 'checked_out') {
        nextStatus = 'checked_in';
      } else if (currentStatus === 'checked_in') {
        nextStatus = 'lunch';
      } else if (currentStatus === 'lunch') {
        nextStatus = 'checked_in';
      }

      // Update status without selfie for TopBar check-in
      const result = await updateStatus(nextStatus, null, location.lat, location.lng);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
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

  const getButtonText = () => {
    switch (currentStatus) {
      case 'checked_out':
        return 'Check In';
      case 'checked_in':
        return 'Go to Lunch';
      case 'lunch':
        return 'Back from Lunch';
      default:
        return 'Check In';
    }
  };

  const getButtonVariant = () => {
    switch (currentStatus) {
      case 'checked_out':
        return 'default';
      case 'checked_in':
        return 'secondary';
      case 'lunch':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-h3">Hello, {displayName}!</span>
        </div>
        
        <Button 
          onClick={handleCheckIn}
          disabled={loading || isCheckingIn}
          variant={getButtonVariant()}
          size="sm"
          className="flex items-center gap-2"
        >
          {isCheckingIn ? (
            <Clock size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};