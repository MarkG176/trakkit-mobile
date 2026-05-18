// [CMP-f4a7d8] TourOverlay — tour overlay component
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, X } from "lucide-react";

interface TourStep {
  path: string;
  title: string;
  description: string;
}

const instoreTourSteps: TourStep[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    description: "This is your home base. Check in by taking a selfie and track your work hours here.",
  },
  {
    path: "/reports",
    title: "Reports",
    description: "Log customer feedback and competitor activity here.",
  },
  {
    path: "/profile",
    title: "Help & FAQ",
    description: "Tap the help icon on your Profile page for guides and FAQs about your team type.",
  },
  {
    path: "/dashboard",
    title: "You're all set! 🎉",
    description: "Head back and check in to start your day.",
  },
];

export const TourOverlay = () => {
  const { currentWorkspaceId, currentTeamType } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [tourStep, setTourStep] = useState<number | null>(null);

  const isInstore = currentTeamType?.toLowerCase() === "instore";
  const tourKey = currentWorkspaceId ? `tour_active_${currentWorkspaceId}` : null;

  const checkTour = useCallback(() => {
    if (!tourKey || !isInstore) {
      setTourStep(null);
      return;
    }
    const stored = localStorage.getItem(tourKey);
    if (stored !== null) {
      setTourStep(parseInt(stored, 10));
    } else {
      setTourStep(null);
    }
  }, [tourKey, isInstore]);

  useEffect(() => {
    checkTour();
    const handler = () => checkTour();
    window.addEventListener("tour-started", handler);
    return () => window.removeEventListener("tour-started", handler);
  }, [checkTour]);

  // Navigate to the correct page for the current step
  useEffect(() => {
    if (tourStep === null || !tourKey) return;
    const step = instoreTourSteps[tourStep];
    if (!step) return;
    if (location.pathname !== step.path) {
      navigate(step.path);
    }
  }, [tourStep, tourKey, navigate, location.pathname]);

  const handleNext = () => {
    if (tourStep === null || !tourKey) return;
    const nextStep = tourStep + 1;
    if (nextStep >= instoreTourSteps.length) {
      // Tour complete
      localStorage.removeItem(tourKey);
      setTourStep(null);
      navigate("/dashboard");
    } else {
      localStorage.setItem(tourKey, String(nextStep));
      setTourStep(nextStep);
    }
  };

  const handleSkip = () => {
    if (tourKey) localStorage.removeItem(tourKey);
    setTourStep(null);
    navigate("/dashboard");
  };

  if (tourStep === null) return null;

  const step = instoreTourSteps[tourStep];
  if (!step) return null;

  const isLastStep = tourStep === instoreTourSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" />

      {/* Tour card */}
      <div className="absolute bottom-24 left-4 right-4 pointer-events-auto">
        <Card className="shadow-lg border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Step {tourStep + 1} of {instoreTourSteps.length}
                </p>
                <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleSkip}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
            <div className="flex gap-2">
              <Button onClick={handleSkip} variant="ghost" size="sm" className="text-muted-foreground">
                Skip
              </Button>
              <Button onClick={handleNext} size="sm" className="flex-1">
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
