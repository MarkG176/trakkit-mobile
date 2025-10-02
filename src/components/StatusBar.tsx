import * as React from 'react';
import { Clock, CheckCircle, XCircle, Coffee } from 'lucide-react';
import { AgentStatus } from '@/hooks/useAgentStatus';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StatusBarProps {
  status: AgentStatus;
  loading: boolean;
}

export const StatusBar = ({ status, loading }: StatusBarProps) => {
  const { user } = useAuth();
  const { updateStatus } = useAgentStatus();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case 'checked_in':
        return {
          icon: CheckCircle,
          label: 'Checked In',
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
        };
      case 'lunch':
        return {
          icon: Coffee,
          label: 'On Lunch',
          variant: 'secondary' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600',
        };
      case 'checked_out':
      default:
        return {
          icon: XCircle,
          label: 'Checked Out',
          variant: 'outline' as const,
          className: 'bg-gray-500 hover:bg-gray-600',
        };
    }
  };

  const handleStatusChange = async (newStatus: AgentStatus) => {
    if (!user || isUpdating) return;

    setIsUpdating(true);
    
    try {
      // Get current location
      const location = await getCurrentLocation();
      
      // Update status without selfie for direct status changes
      const result = await updateStatus(newStatus, null, location.lat, location.lng);
      
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
      setIsUpdating(false);
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1">
        <Clock size={16} className="animate-pulse" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  const config = getStatusConfig();
  const Icon = config.icon;

  // Determine next status for cycle
  const getNextStatus = (): AgentStatus => {
    switch (status) {
      case 'checked_out':
        return 'checked_in';
      case 'checked_in':
        return 'lunch';
      case 'lunch':
        return 'checked_out';
      default:
        return 'checked_in';
    }
  };

  const nextStatus = getNextStatus();
  const nextStatusConfig = getStatusConfig();

  return (
    <Button 
      onClick={() => handleStatusChange(nextStatus)}
      variant="ghost" 
      className={`h-auto p-1 ${config.className} text-white hover:opacity-80`}
      disabled={isUpdating}
      title={`Click to change to: ${nextStatus.replace('_', ' ')}`}
    >
      <div className="flex items-center gap-1">
        {isUpdating ? (
          <Clock size={14} className="animate-spin" />
        ) : (
          <Icon size={14} />
        )}
        <span className="text-xs font-medium">{config.label}</span>
      </div>
    </Button>
  );
};
