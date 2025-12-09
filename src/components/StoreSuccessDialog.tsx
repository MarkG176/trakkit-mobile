import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Gift, MessageSquare, ClipboardList, Star, Plus, Minus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StoreSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  storeCounty: string;
}

type ActionType = null | "survey" | "sale" | "giveaway" | "interaction";


interface SelectedProduct {
  id: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  productVariantId: string;
}

interface InventoryItem {
  id: string;
  product_variant_id: string;
  amount_issued: number;
  name: string;
}

export const StoreSuccessDialog = ({ open, onOpenChange, storeName, storeCounty }: StoreSuccessDialogProps) => {
  const { toast } = useToast();
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);

  // Survey state
  const [selectedSurvey, setSelectedSurvey] = useState("");
  const [surveys, setSurveys] = useState<any[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<{ [questionId: string]: any }>({});

  // Sale state
  const [productVariantId, setProductVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  // Giveaway state
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [giveawayNotes, setGiveawayNotes] = useState("");

  // Interaction state
  const [interactionNotes, setInteractionNotes] = useState("");
  const [sentiment, setSentiment] = useState(0);

  const handleActionClick = async (action: ActionType) => {
    setActiveAction(action);
    
    // Load data based on action
    if (action === "survey") {
      const { data } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('is_published', true)
        .eq('status', 'active');
      
      const publishedSurveys = data || [];
      setSurveys(publishedSurveys);
      
      // Auto-open if only one survey
      if (publishedSurveys.length === 1) {
        console.log('Auto-opening survey:', publishedSurveys[0]);
        console.log('Survey questions:', publishedSurveys[0].questions);
        setSelectedSurvey(publishedSurveys[0].id);
        const questions = Array.isArray(publishedSurveys[0].questions) ? publishedSurveys[0].questions : [];
        console.log('Setting questions:', questions);
        setSurveyQuestions(questions);
      }
    } else if (action === "sale" || action === "giveaway") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('agent_task_inventory')
          .select('id, product_variant_id, amount_issued, name')
          .eq('agent_id', user.id)
          .eq('is_deleted', false);
        
        if (action === "sale") {
          setProducts(data || []);
        } else {
          setInventory((data || []) as InventoryItem[]);
        }
      }
    }
  };

  const handleSurveySelect = (surveyId: string) => {
    setSelectedSurvey(surveyId);
    const survey = surveys.find(s => s.id === surveyId);
    if (survey) {
      console.log('Survey data:', survey);
      console.log('Survey questions:', survey.questions);
      const questions = Array.isArray(survey.questions) ? survey.questions : [];
      console.log('Parsed questions:', questions);
      setSurveyQuestions(questions);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setSurveyResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitSurvey = async () => {
    if (!selectedSurvey) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();

      // Create interaction record
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          task_id: null,
          interaction_type: 'survey',
          survey_template_id: selectedSurvey,
          customer_name: storeName,
          outcome: 'completed',
          quantity_sold: 0,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (interactionError) throw interactionError;

      // Save survey responses
      const { error: surveyResponseError } = await supabase
        .from('survey_responses')
        .insert({
          agent_id: user.id,
          survey_template_id: selectedSurvey,
          interaction_id: interaction.id,
          responses: surveyResponses,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          is_completed: true,
          completion_status: 'completed',
          location_lat: location.latitude,
          location_lng: location.longitude
        });

      if (surveyResponseError) throw surveyResponseError;

      toast({
        title: "Survey Completed",
        description: "Survey responses have been recorded successfully.",
      });
      
      // Reset and close
      setActiveAction(null);
      setSurveyResponses({});
      setSurveyQuestions([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSale = async () => {
    if (!productVariantId || !quantity) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();
      const product = products.find(p => p.id === productVariantId);
      const totalValue = product ? product.price * parseInt(quantity) : 0;

      // Create or get customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert({
          name: storeName,
          county: storeCounty,
          location_lat: location.latitude,
          location_lng: location.longitude,
        }, {
          onConflict: 'phone',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Record interaction
      const { error: interactionError } = await supabase.from('interactions').insert({
        task_id: null,
        interaction_type: 'sale',
        customer_name: storeName,
        product_variant_id: productVariantId,
        quantity_sold: parseInt(quantity),
        sale_value: totalValue,
        outcome: 'completed',
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      } as any);

      if (interactionError) throw interactionError;

      // Record customer purchase
      await supabase.from('customer_purchases').insert({
        customer_id: customer.id,
        agent_id: user.id,
        product_variant_id: productVariantId,
        quantity: parseInt(quantity),
        total_value: totalValue,
        location_lat: location.latitude,
        location_lng: location.longitude,
      });

      toast({
        title: "Sale Recorded",
        description: "Sale has been recorded successfully.",
      });
      
      // Reset and return to actions
      setActiveAction(null);
      setProductVariantId("");
      setQuantity("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGiveaway = async () => {
    if (selectedProducts.length === 0) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();

      const { error } = await supabase.from('giveaways').insert({
        agent_id: user.id,
        recipient_name: storeName,
        products_given: selectedProducts.map(p => ({
          product_variant_id: p.productVariantId,
          quantity: p.quantity,
          name: p.name
        })),
        total_items: selectedProducts.reduce((sum, p) => sum + p.quantity, 0),
        notes: giveawayNotes,
        location_lat: location.latitude,
        location_lng: location.longitude,
        recorded_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Giveaway Recorded",
        description: "Giveaway has been recorded successfully.",
      });
      
      // Reset and return to actions
      setActiveAction(null);
      setSelectedProducts([]);
      setGiveawayNotes("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInteraction = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();

      const { error } = await supabase.from('interactions').insert({
        task_id: null,
        interaction_type: 'other',
        customer_name: storeName,
        outcome: 'completed',
        quantity_sold: 0,
        metadata: { 
          notes: interactionNotes || `Automatic engagement log for ${storeName}`, 
          sentiment: sentiment || 5,
          store_county: storeCounty
        },
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      } as any);

      if (error) throw error;

      toast({
        title: "Engagement Logged",
        description: "Engagement interaction has been recorded successfully.",
      });
      
      // Reset and return to actions
      setActiveAction(null);
      setInteractionNotes("");
      setSentiment(0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const addProduct = (item: InventoryItem) => {
    const existing = selectedProducts.find(p => p.productVariantId === item.product_variant_id);
    if (existing) {
      if (existing.quantity < existing.maxQuantity) {
        setSelectedProducts(selectedProducts.map(p =>
          p.productVariantId === item.product_variant_id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        ));
      }
    } else {
      setSelectedProducts([...selectedProducts, {
        id: item.id,
        name: item.name || 'Unknown Product',
        quantity: 1,
        maxQuantity: item.amount_issued,
        productVariantId: item.product_variant_id
      }]);
    }
  };

  const removeProduct = (productVariantId: string) => {
    const existing = selectedProducts.find(p => p.productVariantId === productVariantId);
    if (existing && existing.quantity > 1) {
      setSelectedProducts(selectedProducts.map(p =>
        p.productVariantId === productVariantId
          ? { ...p, quantity: p.quantity - 1 }
          : p
      ));
    } else {
      setSelectedProducts(selectedProducts.filter(p => p.productVariantId !== productVariantId));
    }
  };

  const renderActionForm = () => {
    switch (activeAction) {
      case "survey":
        return (
          <div className="space-y-4 mt-4">
            {surveys.length > 1 && !surveyQuestions.length && (
              <div>
                <Label>Select Survey</Label>
                <Select value={selectedSurvey} onValueChange={handleSurveySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a survey" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveys.map((survey) => (
                      <SelectItem key={survey.id} value={survey.id}>
                        {survey.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {surveyQuestions.length > 0 && (
              <div className="space-y-4">
                {surveyQuestions.map((question: any, index: number) => (
                  <Card key={question.id || index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1 text-foreground">{question.question || question.text || 'Question'}</h3>
                          {question.required && (
                            <span className="inline-block bg-destructive/10 text-destructive px-2 py-0.5 rounded text-xs font-medium">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 ml-8">
                        {(question.type === 'rating' || question.type === 'multiple_choice') && question.options && (
                          question.options.map((option: string, optionIndex: number) => (
                            <label key={optionIndex} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent cursor-pointer">
                              <input 
                                type="radio" 
                                name={question.id} 
                                value={option}
                                checked={surveyResponses[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="text-primary" 
                              />
                              <span className="text-sm">{option}</span>
                            </label>
                          ))
                        )}
                        
                        {question.type === 'text' && (
                          <Textarea
                            value={surveyResponses[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            placeholder="Enter your response..."
                            rows={3}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button onClick={handleSubmitSurvey} disabled={loading} className="w-full">
                  {loading ? "Submitting..." : "Submit Survey"}
                </Button>
              </div>
            )}
          </div>
        );

      case "sale":
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Product</Label>
              <Select value={productVariantId} onValueChange={setProductVariantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.product_variant_id} value={product.product_variant_id}>
                      {product.name || 'Unknown Product'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                min="1"
              />
            </div>
            <Button onClick={handleSubmitSale} disabled={!productVariantId || !quantity || loading} className="w-full">
              {loading ? "Recording..." : "Record Sale"}
            </Button>
          </div>
        );

      case "giveaway":
        return (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Products</Label>
              {inventory.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.name || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">Available: {item.amount_issued}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => removeProduct(item.product_variant_id)}
                        disabled={!selectedProducts.find(p => p.productVariantId === item.product_variant_id)}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="w-8 text-center">
                        {selectedProducts.find(p => p.productVariantId === item.product_variant_id)?.quantity || 0}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => addProduct(item)}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={giveawayNotes}
                onChange={(e) => setGiveawayNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
              />
            </div>
            <Button onClick={handleSubmitGiveaway} disabled={selectedProducts.length === 0 || loading} className="w-full">
              {loading ? "Recording..." : "Record Giveaway"}
            </Button>
          </div>
        );

      case "interaction":
        return (
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Automatic Engagement Log</p>
              <p className="text-xs text-blue-600 mt-1">
                This will automatically log an "Engaged" interaction for {storeName}
              </p>
            </div>
            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={interactionNotes}
                onChange={(e) => setInteractionNotes(e.target.value)}
                placeholder="Add any additional details about the engagement..."
                rows={3}
              />
            </div>
            <div>
              <Label>Customer Sentiment (Optional)</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSentiment(rating)}
                    className="p-1"
                  >
                    <Star
                      size={32}
                      className={`${
                        rating <= sentiment
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSubmitInteraction} disabled={loading} className="w-full">
              {loading ? "Logging Engagement..." : "Log Engagement"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 size={24} />
            <DialogTitle>Store Added Successfully!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-muted">
            <p className="font-medium">{storeName}</p>
            <p className="text-sm text-muted-foreground">{storeCounty}</p>
          </Card>

          {!activeAction ? (
            <>
              <p className="text-sm text-muted-foreground">Quick Actions for this store:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleActionClick("survey")}
                >
                  <ClipboardList size={24} />
                  <span className="text-xs">Start Survey</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleActionClick("sale")}
                >
                  <ShoppingCart size={24} />
                  <span className="text-xs">Record Sale</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleActionClick("giveaway")}
                >
                  <Gift size={24} />
                  <span className="text-xs">Give Products</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2"
                  onClick={() => handleActionClick("interaction")}
                >
                  <MessageSquare size={24} />
                  <span className="text-xs">Log Interaction</span>
                </Button>
              </div>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setActiveAction(null)}
                className="w-full"
              >
                ← Back to Actions
              </Button>
              {renderActionForm()}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
