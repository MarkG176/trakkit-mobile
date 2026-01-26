import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Gift, Phone, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Giveaway {
  id: string;
  recorded_at: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  products_given: any;
  total_items: number;
  engagement_quality: string | null;
  follow_up_required: boolean | null;
}

interface MobileGiveawaysTabProps {
  workspaceId: string | undefined;
  startDate: string | null;
  endDate: string | null;
}

export function MobileGiveawaysTab({ workspaceId, startDate, endDate }: MobileGiveawaysTabProps) {
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);

  const { data: giveaways = [], isLoading } = useQuery({
    queryKey: ['mobile-giveaways', workspaceId, startDate, endDate],
    queryFn: async () => {
      const start = startDate || "2020-01-01";
      const end = endDate || new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("giveaways")
        .select("id, recorded_at, recipient_name, recipient_phone, products_given, total_items, engagement_quality, follow_up_required")
        .eq("workspace_id", workspaceId!)
        .gte("recorded_at", start)
        .lte("recorded_at", end + "T23:59:59")
        .eq("is_deleted", false)
        .order("recorded_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const getQualityColor = (quality: string | null) => {
    switch (quality?.toLowerCase()) {
      case "high": return "bg-green-500/10 text-green-600";
      case "medium": return "bg-yellow-500/10 text-yellow-600";
      case "low": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <span className="font-semibold">Giveaways</span>
          </div>
          <span className="text-sm text-muted-foreground">{giveaways.length}</span>
        </div>
      </div>

      {/* Giveaways List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {giveaways.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Gift className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No giveaways recorded</p>
          </div>
        ) : (
          giveaways.map((giveaway) => (
            <Card key={giveaway.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedGiveaway(giveaway)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {giveaway.recipient_name || "Anonymous"}
                    </p>
                    {giveaway.recipient_phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {giveaway.recipient_phone}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {giveaway.follow_up_required && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Follow-up
                      </Badge>
                    )}
                    {giveaway.engagement_quality && (
                      <Badge className={getQualityColor(giveaway.engagement_quality)}>
                        {giveaway.engagement_quality}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gift className="w-4 h-4" />
                    {giveaway.total_items} items
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(giveaway.recorded_at), "MMM d, HH:mm")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Giveaway Details Sheet */}
      <Sheet open={!!selectedGiveaway} onOpenChange={() => setSelectedGiveaway(null)}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>{selectedGiveaway?.recipient_name || "Anonymous"}</SheetTitle>
          </SheetHeader>
          {selectedGiveaway && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{selectedGiveaway.total_items}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className={`text-lg font-medium ${getQualityColor(selectedGiveaway.engagement_quality)}`}>
                    {selectedGiveaway.engagement_quality || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">Quality</p>
                </div>
              </div>

              {selectedGiveaway.recipient_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {selectedGiveaway.recipient_phone}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Recorded: {format(new Date(selectedGiveaway.recorded_at), "PPpp")}
              </p>

              {selectedGiveaway.follow_up_required && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Follow-up Required
                </Badge>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
