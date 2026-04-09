import { useState } from "react";
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
import { Globe, Users, HelpCircle, BookOpen, ExternalLink } from "lucide-react";

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

interface ComponentInfo {
  name: string;
  description: string;
}

const instoreComponents: ComponentInfo[] = [
  { name: "Record Attendance", description: "Check in and out by taking a selfie" },
  { name: "Set Location", description: "Select which store you're at today" },
  { name: "Routes", description: "View and search your assigned stores" },
  { name: "Reports", description: "Log customer feedback and competitor activity" },
  { name: "Work Hours", description: "Track your daily work time" },
];

const defaultComponents: ComponentInfo[] = [
  { name: "Record Attendance", description: "Check in and out by taking a selfie" },
  { name: "Set Location", description: "Select which store you're at today" },
  { name: "Routes", description: "View and search your assigned locations" },
  { name: "Work Hours", description: "Track your daily work time" },
];

function getComponentsForTeamType(teamType: string): ComponentInfo[] {
  switch (teamType?.toLowerCase()) {
    case "instore":
      return instoreComponents;
    default:
      return defaultComponents;
  }
}

interface WorkspaceOnboardingProps {
  workspaceId: string | null;
  workspaceName?: string;
}

export const WorkspaceOnboarding = ({ workspaceId, workspaceName }: WorkspaceOnboardingProps) => {
  const { currentTeamType } = useWorkspace();
  const { setLanguage } = useLanguage();

  const onboardKey = workspaceId ? `onboarded_${workspaceId}` : null;
  const alreadyOnboarded = onboardKey ? !!localStorage.getItem(onboardKey) : true;

  const [open, setOpen] = useState(!alreadyOnboarded);
  const [step, setStep] = useState(0);

  if (!workspaceId || alreadyOnboarded) return null;

  const teamDisplayName = teamTypeDisplayNames[currentTeamType?.toLowerCase() ?? "hybrid"] || "Hybrid";
  const components = getComponentsForTeamType(currentTeamType);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setStep(1);
  };

  const handleComplete = () => {
    if (onboardKey) localStorage.setItem(onboardKey, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
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
              <Button onClick={() => handleLanguageSelect("en")} variant="outline" className="h-12 text-base">
                🇬🇧 English
              </Button>
              <Button onClick={() => handleLanguageSelect("sw")} variant="outline" className="h-12 text-base">
                🇰🇪 Kiswahili
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <DialogTitle className="text-center">Your Team</DialogTitle>
            </DialogHeader>
            <p className="text-center text-muted-foreground mt-2">
              You're part of the <span className="font-semibold text-foreground">{workspaceName || "your"}</span> team
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
              <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                No
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Yes
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <DialogTitle className="text-center">Quick Guide</DialogTitle>
              <DialogDescription className="text-center">
                Here's what you can do in the app
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              {components.map((comp) => (
                <div key={comp.name} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{comp.name}</p>
                    <p className="text-xs text-muted-foreground">{comp.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary mt-4 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View full docs
            </a>
            <Button onClick={handleComplete} className="w-full mt-4">
              Get Started
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
