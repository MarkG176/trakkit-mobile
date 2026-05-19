// [CMP-26ea03] ProjectComponentGate — route guard keyed on CRM-XXXX component codes
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";

interface ProjectComponentGateProps {
  /** CRM-XXXX code from mobileComponentsCatalog. */
  code: string;
  redirectTo?: string;
  children: ReactNode;
}

/**
 * Route guard that blocks access to a page if the active workspace has
 * the matching CRM component code disabled in `active_components`.
 */
export const ProjectComponentGate = ({
  code,
  redirectTo = "/",
  children,
}: ProjectComponentGateProps) => {
  const { isInitialized } = useWorkspace();
  const { isEnabled, isLoaded } = useProjectComponents();

  if (!isInitialized || !isLoaded) {
    return null;
  }

  if (!isEnabled(code)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
