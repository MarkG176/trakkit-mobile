import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

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
};

const teamTypeAnswers: Record<string, string> = {
  sales_activation: "Guide coming soon for Sales Activation activations.",
  survey_campaign: "Guide coming soon for Survey Campaign activations.",
  brand_activation: "Guide coming soon for Brand Activation activations.",
  door_to_door: "Guide coming soon for Door to Door activations.",
  sampling: "Guide coming soon for Sampling activations.",
  instore: "Guide coming soon for Instore activations.",
  wholesale: "Guide coming soon for Wholesale activations.",
  seeding: "First, check in on the Dashboard, using the Record Attendance form. Next, add stores that you visit on the Routes page using the Add Location form. Carry out all interactions with the store. At the end of the day, check out on the Dashboard.",
  hybrid: "Guide coming soon for Hybrid activations.",
};

const sharedFaqItems = [
  {
    question: "How to install?",
    answer:
      "Open this link: trakkit-mobile.lovable.app in Google Chrome. Wait for the install pop up to appear. Press the Install button. Once complete, TraKKiT will appear on your home screen.",
  },
  {
    question: "How do I check in?",
    answer:
      "Tap the Record Attendance button on the Dashboard. Allow location access when prompted and take a selfie. Make sure you are within range of your assigned location and that GPS is turned on.",
  },
  {
    question: "My selfie won't upload — what do I do?",
    answer:
      "Check your internet connection. Make sure you've given the app camera permissions in your phone settings. Try switching between front and back camera, then switch back.",
  },
  {
    question: "The app feels slow or is stuck",
    answer:
      "Close the app completely and reopen it. Clear your browser cache if you're using the web version. Make sure you have a stable internet connection.",
  },
  {
    question: "How do I view my stats?",
    answer:
      "Go to the Profile tab. You can see Today's metrics, This Week's summary, and your Report tab for work hours and activity details.",
  },
];

interface HelpFAQDialogProps {
  teamType?: string;
  variant?: "button" | "icon";
}

export const HelpFAQDialog = ({ teamType, variant = "button" }: HelpFAQDialogProps) => {
  const [open, setOpen] = useState(false);

  const displayName = teamTypeDisplayNames[teamType || "hybrid"] || "Hybrid";
  const teamAnswer = teamTypeAnswers[teamType || "hybrid"] || teamTypeAnswers.hybrid;

  const faqItems = [
    {
      question: `How to use TraKKiT for ${displayName} activations?`,
      answer: teamAnswer,
    },
    ...sharedFaqItems,
  ];

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => setOpen(true)}
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setOpen(true)}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & FAQ
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help & FAQ</DialogTitle>
          </DialogHeader>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-sm text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </DialogContent>
      </Dialog>
    </>
  );
};
