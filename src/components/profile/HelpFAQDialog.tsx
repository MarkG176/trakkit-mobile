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

const faqItems = [
  {
    question: "How do I check in?",
    answer:
      "Tap the Record Attendance button on the Dashboard. Allow location access when prompted and take a selfie. Make sure you are within range of your assigned location and that GPS is turned on.",
  },
  {
    question: "Why is my check-in failing?",
    answer:
      "Ensure your phone's GPS/Location is turned on (not just Wi-Fi location). Step outside if you're indoors — GPS signal can be weak inside buildings. Close and reopen the app, then try again.",
  },
  {
    question: "How do I record a sale?",
    answer:
      "Go to the Inventory tab, then tap Record Sale. Select the product, enter the quantity and customer details, and submit.",
  },
  {
    question: "How do I give away products?",
    answer:
      "Go to the Inventory tab and tap Give Products. Record the recipient's details and the items given.",
  },
  {
    question: "How do I add a location?",
    answer:
      "Go to the Routes tab. Use the Add Location form to register the area you're working in today.",
  },
  {
    question: "My selfie won't upload — what do I do?",
    answer:
      "Check your internet connection. Make sure you've given the app camera permissions in your phone settings. Try switching between front and back camera, then switch back.",
  },
  {
    question: "What is the Evening Report?",
    answer:
      "When you check out at the end of your day, an Evening Report pops up automatically. It shows your sales summary, lets you add notes about your day, and allows you to upload engagement photos from the field.",
  },
  {
    question: "My sales or giveaways aren't showing up",
    answer:
      "Pull down to refresh the page. Make sure you selected the correct workspace at the top of the screen. If the issue persists, try checking out and checking back in.",
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

export const HelpFAQDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="w-4 h-4 mr-2" />
        Help & FAQ
      </Button>

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
