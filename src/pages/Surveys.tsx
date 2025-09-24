import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EngagementModal } from "@/components/EngagementModal";
import { ArrowLeft, ArrowRight, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  name: string;
  progress: number;
  totalQuestions: number;
  currentQuestion: number;
}

const surveyData: Survey[] = [
  { id: "1", name: "Customer Satisfaction Survey", progress: 60, totalQuestions: 10, currentQuestion: 6 },
  { id: "2", name: "Product Feedback Survey", progress: 30, totalQuestions: 8, currentQuestion: 3 },
  { id: "3", name: "Market Research Survey", progress: 0, totalQuestions: 12, currentQuestion: 1 },
];

export const Surveys = () => {
  const { toast } = useToast();
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showPreSurvey, setShowPreSurvey] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    const interval = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    (window as any).recordingInterval = interval;
  };

  const stopRecording = () => {
    setIsRecording(false);
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval);
    }
    setRecordingDuration(0);
  };

  const handleStartSurvey = (survey: Survey) => {
    setActiveSurvey(survey);
    setShowPreSurvey(true);
  };

  const handleConfirmStartSurvey = (withRecording: boolean) => {
    setShowPreSurvey(false);
    if (withRecording) {
      startRecording();
    }
  };

  const handleSubmitSurvey = () => {
    if (isRecording) {
      stopRecording();
    }
    setShowEngagementModal(true);
  };

  const handleEngagementSave = (engagementData: any) => {
    toast({
      title: "Survey completed!",
      description: "+15 points earned. Engagement logged.",
    });
    setActiveSurvey(null);
    setShowEngagementModal(false);
  };

  // Pre-survey prompt
  if (showPreSurvey && activeSurvey) {
    return (
      <MobileLayout currentPage="surveys">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowPreSurvey(false);
                setActiveSurvey(null);
              }}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-h1">Ready to Start?</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-h3 mb-4 text-black">{activeSurvey.name}</h2>
              <p className="text-gray-600 mb-6">
                Are you ready to start the survey? You can optionally record the conversation.
              </p>
              
              <div className="space-y-3">
                <Button 
                  className="w-full h-12"
                  onClick={() => handleConfirmStartSurvey(true)}
                >
                  <Mic size={20} className="mr-2" />
                  Start Survey & Record Audio
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12"
                  onClick={() => handleConfirmStartSurvey(false)}
                >
                  Start Survey (No Recording)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  // Active survey view
  if (activeSurvey) {
    return (
      <MobileLayout currentPage="surveys">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isRecording) stopRecording();
                setActiveSurvey(null);
              }}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-h1">{activeSurvey.name}</h1>
              <p className="text-sm opacity-90">
                Question {activeSurvey.currentQuestion} of {activeSurvey.totalQuestions}
              </p>
            </div>
          </div>
          <Progress value={activeSurvey.progress} className="h-2 mb-2" />
          <RecordingIndicator isRecording={isRecording} duration={recordingDuration} />
        </div>

        <div className="p-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-h3 mb-4 text-black">How satisfied are you with our service?</h2>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left border rounded-lg hover:bg-accent">
                  Very Satisfied
                </button>
                <button className="w-full p-3 text-left border rounded-lg hover:bg-accent">
                  Satisfied
                </button>
                <button className="w-full p-3 text-left border rounded-lg hover:bg-accent">
                  Neutral
                </button>
                <button className="w-full p-3 text-left border rounded-lg hover:bg-accent">
                  Dissatisfied
                </button>
                <button className="w-full p-3 text-left border rounded-lg hover:bg-accent">
                  Very Dissatisfied
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              Previous
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmitSurvey}
            >
              Submit Survey
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>

        <EngagementModal
          isOpen={showEngagementModal}
          onClose={() => setShowEngagementModal(false)}
          onSave={handleEngagementSave}
          activityType="survey"
        />
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
          <Card key={survey.id} className="survey-card">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-h3 text-black">{survey.name}</h3>
                <span className="text-sm text-secondary">{survey.progress}%</span>
              </div>
              
              <Progress value={survey.progress} className="h-2 mb-3" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary">
                  {survey.currentQuestion} of {survey.totalQuestions} questions
                </span>
                <Button
                  size="sm"
                  onClick={() => handleStartSurvey(survey)}
                  className="ml-auto"
                >
                  {survey.progress === 0 ? "Start" : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
};