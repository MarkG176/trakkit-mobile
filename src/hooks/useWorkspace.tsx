import { useState, useEffect, useMemo, useCallback, createContext, useContext, ReactNode } from 'react';
import { workspaceService, UserWorkspace } from '@/services/workspaceService';
import { useAuth } from './useAuth';

interface WorkspaceContextType {
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  currentWorkspaceLabel: string | null;
  currentProjectCountry: string | null;
  userWorkspaces: UserWorkspace[];
  currentWorkspaceRole: 'admin' | 'member' | 'viewer' | null;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<boolean>;
  refreshWorkspaces: () => Promise<void>;
  isInitialized: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentWorkspaceLabel, setCurrentWorkspaceLabel] = useState<string | null>(null);
  const [currentProjectCountry, setCurrentProjectCountry] = useState<string | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspace[]>([]);
  const [currentWorkspaceRole, setCurrentWorkspaceRole] = useState<'admin' | 'member' | 'viewer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Pull the latest values from the service, only triggering React state
  // updates when a value actually changed (avoids needless re-renders).
  const updateWorkspaceState = useCallback(() => {
    const nextWorkspaceId = workspaceService.getCurrentWorkspaceId();
    const nextProjectId = workspaceService.getCurrentProjectId();
    const nextLabel = workspaceService.getCurrentWorkspaceLabel();
    const nextCountry = workspaceService.getCurrentProjectCountry();
    const nextWorkspaces = workspaceService.getUserWorkspaces();
    const nextRole = workspaceService.getCurrentWorkspaceRole();
    const nextInitialized = workspaceService.isInitialized();

    setCurrentWorkspaceId((prev) => (prev === nextWorkspaceId ? prev : nextWorkspaceId));
    setCurrentProjectId((prev) => (prev === nextProjectId ? prev : nextProjectId));
    setCurrentWorkspaceLabel((prev) => (prev === nextLabel ? prev : nextLabel));
    setCurrentProjectCountry((prev) => (prev === nextCountry ? prev : nextCountry));
    setUserWorkspaces((prev) => (prev === nextWorkspaces ? prev : nextWorkspaces));
    setCurrentWorkspaceRole((prev) => (prev === nextRole ? prev : nextRole));
    setIsInitialized((prev) => (prev === nextInitialized ? prev : nextInitialized));
  }, []);

  useEffect(() => {
    if (!user) {
      setIsInitialized(false);
      return;
    }

    let cancelled = false;

    const ensureInitialized = async () => {
      try {
        if (!workspaceService.isInitialized()) {
          await workspaceService.initialize(user);
        }
      } catch (error) {
        console.error('Workspace initialization failed:', error);
      } finally {
        // Sync when the effect is still active, or when the service finished
        // during a Strict Mode / fast-remount cancel (common on mobile Chrome).
        if (!cancelled || workspaceService.isInitialized()) {
          updateWorkspaceState();
          setIsInitialized(true);
        }
      }
    };

    ensureInitialized();

    return () => {
      cancelled = true;
    };
  }, [user, updateWorkspaceState]);

  // React to workspace changes via subscription instead of polling every second.
  useEffect(() => {
    if (!user) return;

    const unsubscribe = workspaceService.subscribe(() => {
      updateWorkspaceState();
    });

    return unsubscribe;
  }, [user, updateWorkspaceState]);

  const switchWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await workspaceService.setCurrentWorkspace(workspaceId);
      if (success) {
        updateWorkspaceState();
      }
      return success;
    } catch (error) {
      console.error('Error switching workspace:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateWorkspaceState]);

  const refreshWorkspaces = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await workspaceService.refresh();
      updateWorkspaceState();
    } catch (error) {
      console.error('Error refreshing workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateWorkspaceState]);

  const value = useMemo(
    () => ({
      currentWorkspaceId,
      currentProjectId,
      currentWorkspaceLabel,
      currentProjectCountry,
      userWorkspaces,
      currentWorkspaceRole,
      isLoading,
      switchWorkspace,
      refreshWorkspaces,
      isInitialized,
    }),
    [
      currentWorkspaceId,
      currentProjectId,
      currentWorkspaceLabel,
      currentProjectCountry,
      userWorkspaces,
      currentWorkspaceRole,
      isLoading,
      switchWorkspace,
      refreshWorkspaces,
      isInitialized,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
