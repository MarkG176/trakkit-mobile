import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
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
  const { user } = useAuth();

  const { data: projectType, isLoading, error } = useQuery({
    queryKey: ['project-type', user?.id],
    queryFn: async (): Promise<ProjectType> => {
      if (!user?.id) {
        return DEFAULT_PROJECT_TYPE;
      }

      // Query 1: Get agent's team and its project_id
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id, teams(project_id)')
        .eq('agent_id', user.id)
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();

      const projectId = (teamMember?.teams as { project_id: string } | null)?.project_id;

      if (!projectId) {
        return DEFAULT_PROJECT_TYPE;
      }

      // Query 2: Get project_type from project_plans
      const { data: project } = await supabase
        .from('project_plans')
        .select('project_type')
        .eq('id', projectId)
        .maybeSingle();

      if (project?.project_type) {
        return project.project_type as ProjectType;
      }

      return DEFAULT_PROJECT_TYPE;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
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
