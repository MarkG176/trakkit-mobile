import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { workspaceService, UserWorkspace } from '@/services/workspaceService';
import { useAuth } from './useAuth';
import { ProjectType, ProjectFeatureConfig, PROJECT_TYPE_FEATURES, DEFAULT_PROJECT_TYPE } from '@/config/projectTypes';

interface WorkspaceContextType {
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  userWorkspaces: UserWorkspace[];
  currentWorkspaceRole: 'admin' | 'member' | 'viewer' | null;
  currentTeamType: ProjectType;
  features: ProjectFeatureConfig;
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
  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspace[]>([]);
  const [currentWorkspaceRole, setCurrentWorkspaceRole] = useState<'admin' | 'member' | 'viewer' | null>(null);
  const [currentTeamType, setCurrentTeamType] = useState<ProjectType>(DEFAULT_PROJECT_TYPE);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Compute features based on current team type
  const features = PROJECT_TYPE_FEATURES[currentTeamType];

  useEffect(() => {
    if (user && workspaceService.isInitialized()) {
      updateWorkspaceState();
    }
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
    setUserWorkspaces(workspaceService.getUserWorkspaces());
    setCurrentWorkspaceRole(workspaceService.getCurrentWorkspaceRole());
    setCurrentTeamType(workspaceService.getCurrentTeamType() as ProjectType);
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
      userWorkspaces,
      currentWorkspaceRole,
      currentTeamType,
      features,
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
