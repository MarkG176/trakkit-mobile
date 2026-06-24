// [CMP-f31aa8] SurveyActivityList — survey submissions list
import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface SurveyActivity {
  id: string;
  timestamp: string;
  customer_name: string | null;
  survey_template_id: string | null;
  has_notes: boolean;
  has_images: boolean;
}

export const SurveyActivityList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<SurveyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurveyActivities = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: tasks } = await supabase
          .from('agent_tasks')
          .select('id')
          .eq('agent_id', user.id);

        const taskIds = tasks?.map(t => t.id) || [];

        const { data: interactions } = await supabase
          .from('interactions')
          .select('id, timestamp, customer_name, survey_template_id, image_url')
          .eq('interaction_type', 'survey')
          .in('task_id', taskIds)
          .order('timestamp', { ascending: false })
          .limit(100);

        if (interactions) {
          // Batch the notes lookup into a single query (was an N+1 per row).
          const interactionIds = interactions.map((i) => i.id);
          const interactionsWithNotes = new Set<string>();
          if (interactionIds.length > 0) {
            const { data: notes } = await supabase
              .from('notes')
              .select('interaction_id')
              .in('interaction_id', interactionIds);
            for (const note of notes || []) {
              if (note.interaction_id) interactionsWithNotes.add(note.interaction_id);
            }
          }

          const activitiesWithMeta = interactions.map((interaction) => ({
            ...interaction,
            has_notes: interactionsWithNotes.has(interaction.id),
            has_images: !!interaction.image_url,
          }));

          setActivities(activitiesWithMeta);
        }
      } catch (err) {
        console.error('Failed to fetch survey activities', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyActivities();
  }, [user]);

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/reports")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">My Survey Activities</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground">No survey activities found</p>
        ) : (
          activities.map((activity) => (
            <Card
              key={activity.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/activity-detail/${activity.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-foreground">
                      Survey: {activity.customer_name || 'Participant'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-3">
                  {activity.has_notes && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText size={14} />
                      <span>Notes</span>
                    </div>
                  )}
                  {activity.has_images && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Camera size={14} />
                      <span>Pictures</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
};
