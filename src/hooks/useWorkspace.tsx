import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
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
  }, [user]);

  // Continuously monitor workspace changes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (workspaceService.isInitialized()) {
        const serviceWorkspaceId = workspaceService.getCurrentWorkspaceId();
        if (serviceWorkspaceId !== currentWorkspaceId) {
          updateWorkspaceState();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, currentWorkspaceId]);

  const updateWorkspaceState = () => {
    setCurrentWorkspaceId(workspaceService.getCurrentWorkspaceId());
    setCurrentProjectId(workspaceService.getCurrentProjectId());
    setCurrentWorkspaceLabel(workspaceService.getCurrentWorkspaceLabel());
    setCurrentProjectCountry(workspaceService.getCurrentProjectCountry());
    setUserWorkspaces(workspaceService.getUserWorkspaces());
    setCurrentWorkspaceRole(workspaceService.getCurrentWorkspaceRole());
    setIsInitialized(workspaceService.isInitialized());
  };

  const switchWorkspace = async (workspaceId: string): Promise<boolean> => {
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
  };

  const refreshWorkspaces = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await workspaceService.refresh();
      updateWorkspaceState();
    } catch (error) {
      console.error('Error refreshing workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspaceId,
      currentProjectId,
      currentWorkspaceLabel,
      currentProjectCountry,
      userWorkspaces,
      currentWorkspaceRole,
      isLoading,
      switchWorkspace,
      refreshWorkspaces,
      isInitialized
    }}>
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
