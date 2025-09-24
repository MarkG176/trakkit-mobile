import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EngagementData) => void;
  activityType: "sale" | "survey" | "giveaway" | "interaction";
}

interface EngagementData {
  engagementType: string;
  notes: string;
  sentiment: number;
}

export const EngagementModal = ({ isOpen, onClose, onSave, activityType }: EngagementModalProps) => {
  const [engagementType, setEngagementType] = useState("");
  const [notes, setNotes] = useState("");
  const [sentiment, setSentiment] = useState(0);

  const getEngagementOptions = () => {
    switch (activityType) {
      case "sale":
        return [
          "In-person Meeting",
          "Phone Call", 
          "Demonstration",
          "Follow-up"
        ];
      case "survey":
        return [
          "Survey Completion",
          "Feedback Session",
          "Interview"
        ];
      case "giveaway":
        return [
          "Product Handover",
          "Promotional Event", 
          "Sample Distribution"
        ];
      default:
        return [
          "General Meeting",
          "Consultation",
          "Information Sharing"
        ];
    }
  };

  const handleSave = () => {
    onSave({
      engagementType,
      notes,
      sentiment
    });
    onClose();
    // Reset form
    setEngagementType("");
    setNotes("");
    setSentiment(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Engagement</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="engagement-type">Engagement Type</Label>
            <Select value={engagementType} onValueChange={setEngagementType}>
              <SelectTrigger>
                <SelectValue placeholder="Select engagement type" />
              </SelectTrigger>
              <SelectContent>
                {getEngagementOptions().map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Interaction Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add details about the interaction..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Customer Sentiment</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSentiment(rating)}
                  className="p-1"
                >
                  <Star
                    size={24}
                    className={`${
                      rating <= sentiment
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={!engagementType}
            >
              Save Engagement & Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};