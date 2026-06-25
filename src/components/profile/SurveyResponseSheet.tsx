import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { useSurveyTemplate, type SurveyQuestion } from "@/hooks/useSurveyTemplate";
import type { SurveyResponseRecord } from "@/hooks/useAgentSurveyResponses";

interface SurveyResponseSheetProps {
  response: SurveyResponseRecord | null;
  onOpenChange: (open: boolean) => void;
}

const getQuestionLabel = (question: SurveyQuestion, index: number) =>
  question.text || question.question || question.title || question.label || `Question ${index + 1}`;

const ReadOnlyAnswer = ({ question, answer }: { question: SurveyQuestion; answer: unknown }) => {
  const hasAnswer = answer !== undefined && answer !== null && answer !== "";

  if (!hasAnswer) {
    return <p className="text-sm text-muted-foreground italic">No answer</p>;
  }

  if (question.type === "rating") {
    const rating = Number(answer) || 0;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            size={24}
            className={value <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
          />
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    return <p className="text-sm font-medium text-foreground">{String(answer)}</p>;
  }

  return <p className="text-sm text-foreground whitespace-pre-wrap">{String(answer)}</p>;
};

export const SurveyResponseSheet = ({ response, onOpenChange }: SurveyResponseSheetProps) => {
  const { data: template, isLoading } = useSurveyTemplate(response?.survey_template_id ?? null);

  const responses = (response?.responses ?? {}) as Record<string, unknown>;
  const completedAt = response?.completed_at || response?.created_at;
  const title = template?.title || response?.template_title || "Survey response";

  return (
    <Sheet open={!!response} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="p-4 border-b text-left">
          <SheetTitle>{title}</SheetTitle>
          {completedAt && (
            <p className="text-xs text-muted-foreground">
              {format(new Date(completedAt), "MMM dd, yyyy • HH:mm")}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : !template || template.questions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No questions available for this survey.
            </p>
          ) : (
            template.questions.map((question, index) => (
              <Card key={question.id ?? index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h2 className="text-sm font-semibold text-foreground">
                        {getQuestionLabel(question, index)}
                      </h2>
                      {question.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{question.description}</p>
                      )}
                    </div>
                  </div>
                  <ReadOnlyAnswer question={question} answer={responses[question.id]} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
