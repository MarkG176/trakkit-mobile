import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents, ProjectComponentFlags } from "@/hooks/useProjectComponents";

interface ProjectComponentGateProps {
  component: keyof ProjectComponentFlags;
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Route guard that blocks access to a page if the active project has
 * the matching component disabled in `project_components`.
 */
export const ProjectComponentGate = ({
  component,
  redirectTo = "/",
  children,
}: ProjectComponentGateProps) => {
  const { currentProjectId, isInitialized } = useWorkspace();
  const { flags, isLoaded } = useProjectComponents(currentProjectId);

  // Wait for both workspace + components to load before deciding
  if (!isInitialized || !isLoaded) {
    return null;
  }

  if (!flags[component]) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
