// [CMP-569b1f] SaleFeedbackDialog — sale feedback dialog component
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, CheckCircle2 } from "lucide-react";

interface SaleFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: FeedbackData) => void;
  onSkip: () => void;
  totalAmount: number;
  itemCount: number;
  customerName?: string;
}

export interface FeedbackData {
  engagementType: string;
  notes: string;
  sentiment: number;
}

export const SaleFeedbackDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
  totalAmount,
  itemCount,
  customerName,
}: SaleFeedbackDialogProps) => {
  const [engagementType, setEngagementType] = useState("direct");
  const [notes, setNotes] = useState("");
  const [sentiment, setSentiment] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        engagementType,
        notes,
        sentiment,
      });
    } finally {
      setIsSubmitting(false);
      // Reset form
      setEngagementType("direct");
      setNotes("");
      setSentiment(0);
    }
  };

  const handleSkip = () => {
    onSkip();
    // Reset form
    setEngagementType("direct");
    setNotes("");
    setSentiment(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-left">Sale Recorded!</DialogTitle>
              <DialogDescription className="text-left">
                KES {totalAmount.toFixed(2)} • {itemCount} item{itemCount > 1 ? "s" : ""}
                {customerName && ` • ${customerName}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Engagement Type */}
          <div>
            <Label htmlFor="engagement-type" className="text-sm font-medium">
              Engagement Type
            </Label>
            <Select value={engagementType} onValueChange={setEngagementType}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select engagement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct Sale</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Sentiment */}
          <div>
            <Label className="text-sm font-medium">Customer Sentiment</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSentiment(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    size={28}
                    className={
                      star <= sentiment
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sentiment === 0 && "Tap to rate customer experience"}
              {sentiment === 1 && "Very Dissatisfied"}
              {sentiment === 2 && "Dissatisfied"}
              {sentiment === 3 && "Neutral"}
              {sentiment === 4 && "Satisfied"}
              {sentiment === 5 && "Very Satisfied"}
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Engagement Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this sale or customer interaction..."
              className="mt-2 min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
