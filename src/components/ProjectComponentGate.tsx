// [CMP-26ea03] ProjectComponentGate — route guard keyed on CRM-XXXX component codes
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
 *
 * While workspace/component flags are still loading, renders a branded
 * spinner instead of returning `null` (which previously caused a blank
 * white screen on `/reports` and other gated routes).
 */
export const ProjectComponentGate = ({
  code,
  redirectTo = "/",
  children,
}: ProjectComponentGateProps) => {
  const { isInitialized } = useWorkspace();
  const { isEnabled, isLoaded } = useProjectComponents();

  if (!isInitialized || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isEnabled(code)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
