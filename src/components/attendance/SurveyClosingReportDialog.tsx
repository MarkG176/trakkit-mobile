import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ClipboardList, Clock, FileText } from "lucide-react";

interface SurveyClosingReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const SurveyClosingReportDialog = ({
  open,
  onOpenChange,
  onComplete,
}: SurveyClosingReportDialogProps) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  const [surveysCount, setSurveysCount] = useState(0);
  const [workMinutes, setWorkMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user && currentWorkspaceId) {
      fetchStats();
    }
    if (open) {
      setNotes("");
    }
  }, [open, user, currentWorkspaceId]);

  const fetchStats = async () => {
    if (!user || !currentWorkspaceId) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Fetch surveys completed today
      const surveyQuery = supabase
        .from("survey_responses" as any)
        .select("id", { count: "exact", head: true })
        .eq("respondent_id", user.id)
        .eq("workspace_id", currentWorkspaceId)
        .eq("is_completed", true)
        .gte("created_at", today + "T00:00:00")
        .lte("created_at", today + "T23:59:59");
      
      const { count: surveyCount, error: surveyError } = await surveyQuery;

      if (surveyError) {
        console.error("Error fetching survey count:", surveyError);
      }
      setSurveysCount(surveyCount || 0);

      // Fetch work time from agent_work_segments
      const { data: segments, error: segError } = await supabase
        .from("agent_work_segments")
        .select("segment_type, duration_minutes, segment_start, segment_end")
        .eq("agent_id", user.id)
        .eq("work_date", today);

      if (segError) {
        console.error("Error fetching work segments:", segError);
      }

      if (segments) {
        let totalWork = 0;
        let totalLunch = 0;

        segments.forEach((seg) => {
          const duration =
            seg.duration_minutes ||
            (seg.segment_end
              ? Math.floor(
                  (new Date(seg.segment_end).getTime() -
                    new Date(seg.segment_start).getTime()) /
                    60000
                )
              : seg.segment_type === "work"
              ? Math.floor(
                  (Date.now() - new Date(seg.segment_start).getTime()) / 60000
                )
              : 0);

          if (seg.segment_type === "work") {
            totalWork += duration;
          } else if (seg.segment_type === "lunch") {
            totalLunch += duration;
          }
        });

        setWorkMinutes(Math.max(0, totalWork - totalLunch));
      }
    } catch (error) {
      console.error("Error fetching closing report stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const handleSubmit = async () => {
    if (!user || !currentWorkspaceId) return;

    setIsSubmitting(true);
    try {
      // Save notes if provided
      if (notes.trim()) {
        const { error } = await supabase.from("notes").insert({
          agent_id: user.id,
          workspace_id: currentWorkspaceId,
          content: notes.trim(),
          note_type: "closing_report",
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Closing report submitted successfully",
      });

      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error("Error submitting closing report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Closing Report</DialogTitle>
          <DialogDescription>
            Review your day's summary before checking out
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center gap-2">
                  <ClipboardList className="h-6 w-6 text-primary" />
                  <span className="text-2xl font-bold text-foreground">
                    {surveysCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Surveys Done
                  </span>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <span className="text-2xl font-bold text-foreground">
                    {formatDuration(workMinutes)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Time Worked
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </Label>
                <Textarea
                  placeholder="Add any closing notes for the day..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
