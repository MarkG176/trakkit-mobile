import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EngagementModal } from "@/components/EngagementModal";
import { ArrowLeft, ArrowRight, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";

interface Survey {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  duration: string;
  questions: number;
  totalQuestions: number;
  points: number;
  responses: number;
  progress: number;
  currentQuestion: number;
}

const surveyData: Survey[] = [
  { 
    id: "1", 
    name: "Q1 Customer Satisfaction Survey", 
    description: "Evaluate customer satisfaction with our products and services during Q1",
    category: "Customer Experience", 
    categoryColor: "bg-green-100 text-green-800",
    duration: "15 min",
    questions: 4,
    totalQuestions: 4,
    points: 15,
    responses: 1247,
    progress: 0,
    currentQuestion: 1
  },
  { 
    id: "2", 
    name: "Brand Awareness Study", 
    description: "Assess consumer awareness and perception of our brand in the market",
    category: "Market Research", 
    categoryColor: "bg-orange-100 text-orange-800",
    duration: "10 min",
    questions: 12,
    totalQuestions: 12,
    points: 20,
    responses: 892,
    progress: 0,
    currentQuestion: 1
  },
  { 
    id: "3", 
    name: "Product Feature Preference", 
    description: "Understand customer preferences and value their most customers value most",
    category: "Product Development", 
    categoryColor: "bg-blue-100 text-blue-800",
    duration: "8 min",
    questions: 6,
    totalQuestions: 6,
    points: 15,
    responses: 344,
    progress: 0,
    currentQuestion: 1
  },
  { 
    id: "4", 
    name: "Shopping Behavior Analysis", 
    description: "Learn about customer shopping patterns and preferences",
    category: "Consumer Behavior", 
    categoryColor: "bg-purple-100 text-purple-800",
    duration: "20 min",
    questions: 15,
    totalQuestions: 15,
    points: 25,
    responses: 456,
    progress: 0,
    currentQuestion: 1
  },
  { 
    id: "5", 
    name: "Service Quality Assessment", 
    description: "Measure the quality of our customer service interactions",
    category: "Service Excellence", 
    categoryColor: "bg-yellow-100 text-yellow-800",
    duration: "12 min",
    questions: 10,
    totalQuestions: 10,
    points: 18,
    responses: 723,
    progress: 0,
    currentQuestion: 1
  }
];

export const Surveys = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { displayName: agentName } = useUserProfile();
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  
  const handleCameraCapture = (imageData: string) => {
    toast({
      title: "Photo captured",
      description: "Survey photo captured successfully!",
    });
  };
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
              <div className="flex items-start gap-2 mb-4">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                <div className="flex-1">
                  <h2 className="text-h3 text-black mb-1">How would you rate your overall satisfaction with our service?</h2>
                  <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Required</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <input type="radio" name="satisfaction" value="very-satisfied" className="text-primary" />
                  <span>Very Satisfied</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <input type="radio" name="satisfaction" value="satisfied" className="text-primary" />
                  <span>Satisfied</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <input type="radio" name="satisfaction" value="neutral" className="text-primary" />
                  <span>Neutral</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <input type="radio" name="satisfaction" value="dissatisfied" className="text-primary" />
                  <span>Dissatisfied</span>
                </label>
                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <input type="radio" name="satisfaction" value="very-dissatisfied" className="text-primary" />
                  <span>Very Dissatisfied</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Question 2 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-2 mb-4">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                <div className="flex-1">
                  <h2 className="text-h3 text-black mb-1">On a scale of 1-5, how likely are you to recommend our service to others?</h2>
                  <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Required</span>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex flex-col items-center cursor-pointer">
                    <div className="w-12 h-12 border-2 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                      <input type="radio" name="recommendation" value={rating} className="sr-only" />
                      <span className="text-lg font-semibold">{rating}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 3 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-2 mb-4">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                <div className="flex-1">
                  <h2 className="text-h3 text-black mb-1">Which of our services have you used recently?</h2>
                  <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Required</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  "Online Shopping",
                  "In-Store Purchase", 
                  "Customer Support",
                  "Delivery Service",
                  "Returns/Exchange"
                ].map((service) => (
                  <label key={service} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <input type="checkbox" name="services" value={service} className="text-primary" />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question 4 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-2 mb-4">
                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                <div className="flex-1">
                  <h2 className="text-h3 text-black mb-1">What is your age range?</h2>
                </div>
              </div>
              
              <div className="space-y-3">
                {["18-25", "26-35", "36-45", "46-55", "56+"].map((ageRange) => (
                  <label key={ageRange} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <input type="radio" name="age" value={ageRange} className="text-primary" />
                    <span>{ageRange}</span>
                  </label>
                ))}
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
      <TopBar onCameraCapture={handleCameraCapture} />
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">Choose a Survey</h1>
        </div>
        <p className="text-sm opacity-90">Select a survey to complete and earn points</p>
      </div>

      <div className="p-4 space-y-4">
        {surveyData.map((survey) => (
          <Card key={survey.id} className="survey-card cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-h3 text-black mb-1">{survey.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{survey.description}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${survey.categoryColor}`}>
                    {survey.category}
                  </span>
                </div>
                <ArrowRight size={20} className="text-muted-foreground mt-1" />
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span>⏱️ {survey.duration}</span>
                <span>❓ {survey.questions} questions</span>
                <span>🏆 {survey.points} points</span>
                <span>📊 {survey.responses} responses</span>
              </div>
              
              <Button
                className="w-full"
                onClick={() => handleStartSurvey(survey)}
              >
                Start Survey
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {/* Survey Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                💡
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Survey Tips</h4>
                <p className="text-sm text-blue-800">
                  Answer honestly and thoughtfully to provide valuable insights. Your responses help improve our products and services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};