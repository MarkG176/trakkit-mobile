// [CMP-6cd9f2] PermissionRequestDialog — permission request dialog component
import React, { useState } from 'react';
import { AlertCircle, Camera, MapPin, HardDrive, Mic, Bell, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermissionType, PermissionStatus, BrowserType } from '@/utils/permissionUtils';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss: (hours?: number) => void;
}

const permissionIcons: Record<PermissionType, React.ReactNode> = {
  camera: <Camera className="h-5 w-5" />,
  location: <MapPin className="h-5 w-5" />,
  storage: <HardDrive className="h-5 w-5" />,
  microphone: <Mic className="h-5 w-5" />,
  notification: <Bell className="h-5 w-5" />,
};

const permissionTitles: Record<PermissionType, string> = {
  camera: 'Camera',
  location: 'Location',
  storage: 'Storage',
  microphone: 'Microphone',
  notification: 'Notifications',
};

const permissionDescriptions: Record<PermissionType, string> = {
  camera: 'For check-in selfies and photo captures',
  location: 'For work location tracking and distance validation',
  storage: 'For offline data and app caching',
  microphone: 'For audio recording and voice features',
  notification: 'For important alerts and reminders',
};

const getStatusBadge = (status: PermissionStatus) => {
  switch (status) {
    case 'granted':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">✓ Granted</Badge>;
    case 'denied':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">✗ Denied</Badge>;
    case 'prompt':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">? Need to ask</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>;
  }
};

export const PermissionRequestDialog: React.FC<PermissionRequestDialogProps> = ({
  isOpen,
  onClose,
  onDismiss,
}) => {
  const { permissions, requestPermission, requestAllPermissions, dismissPermissionPrompt } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [requestingType, setRequestingType] = useState<PermissionType | null>(null);

  const types: PermissionType[] = ['camera', 'location', 'storage', 'microphone', 'notification'];

  const handleRequestAll = async () => {
    setLoading(true);
    try {
      await requestAllPermissions();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSingle = async (type: PermissionType) => {
    setRequestingType(type);
    try {
      await requestPermission(type);
    } finally {
      setRequestingType(null);
    }
  };

  const handleDismiss = () => {
    types.forEach(type => {
      dismissPermissionPrompt(type, 24);
    });
    onDismiss(24);
  };

  const allGranted = permissions && types.every(type => permissions[type]?.status === 'granted');

  if (allGranted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <DialogTitle>Permissions Required</DialogTitle>
          </div>
          <DialogDescription>
            TraKKiT needs these permissions to work properly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {types.map(type => {
            const status = permissions?.[type]?.status || 'unknown';
            const isGranted = status === 'granted';

            return (
              <Card
                key={type}
                className={`${isGranted ? 'opacity-60 bg-gray-50' : ''}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-gray-600 mt-0.5">{permissionIcons[type]}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{permissionTitles[type]}</h4>
                        <p className="text-xs text-gray-600">{permissionDescriptions[type]}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(status)}
                    </div>
                  </div>

                  {!isGranted && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs"
                      onClick={() => handleRequestSingle(type)}
                      disabled={loading || requestingType !== null}
                    >
                      {requestingType === type ? (
                        <>
                          <Loader className="h-3 w-3 mr-1 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        'Request'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDismiss}
            disabled={loading}
          >
            Ask Later
          </Button>
          <Button
            className="flex-1"
            onClick={handleRequestAll}
            disabled={loading || allGranted}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Requesting...
              </>
            ) : (
              'Request All'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
