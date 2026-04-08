import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface SaleActivity {
  id: string;
  timestamp: string;
  customer_name: string | null;
  sale_value: number;
  product_variant_id: string;
  product_name: string | null;
  has_notes: boolean;
  has_images: boolean;
}

export const SalesActivityList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<SaleActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesActivities = async () => {
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
          .select('id, timestamp, customer_name, sale_value, product_variant_id, image_url, product_variants(name, sku)')
          .eq('interaction_type', 'sale')
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
                product_name: (() => { const pv = (interaction as any).product_variants; return pv?.sku ? `${pv.sku} - ${pv.name || 'Product'}` : (pv?.name || null); })(),
                has_notes: (notes?.length || 0) > 0,
                has_images: !!interaction.image_url
              };
            })
          );

          setActivities(activitiesWithMeta);
        }
      } catch (err) {
        console.error('Failed to fetch sales activities', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesActivities();
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
          <h1 className="text-h1">My Sales Activities</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground">No sales activities found</p>
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
                      {activity.customer_name || 'Customer'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.product_name || 'Product'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-foreground">
                    KES {activity.sale_value?.toLocaleString() || 0}
                  </p>
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
