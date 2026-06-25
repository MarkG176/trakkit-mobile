// [CMP-f31aa8] SurveyActivityList — survey submissions list
import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import {
  useAgentSurveyResponses,
  type SurveyResponseRange,
  type SurveyResponseRecord,
} from "@/hooks/useAgentSurveyResponses";
import { SurveyResponseSheet } from "@/components/profile/SurveyResponseSheet";

export const SurveyActivityList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const range = ((location.state as { range?: SurveyResponseRange } | null)?.range ?? "all") as SurveyResponseRange;

  const { data: responses = [], isLoading } = useAgentSurveyResponses(range);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponseRecord | null>(null);

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">{range === "today" ? "Today's Surveys" : "My Survey Activities"}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
        ) : responses.length === 0 ? (
          <p className="text-center text-muted-foreground">No survey activities found</p>
        ) : (
          responses.map((response) => (
            <Card
              key={response.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedResponse(response)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {response.template_title || "Survey response"}
                      </p>
                      {(response.completed_at || response.created_at) && (
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(response.completed_at || response.created_at!),
                            "MMM dd, yyyy • HH:mm",
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <SurveyResponseSheet
        response={selectedResponse}
        onOpenChange={(open) => {
          if (!open) setSelectedResponse(null);
        }}
      />
    </MobileLayout>
  );
};
