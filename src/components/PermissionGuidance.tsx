import React from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionType, BrowserType } from '@/utils/permissionUtils';
import { useState } from 'react';

interface PermissionGuidanceProps {
  permissionType: PermissionType;
  browserType: BrowserType;
  onRetry?: () => void;
  className?: string;
}

const permissionDescriptions: Record<PermissionType, string> = {
  camera: 'Camera access is needed for check-in selfies and photo captures.',
  location: 'Location access is needed for tracking your work location and distance validation.',
  microphone: 'Microphone access is needed for audio recording and voice features.',
  storage: 'Storage access is needed for offline data and app caching.',
  notification: 'Notification access is needed to receive important alerts and reminders.',
};

const getBrowserInstructions = (type: PermissionType, browser: BrowserType): string[] => {
  if (browser === 'ios') {
    return getIOSInstructions(type);
  } else if (browser === 'samsung') {
    return getSamsungInstructions(type);
  } else {
    return getAndroidChromeInstructions(type);
  }
};

const getIOSInstructions = (type: PermissionType): string[] => {
  switch (type) {
    case 'camera':
      return [
        'Open Settings app',
        'Scroll down and tap "Safari"',
        'Tap "Camera"',
        'Select "Allow"',
      ];
    case 'location':
      return [
        'Open Settings app',
        'Scroll down and tap "Safari"',
        'Tap "Location"',
        'Select "Allow"',
      ];
    case 'microphone':
      return [
        'Open Settings app',
        'Scroll down and tap "Safari"',
        'Tap "Microphone"',
        'Select "Allow"',
      ];
    case 'notification':
      return [
        'Open Settings app',
        'Tap "Notifications"',
        'Find Safari in the list',
        'Turn on "Allow Notifications"',
      ];
    case 'storage':
      return [
        'Open Settings app',
        'Tap "Safari"',
        'Tap "Advanced" → "Website Data"',
        'Storage is managed automatically on iOS',
      ];
    default:
      return [];
  }
};

const getSamsungInstructions = (type: PermissionType): string[] => {
  switch (type) {
    case 'camera':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy"',
        'Tap "Permissions"',
        'Select "Camera" and set to "Allow"',
      ];
    case 'location':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy"',
        'Tap "Permissions"',
        'Select "Location" and set to "Allow"',
      ];
    case 'microphone':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy"',
        'Tap "Permissions"',
        'Select "Microphone" and set to "Allow"',
      ];
    case 'notification':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Notifications"',
        'Enable notifications',
      ];
    case 'storage':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy and security"',
        'Select "Site settings" → "Storage"',
        'Enable "Use Local Storage"',
      ];
    default:
      return [];
  }
};

const getAndroidChromeInstructions = (type: PermissionType): string[] => {
  switch (type) {
    case 'camera':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy and security"',
        'Tap "Permissions" → "Camera"',
        'Select "Allow"',
      ];
    case 'location':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy and security"',
        'Tap "Permissions" → "Location"',
        'Select "Allow"',
      ];
    case 'microphone':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy and security"',
        'Tap "Permissions" → "Microphone"',
        'Select "Allow"',
      ];
    case 'notification':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Notifications"',
        'Enable "Notifications"',
      ];
    case 'storage':
      return [
        'Tap the three-dot menu (⋮)',
        'Tap "Settings" → "Privacy and security"',
        'Tap "Cookies and other data"',
        'Enable "Allow all cookies"',
      ];
    default:
      return [];
  }
};

export const PermissionGuidance: React.FC<PermissionGuidanceProps> = ({
  permissionType,
  browserType,
  onRetry,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const instructions = getBrowserInstructions(permissionType, browserType);

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="p-4">
        <div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 text-sm mb-1 capitalize">
                {permissionType} Permission Denied
              </h3>
              <p className="text-xs text-red-700 mb-2">{permissionDescriptions[permissionType]}</p>
              {isExpanded && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-red-900">To re-enable:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {instructions.map((step, index) => (
                      <li key={index} className="text-xs text-red-700">
                        {step}
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-red-600 mt-2 italic">
                    After enabling, refresh this page or restart the app.
                  </p>
                </div>
              )}
            </div>
          </div>
          <button className="flex-shrink-0 ml-2 p-1">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-red-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-red-600" />
            )}
          </button>
        </div>

        {isExpanded && onRetry && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full text-xs"
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
