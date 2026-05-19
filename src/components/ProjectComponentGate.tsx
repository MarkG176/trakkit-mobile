// [CMP-26ea03] ProjectComponentGate — route guard keyed on CRM-XXXX component codes
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";
import { BottomNavigation } from "@/components/BottomNavigation";
import { workspaceService } from "@/services/workspaceService";
import { mergeWithDefaults } from "@/data/mobileComponentsCatalog";

interface ProjectComponentGateProps {
  /** CRM-XXXX code from mobileComponentsCatalog. */
  code: string;
  redirectTo?: string;
  children: ReactNode;
}

const NAV_PAGE_BY_PATH: Record<string, string> = {
  "/reports": "reports",
  "/surveys": "surveys",
  "/routes": "routes",
  "/inventory": "inventory",
  "/support-ticket": "chat",
  "/profile": "profile",
};

function GateLoadingShell({ currentPage }: { currentPage: string }) {
  return (
    <div className="min-h-[100dvh] min-h-screen bg-background">
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <BottomNavigation currentPage={currentPage} />
    </div>
  );
}

/**
 * Route guard that blocks access to a page if the active workspace has
 * the matching CRM component code disabled in `active_components`.
 *
 * While workspace/component flags are still loading, renders a branded
 * spinner inside the mobile shell (with bottom nav) instead of a blank
 * full-screen state — especially important on Android Chrome / mobile browsers.
 */
export const ProjectComponentGate = ({
  code,
  redirectTo = "/",
  children,
}: ProjectComponentGateProps) => {
  const { isInitialized } = useWorkspace();
  const { isEnabled, isLoaded } = useProjectComponents();
  const location = useLocation();
  const currentPage = NAV_PAGE_BY_PATH[location.pathname] ?? "dashboard";

  // React context can lag behind workspaceService on Android Chrome; trust the service when ready.
  const workspaceReady = isInitialized || workspaceService.isInitialized();
  const componentsReady = isLoaded || workspaceService.isInitialized();

  const componentEnabled = componentsReady
    ? isEnabled(code)
    : (mergeWithDefaults(workspaceService.getCurrentActiveComponents())[code] ?? true);

  if (!workspaceReady || !componentsReady) {
    return <GateLoadingShell currentPage={currentPage} />;
  }

  if (!componentEnabled) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
