// [CMP-436347] MobileFeedbackTab — mobile feedback tab component
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MessageSquare, Search, Phone, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  customer_name: string | null;
  contact_phone: string | null;
  content: string;
  agent_id: string | null;
  created_at: string;
  note_type: string | null;
}

interface MobileFeedbackTabProps {
  workspaceId: string | undefined;
  startDate: string | null;
  endDate: string | null;
}

export function MobileFeedbackTab({ workspaceId, startDate, endDate }: MobileFeedbackTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  const { data: feedbackItems = [], isLoading } = useQuery({
    queryKey: ['mobile-feedback', workspaceId, startDate, endDate],
    queryFn: async (): Promise<FeedbackItem[]> => {
      const start = startDate || "2020-01-01";
      const end = endDate || new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("notes")
        .select("id, customer_name, contact_phone, content, agent_id, created_at, note_type")
        .eq("workspace_id", workspaceId!)
        .eq("is_deleted", false)
        .gte("created_at", start)
        .lte("created_at", end + "T23:59:59")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const filteredFeedback = feedbackItems.filter(item =>
    item.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="p-4 border-b bg-background sticky top-0 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredFeedback.length} notes
        </p>
      </div>

      {/* Feedback List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredFeedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No feedback found</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedFeedback(item)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">
                        {item.customer_name || "Anonymous"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content}
                    </p>
                    {item.contact_phone && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {item.contact_phone}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Feedback Details Sheet */}
      <Sheet open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedFeedback?.customer_name || "Anonymous"}
            </SheetTitle>
          </SheetHeader>
          {selectedFeedback && (
            <div className="mt-4 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{selectedFeedback.content}</p>
              </div>

              {selectedFeedback.contact_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {selectedFeedback.contact_phone}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {format(new Date(selectedFeedback.created_at), "PPpp")}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
