import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface ProductGiven {
  product_variant_id: string;
  product_name: string;
  quantity: number;
}

interface GiveawayActivity {
  id: string;
  timestamp: string;
  customer_name: string | null;
  total_items: number;
  products_given: ProductGiven[];
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
        const { data: giveaways, error } = await supabase
          .from('giveaways')
          .select('id, recorded_at, recipient_name, total_items, products_given')
          .eq('agent_id', user.id)
          .eq('is_deleted', false)
          .order('recorded_at', { ascending: false });

        if (error) throw error;

        setActivities(
          (giveaways || []).map(g => ({
            id: g.id,
            timestamp: g.recorded_at,
            customer_name: g.recipient_name,
            total_items: g.total_items,
            products_given: g.products_given,
          }))
        );
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
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Gift size={48} className="mb-2 opacity-50" />
            <p className="text-sm">No giveaway activities found</p>
          </div>
        ) : (
          activities.map((activity) => (
            <Card
              key={activity.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-foreground">
                      {activity.customer_name || 'Recipient'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  <Gift size={14} />
                  <span>{activity.total_items} item{activity.total_items !== 1 ? 's' : ''} given</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
};
