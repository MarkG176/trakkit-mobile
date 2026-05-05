import { useState, useCallback, useEffect } from 'react';
import {
  PermissionType,
  PermissionStatus,
  PermissionStateMap,
  requestPermission,
  requestAllPermissions,
  getPermissionStatus,
  getAllPermissionStatuses,
  dismissPermissionPrompt,
  clearPermissionDismissal,
  isPermissionDismissed,
  getBrowserType,
  BrowserType,
} from '@/utils/permissionUtils';

interface UsePermissionsReturn {
  permissions: PermissionStateMap | null;
  loading: boolean;
  error: string | null;
  browserType: BrowserType;
  
  // Get single permission status
  getPermissionStatus: (type: PermissionType) => PermissionStatus | null;
  
  // Request permissions
  requestPermission: (type: PermissionType) => Promise<boolean>;
  requestAllPermissions: () => Promise<{ [key in PermissionType]: boolean }>;
  
  // Dismissal management
  dismissPermissionPrompt: (type: PermissionType, hours?: number) => void;
  clearPermissionDismissal: (type: PermissionType) => void;
  isPermissionDismissed: (type: PermissionType) => boolean;
  
  // Refresh permission states
  refreshPermissions: () => Promise<void>;
}

/**
 * Hook for managing browser permissions
 */
export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionStateMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const browserType = getBrowserType();

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const states = await getAllPermissionStatuses();
      setPermissions(states);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  const getPermissionStatusCallback = useCallback((type: PermissionType): PermissionStatus | null => {
    return permissions?.[type]?.status || null;
  }, [permissions]);

  const requestPermissionCallback = useCallback(async (type: PermissionType): Promise<boolean> => {
    try {
      const result = await requestPermission(type);
      // Refresh permissions after request
      await loadPermissions();
      return result;
    } catch (err) {
      console.error(`Error requesting ${type} permission:`, err);
      return false;
    }
  }, [loadPermissions]);

  const requestAllPermissionsCallback = useCallback(async () => {
    try {
      const results = await requestAllPermissions();
      // Refresh permissions after requests
      await loadPermissions();
      return results;
    } catch (err) {
      console.error('Error requesting permissions:', err);
      return {
        camera: false,
        location: false,
        storage: false,
        microphone: false,
        notification: false,
      };
    }
  }, [loadPermissions]);

  const dismissPromptCallback = useCallback((type: PermissionType, hours?: number) => {
    dismissPermissionPrompt(type, hours);
    // Note: don't reload permissions, just update state
  }, []);

  const clearDismissalCallback = useCallback((type: PermissionType) => {
    clearPermissionDismissal(type);
  }, []);

  const isDismissedCallback = useCallback((type: PermissionType): boolean => {
    return isPermissionDismissed(type);
  }, []);

  return {
    permissions,
    loading,
    error,
    browserType,
    getPermissionStatus: getPermissionStatusCallback,
    requestPermission: requestPermissionCallback,
    requestAllPermissions: requestAllPermissionsCallback,
    dismissPermissionPrompt: dismissPromptCallback,
    clearPermissionDismissal: clearDismissalCallback,
    isPermissionDismissed: isDismissedCallback,
    refreshPermissions: loadPermissions,
  };
};
