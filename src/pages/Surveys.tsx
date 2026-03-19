import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EngagementModal } from "@/components/EngagementModal";
import { ArrowLeft, ArrowRight, Mic, MicOff, Star, Square, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAgentActions } from "@/hooks/useAgentActions";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { supabase } from "@/integrations/supabase/client";

interface SurveyTemplate {
  id: string;
  title: string;
  description: string | null;
  target_department: string | null;
  status: string | null;
  estimated_duration_minutes: number | null;
  questions: any[];
  is_published: boolean | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Survey {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  duration: string;
  questions: any[];
  totalQuestions: number;
  points: number;
  responses: number;
  progress: number;
  currentQuestion: number;
}

// Helper function to get category color based on target department
const getCategoryColor = (department: string | null): string => {
  const colorMap: { [key: string]: string } = {
    'Customer Service': 'bg-green-100 text-green-800',
    'Marketing': 'bg-orange-100 text-orange-800',
    'Product Development': 'bg-blue-100 text-blue-800',
    'Sales': 'bg-purple-100 text-purple-800',
    'Research': 'bg-yellow-100 text-yellow-800',
    'Operations': 'bg-red-100 text-red-800',
    'Quality Assurance': 'bg-indigo-100 text-indigo-800',
  };
  return colorMap[department || ''] || 'bg-gray-100 text-gray-800';
};

// Helper function to calculate points based on questions and duration
const calculatePoints = (questions: any[], duration: number | null): number => {
  const questionCount = questions?.length || 0;
  const durationMinutes = duration || 10;
  return Math.max(5, Math.min(30, questionCount * 2 + Math.floor(durationMinutes / 5)));
};

export const Surveys = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { displayName: agentName } = useUserProfile();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { recordSurvey } = useAgentActions();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<{ [questionId: string]: any }>({});
  const [surveyStartTime, setSurveyStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchSurveyTemplates();
    }
  }, [currentWorkspaceId]);

  // Auto-open survey if only one exists
  useEffect(() => {
    if (!loading && surveys.length === 1 && !activeSurvey) {
      handleStartSurvey(surveys[0]);
    }
  }, [surveys, loading]);

  const fetchSurveyTemplates = async () => {
    try {
      setLoading(true);
      
      const { data: surveyTemplates, error } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_published', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching survey templates:', error);
        toast({
          title: "Error loading surveys",
          description: "Could not load available surveys.",
          variant: "destructive",
        });
        return;
      }

      console.log('📊 Raw survey templates from DB:', surveyTemplates);

      if (surveyTemplates) {
        // Fetch response counts for each survey
        const surveysWithResponses = await Promise.all(
          surveyTemplates.map(async (template) => {
            const { count: responseCount } = await supabase
              .from('survey_responses')
              .select('*', { count: 'exact', head: true })
              .eq('survey_template_id', template.id);

            // Parse questions properly - handle JSONB data from Supabase
            let questionsArray: any[] = [];
            
            console.log(`🔍 Survey "${template.title}" - Raw questions type:`, typeof template.questions);
            console.log(`🔍 Survey "${template.title}" - Raw questions value:`, template.questions);
            console.log(`🔍 Survey "${template.title}" - Raw questions constructor:`, template.questions?.constructor?.name);
            console.log(`🔍 Survey "${template.title}" - Is Array:`, Array.isArray(template.questions));
            
            if (Array.isArray(template.questions)) {
              // Already an array
              questionsArray = template.questions;
              console.log(`✅ Questions are already an array with ${questionsArray.length} items`);
            } else if (typeof template.questions === 'string') {
              // JSON string that needs parsing
              try {
                questionsArray = JSON.parse(template.questions);
                console.log(`✅ Parsed questions from JSON string: ${questionsArray.length} items`);
              } catch (e) {
                console.error('❌ Error parsing questions JSON string:', e);
                questionsArray = [];
              }
            } else if (template.questions && typeof template.questions === 'object') {
              // JSONB object - might need to extract values or it might already be the array
              if (template.questions.constructor === Object) {
                // It's a plain object, try to get values
                questionsArray = Object.values(template.questions);
                console.log(`✅ Extracted questions from object: ${questionsArray.length} items`);
              } else {
                questionsArray = [];
                console.log(`⚠️ Unknown object type for questions`);
              }
            } else {
              console.log(`⚠️ Questions is null or undefined`);
              questionsArray = [];
            }

            console.log(`📋 Final questions array for "${template.title}":`, questionsArray);
            
            // Debug each individual question
            questionsArray.forEach((q, i) => {
              console.log(`   Question ${i + 1} structure:`, {
                id: q.id,
                type: q.type,
                text: q.text,
                question: q.question,
                required: q.required,
                options: q.options,
                allKeys: Object.keys(q)
              });
            });

            return {
              id: template.id,
              name: template.title,
              description: template.description || 'No description available',
              category: template.target_department || 'General',
              categoryColor: getCategoryColor(template.target_department),
              duration: template.estimated_duration_minutes 
                ? `${template.estimated_duration_minutes} min` 
                : '10 min',
              questions: questionsArray,
              totalQuestions: questionsArray.length,
              points: calculatePoints(questionsArray, template.estimated_duration_minutes),
              responses: responseCount || 0,
              progress: 0,
              currentQuestion: 1
            };
          })
        );

        console.log('✅ Final transformed surveys:', surveysWithResponses);
        setSurveys(surveysWithResponses);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading surveys.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCameraCapture = (imageData: string) => {
    toast({
      title: "Photo captured",
      description: "Survey photo captured successfully!",
    });
  };
  const {
    isRecording,
    duration: recordingDuration,
    audioUrl: recordingUrl,
    startRecording,
    stopRecording,
    resetRecording,
    uploading: recordingUploading,
  } = useAudioRecorder();
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showPreSurvey, setShowPreSurvey] = useState(false);

  const handleStartSurvey = (survey: Survey) => {
    setActiveSurvey(survey);
    setSurveyResponses({});
    setSurveyStartTime(new Date());
    setShowPreSurvey(true);
  };

  const handleConfirmStartSurvey = (withRecording: boolean) => {
    setShowPreSurvey(false);
    if (withRecording) {
      startRecording();
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setSurveyResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitSurvey = async () => {
    if (isSubmitting) return;
    
    let finalRecordingUrl = recordingUrl;
    if (isRecording) {
      finalRecordingUrl = await stopRecording();
    }
    
    await submitSurveyResponse({}, finalRecordingUrl);
  };

  const submitSurveyResponse = async (engagementData: any, audioUrl?: string | null) => {
    if (!user || !activeSurvey) {
      toast({
        title: "Error",
        description: "Unable to submit survey. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (error) {
          console.log('Location not available:', error);
        }
      }

      // Calculate survey duration
      const endTime = new Date();
      const durationSeconds = surveyStartTime 
        ? Math.floor((endTime.getTime() - surveyStartTime.getTime()) / 1000)
        : 0;

      // Get the current user's active task
      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', user.id)
        .eq('status', 'pending')
        .single();

      // Create interaction record
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          task_id: currentTask?.id,
          agent_id: user.id,
          interaction_type: 'survey',
          outcome: 'completed',
          quantity_sold: 0,
          metadata: {
            survey_template_id: activeSurvey.id,
            recording_duration: recordingDuration
          },
          workspace_id: currentWorkspaceId
        })
        .select()
        .single();

      if (interactionError) {
        throw interactionError;
      }

      // Save survey response to survey_responses table
      const { error: surveyResponseError } = await supabase
        .from('survey_responses')
        .insert({
          agent_id: user.id,
          survey_template_id: activeSurvey.id,
          interaction_id: interaction.id,
          responses: surveyResponses,
          started_at: surveyStartTime?.toISOString(),
          completed_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
          completion_time_seconds: durationSeconds,
          is_completed: true,
          completion_status: 'completed',
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          workspace_id: currentWorkspaceId
        });

      if (surveyResponseError) {
        throw surveyResponseError;
      }

      // Record survey action for points
      await recordSurvey(user.id, activeSurvey.name, {
        survey_template_id: activeSurvey.id,
        duration_seconds: durationSeconds,
        questions_answered: Object.keys(surveyResponses).length,
        interaction_id: interaction.id
      });

      toast({
        title: "Survey completed!",
        description: `+${activeSurvey.points} points earned. Survey responses saved.`,
      });

      // Reset state and navigate back
      setActiveSurvey(null);
      setSurveyResponses({});
      setSurveyStartTime(null);
      
      navigate("/");

    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Error submitting survey",
        description: "Failed to save survey responses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          {activeSurvey?.questions && activeSurvey.questions.length > 0 ? (
            activeSurvey.questions.map((question: any, index: number) => (
                <Card key={question.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-2 mb-4">
                      <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h2 className="text-h3 text-black mb-1">
                          {question.text || question.question || question.title || question.label || `Question ${index + 1}`}
                        </h2>
                        {question.required && (
                          <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  
                  <div className="space-y-3">
                    {question.type === 'rating' && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleAnswerChange(question.id, rating)}
                            className="p-1"
                          >
                            <Star
                              size={32}
                              className={`${
                                rating <= (surveyResponses[question.id] || 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'multiple_choice' && question.options && (
                      question.options.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                          <input 
                            type="radio" 
                            name={question.id} 
                            value={option}
                            checked={surveyResponses[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="text-primary" 
                          />
                          <span>{option}</span>
                        </label>
                      ))
                    )}
                    
                    {question.type === 'text' && (
                      <textarea
                        name={question.id}
                        value={surveyResponses[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Enter your response..."
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={4}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No questions available for this survey.</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              Previous
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmitSurvey}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Survey"}
              {!isSubmitting && <ArrowRight size={16} className="ml-2" />}
            </Button>
          </div>
        </div>

      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="surveys">
      <TopBar />
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
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading surveys...</div>
          </div>
        ) : surveys.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground text-center">
              <div className="text-2xl mb-2">📋</div>
              <div>No surveys available</div>
              <div className="text-sm">Check back later for new surveys</div>
            </div>
          </div>
        ) : (
          surveys.map((survey) => (
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
                <span>❓ {survey.totalQuestions} questions</span>
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
          ))
        )}
        
      </div>
    </MobileLayout>
  );
};