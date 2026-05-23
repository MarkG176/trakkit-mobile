// [CMP-eb753a] WorkspaceOnboarding — workspace onboarding component
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage, Language } from "@/hooks/useLanguage";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Users, HelpCircle } from "lucide-react";

const DOCS_URL = "https://trakkit.darajatech.com/docs";

const teamTypeDisplayNames: Record<string, string> = {
  sales_activation: "Sales Activation",
  survey_campaign: "Survey Campaign",
  brand_activation: "Brand Activation",
  door_to_door: "Door to Door",
  sampling: "Sampling",
  instore: "Instore",
  wholesale: "Wholesale",
  seeding: "Seeding",
  hybrid: "Hybrid",
  market_research: "Market Research",
};

interface WorkspaceOnboardingProps {
  workspaceId: string | null;
  workspaceName?: string;
}

export const WorkspaceOnboarding = ({ workspaceId, workspaceName }: WorkspaceOnboardingProps) => {
  const { currentWorkspaceLabel } = useWorkspace();
  const { user } = useAuth();
  const { setLanguage } = useLanguage();

  const normalizedLabel = currentWorkspaceLabel?.toLowerCase() || null;
  const isInstore = normalizedLabel === "instore";

  const [teamName, setTeamName] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || !user?.id) {
      setTeamName(null);
      return;
    }

    let cancelled = false;

    const loadTeamName = async () => {
      const { data } = await supabase
        .from("team_members")
        .select("team_id, teams:team_id(name)")
        .eq("agent_id", user.id)
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      setTeamName((data?.teams as { name?: string } | null)?.name ?? null);
    };

    loadTeamName();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, user?.id]);

  const onboardKey = workspaceId ? `onboarded_${workspaceId}` : null;
  const alreadyOnboarded = onboardKey ? !!localStorage.getItem(onboardKey) : true;

  const shouldShow = !alreadyOnboarded && isInstore;
  const [open, setOpen] = useState(false);
  // Language selection is disabled for now but code is retained
  // Start at step 1 (team name) instead of step 0 (language)
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (shouldShow) {
      setOpen(true);
    }
  }, [shouldShow]);

  if (!workspaceId || alreadyOnboarded || !isInstore) return null;

  const teamDisplayName = teamTypeDisplayNames[normalizedLabel ?? "hybrid"] || "Hybrid";

  // Disabled: Language selection handler (retained for future use)
  const _handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setStep(1);
  };

  const handleStartTour = () => {
    if (onboardKey) localStorage.setItem(onboardKey, "true");
    // Set tour active state for TourOverlay to pick up
    if (workspaceId) localStorage.setItem(`tour_active_${workspaceId}`, "0");
    setOpen(false);
    // Force re-render of TourOverlay by dispatching a storage event
    window.dispatchEvent(new Event("tour-started"));
  };

  const handleSkipTour = () => {
    if (onboardKey) localStorage.setItem(onboardKey, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Step 0: Language Selection (DISABLED) */}
        {/* 
        {step === 0 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <Globe className="w-10 h-10 text-primary" />
              </div>
              <DialogTitle className="text-center">Choose your language</DialogTitle>
              <DialogDescription className="text-center">
                Chagua lugha yako
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-4">
              <Button onClick={() => _handleLanguageSelect("en")} variant="outline" className="h-12 text-base">
                🇬🇧 English
              </Button>
              <Button onClick={() => _handleLanguageSelect("sw")} variant="outline" className="h-12 text-base">
                🇰🇪 Kiswahili
              </Button>
            </div>
          </>
        )}
        */}

        {step === 1 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <DialogTitle className="text-center">Your Team</DialogTitle>
            </DialogHeader>
            <p className="text-center text-muted-foreground mt-2">
              You're part of the{" "}
              <span className="font-semibold text-foreground">
                {teamName || workspaceName || "your"}
              </span>{" "}
              team
            </p>
            <Button onClick={() => setStep(2)} className="w-full mt-6">
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <HelpCircle className="w-10 h-10 text-primary" />
              </div>
              <DialogTitle className="text-center">Experience</DialogTitle>
            </DialogHeader>
            <p className="text-center text-muted-foreground mt-2">
              Have you used TraKKiT for <span className="font-semibold text-foreground">{teamDisplayName}</span> projects before?
            </p>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleStartTour} variant="outline" className="flex-1">
                No
              </Button>
              <Button onClick={handleStartTour} className="flex-1">
                Yes
              </Button>
            </div>
            <Button onClick={handleSkipTour} variant="ghost" className="w-full mt-2 text-xs text-muted-foreground">
              Skip
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
