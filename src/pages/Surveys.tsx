import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Survey {
  id: string;
  name: string;
  progress: number;
  totalQuestions: number;
  currentQuestion: number;
}

const surveyData: Survey[] = [
  { id: "1", name: "Customer Satisfaction Survey", progress: 60, totalQuestions: 10, currentQuestion: 6 },
  { id: "2", name: "Product Feedback Assessment", progress: 0, totalQuestions: 8, currentQuestion: 0 },
  { id: "3", name: "Service Quality Review", progress: 100, totalQuestions: 12, currentQuestion: 12 },
];

export const Surveys = () => {
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");

  if (activeSurvey) {
    return (
      <MobileLayout currentPage="surveys">
        <div className="min-h-screen bg-background">
          {/* Survey Header */}
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setActiveSurvey(null)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ChevronLeft size={20} />
              </Button>
              <h1 className="text-lg font-medium flex-1">{activeSurvey.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Question {activeSurvey.currentQuestion + 1} of {activeSurvey.totalQuestions}</span>
              <Progress value={(activeSurvey.currentQuestion / activeSurvey.totalQuestions) * 100} className="flex-1 h-2" />
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6 flex-1">
            <h2 className="text-h2 mb-6">How satisfied are you with our product quality?</h2>
            
            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"].map((option) => (
                <button
                  key={option}
                  onClick={() => setCurrentAnswer(option)}
                  className={`w-full p-4 text-left border border-border rounded-lg transition-colors ${
                    currentAnswer === option 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card hover:bg-accent"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <ChevronLeft size={16} className="mr-2" />
                Back
              </Button>
              <Button className="flex-1" disabled={!currentAnswer}>
                Next
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="surveys">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Surveys</h1>
        <p className="text-sm opacity-90">Complete your assigned surveys</p>
      </div>

      <div className="p-4 space-y-4">
        {surveyData.map((survey) => (
          <div key={survey.id} className="performance-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h3 flex-1">{survey.name}</h3>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{survey.progress}%</span>
              </div>
              <Progress value={survey.progress} className="h-2" />
            </div>

            <Button 
              className="w-full"
              onClick={() => setActiveSurvey(survey)}
              disabled={survey.progress === 100}
            >
              {survey.progress === 0 ? "Start" : survey.progress === 100 ? "Completed" : "Resume"}
            </Button>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
};