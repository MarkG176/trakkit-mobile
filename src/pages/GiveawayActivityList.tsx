import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface GiveawayActivity {
  id: string;
  timestamp: string;
  customer_name: string | null;
  has_notes: boolean;
  has_images: boolean;
}

export const GiveawayActivityList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<GiveawayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGiveawayActivities = async () => {
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
          .select('id, timestamp, customer_name, image_url')
          .eq('interaction_type', 'giveaway')
          .in('task_id', taskIds)
          .order('timestamp', { ascending: false });

        if (interactions) {
          const activitiesWithMeta = await Promise.all(
            interactions.map(async (interaction) => {
              const { data: notes } = await supabase
                .from('notes')
                .select('id')
                .eq('interaction_id', interaction.id)
                .limit(1);

              return {
                ...interaction,
                has_notes: (notes?.length || 0) > 0,
                has_images: !!interaction.image_url
              };
            })
          );

          setActivities(activitiesWithMeta);
        }
      } catch (err) {
        console.error('Failed to fetch giveaway activities', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGiveawayActivities();
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
          <h1 className="text-h1">My Giveaway Activities</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground">No giveaway activities found</p>
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
                      Giveaway: {activity.customer_name || 'Recipient'}
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
