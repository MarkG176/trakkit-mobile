// [CMP-99a88d] PermissionRequestProvider — permission request provider component
import React, { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PermissionRequestDialog } from './PermissionRequestDialog';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionRequestProviderProps {
  children: ReactNode;
}

/**
 * Provider that manages permission request prompts
 * Shows permission dialog after user authenticates on first app load
 */
export const PermissionRequestProvider: React.FC<PermissionRequestProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { permissions, dismissPermissionPrompt, isPermissionDismissed } = usePermissions();
  
  const [showDialog, setShowDialog] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only show dialog after user is authenticated
    if (!user || hasInitialized) return;

    // Check if permissions dialog was already dismissed for the session
    const types: ('camera' | 'location' | 'storage' | 'microphone' | 'notification')[] = [
      'camera',
      'location',
      'storage',
      'microphone',
      'notification',
    ];

    // If all permissions are dismissed, don't show the dialog
    const allDismissed = types.every(type => isPermissionDismissed(type));
    if (!allDismissed && permissions) {
      setShowDialog(true);
    }

    setHasInitialized(true);
  }, [user, hasInitialized, permissions, isPermissionDismissed]);

  const handleDismiss = (hours?: number) => {
    setShowDialog(false);
    // Dialog won't reappear until the dismissal period expires
  };

  return (
    <>
      <PermissionRequestDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onDismiss={handleDismiss}
      />
      {children}
    </>
  );
};
