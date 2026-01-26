import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { 
  ProjectType, 
  ProjectFeatureConfig, 
  PROJECT_TYPE_FEATURES, 
  DEFAULT_PROJECT_TYPE 
} from '@/config/projectTypes';

interface UseProjectConfigReturn {
  projectType: ProjectType;
  features: ProjectFeatureConfig;
  isLoading: boolean;
  error: Error | null;
}

export const useProjectConfig = (): UseProjectConfigReturn => {
  const { currentProjectId, currentWorkspaceId } = useWorkspace();

  const { data: projectType, isLoading, error } = useQuery({
    queryKey: ['project-type', currentProjectId, currentWorkspaceId],
    queryFn: async (): Promise<ProjectType> => {
      if (!currentProjectId && !currentWorkspaceId) {
        return DEFAULT_PROJECT_TYPE;
      }

      // Try to get project type from current project first
      if (currentProjectId) {
        const { data: project, error: projectError } = await supabase
          .from('project_plans')
          .select('project_type')
          .eq('id', currentProjectId)
          .maybeSingle();

        if (!projectError && project?.project_type) {
          return project.project_type as ProjectType;
        }
      }

      // Fallback: get the most recent active project for the workspace
      if (currentWorkspaceId) {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: activeProject, error: activeError } = await supabase
          .from('project_plans')
          .select('project_type')
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_deleted', false)
          .lte('start_date', today)
          .gte('end_date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!activeError && activeProject?.project_type) {
          return activeProject.project_type as ProjectType;
        }
      }

      return DEFAULT_PROJECT_TYPE;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  const resolvedProjectType = projectType ?? DEFAULT_PROJECT_TYPE;
  const features = PROJECT_TYPE_FEATURES[resolvedProjectType];

  return {
    projectType: resolvedProjectType,
    features,
    isLoading,
    error: error as Error | null,
  };
};
