import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Gift, ClipboardList, Star, Plus, Minus, CheckCircle2, Trash2, Edit2, Search, Camera, X, ImageIcon, MessageSquare, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { StockReportDialog } from "@/components/attendance/StockReportDialog";

interface StoreSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  storeName: string;
  storeCounty: string;
}

type ActionType = null | "survey" | "sale" | "giveaway" | "feedback";

interface SaleCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productVariantId: string;
}

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

export const StoreSuccessDialog = ({ open, onOpenChange, storeId, storeName, storeCounty }: StoreSuccessDialogProps) => {
  const { toast } = useToast();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);
  const [showStockReport, setShowStockReport] = useState(false);
  const [isPepsiResearch, setIsPepsiResearch] = useState(false);

  // Survey state
  const [selectedSurvey, setSelectedSurvey] = useState("");
  const [surveys, setSurveys] = useState<any[]>([]);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<{ [questionId: string]: any }>({});

  // Sale state
  const [saleCartItems, setSaleCartItems] = useState<SaleCartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingSalePriceId, setEditingSalePriceId] = useState<string | null>(null);
  const [saleSearchTerm, setSaleSearchTerm] = useState("");
  const [showSaleCart, setShowSaleCart] = useState(false);

  // Giveaway state
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [giveawayNotes, setGiveawayNotes] = useState("");

  // Feedback state
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Check if current project is "Pepsi Research"
  useEffect(() => {
    const checkProjectName = async () => {
      if (!currentProjectId || !open) return;
      try {
        const { data } = await supabase
          .from('project_plans')
          .select('project_name')
          .eq('id', currentProjectId)
          .single();
        setIsPepsiResearch(data?.project_name?.toLowerCase() === 'pepsi research');
      } catch {
        setIsPepsiResearch(false);
      }
    };
    checkProjectName();
  }, [currentProjectId, open]);

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
    } else if (action === "sale" || action === "giveaway") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('agent_task_inventory')
          .select('id, product_variant_id, amount_issued, name, product_variants!inner(workspace_id, price)')
          .eq('agent_id', user.id)
          .eq('is_deleted', false)
          .eq('product_variants.workspace_id', currentWorkspaceId);
        
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
          agent_id: user.id,
          interaction_type: 'survey',
          survey_template_id: selectedSurvey,
          store_id: storeId,
          customer_name: storeName,
          outcome: 'completed',
          quantity_sold: 0,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
          workspace_id: currentWorkspaceId
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
          location_lng: location.longitude,
          workspace_id: currentWorkspaceId
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

  const addToSaleCart = (product: any) => {
    const existing = saleCartItems.find(item => item.productVariantId === product.product_variant_id);
    if (existing) {
      setSaleCartItems(saleCartItems.map(item =>
        item.productVariantId === product.product_variant_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSaleCartItems([...saleCartItems, {
        id: product.id,
        name: product.name || 'Unknown Product',
        price: product.product_variants?.price || 0,
        quantity: 1,
        productVariantId: product.product_variant_id
      }]);
    }
  };

  const updateSaleQuantity = (productVariantId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setSaleCartItems(saleCartItems.filter(item => item.productVariantId !== productVariantId));
    } else {
      setSaleCartItems(saleCartItems.map(item =>
        item.productVariantId === productVariantId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const updateSalePrice = (productVariantId: string, newPrice: number) => {
    setSaleCartItems(saleCartItems.map(item =>
      item.productVariantId === productVariantId ? { ...item, price: newPrice } : item
    ));
    setEditingSalePriceId(null);
  };

  const saleTotalAmount = saleCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmitSale = async () => {
    if (saleCartItems.length === 0) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();

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

      const projectId = currentProjectId || null;

      // Record each cart item as a separate interaction + customer purchase
      for (const item of saleCartItems) {
        const { error: interactionError } = await supabase.from('interactions').insert({
          task_id: null,
          agent_id: user.id,
          interaction_type: 'sale',
          store_id: storeId,
          customer_name: storeName,
          product_variant_id: item.productVariantId,
          quantity_sold: item.quantity,
          sale_value: item.price * item.quantity,
          outcome: 'completed',
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
          workspace_id: currentWorkspaceId
        } as any);

        if (interactionError) throw interactionError;

        await supabase.from('customer_purchases').insert({
          customer_id: customer.id,
          agent_id: user.id,
          product_variant_id: item.productVariantId,
          quantity: item.quantity,
          total_value: item.price * item.quantity,
          location_lat: location.latitude,
          location_lng: location.longitude,
          workspace_id: currentWorkspaceId,
          project_id: projectId,
        } as any);
      }

      toast({
        title: "Sale Recorded",
        description: `${saleCartItems.length} item(s) recorded. Total: KES ${saleTotalAmount.toFixed(2)}`,
      });
      
      // Reset and return to actions
      setActiveAction(null);
      setSaleCartItems([]);
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
        store_id: storeId,
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
        recorded_at: new Date().toISOString(),
        workspace_id: currentWorkspaceId
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

  const handlePhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedPhotos(prev => [...prev, ...files]);
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(prev => [...prev, ...newUrls]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadFeedback = async () => {
    if (!feedbackNotes.trim() && selectedPhotos.length === 0) return;
    setUploadingPhotos(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();

      // Upload photos if any
      if (selectedPhotos.length > 0) {
        for (const file of selectedPhotos) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('sale-photos')
            .upload(fileName, file, { contentType: file.type });
          if (uploadError) throw uploadError;
        }
      }

      // Record feedback as interaction
      if (feedbackNotes.trim()) {
        await supabase.from('interactions').insert({
          task_id: null,
          agent_id: user.id,
          interaction_type: 'engagement',
          store_id: storeId,
          customer_name: storeName,
          outcome: 'completed',
          quantity_sold: 0,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
          workspace_id: currentWorkspaceId,
          metadata: { feedback_notes: feedbackNotes }
        } as any);
      }

      toast({
        title: "Feedback Submitted",
        description: `Feedback${selectedPhotos.length > 0 ? ` and ${selectedPhotos.length} photo(s)` : ''} recorded for ${storeName}.`,
      });

      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedPhotos([]);
      setPhotoPreviewUrls([]);
      setFeedbackNotes("");
      setActiveAction(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhotos(false);
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

  const updateProductQuantity = (item: InventoryItem, newQuantity: number) => {
    const clampedQuantity = Math.max(0, Math.min(newQuantity, item.amount_issued));
    
    if (clampedQuantity === 0) {
      setSelectedProducts(selectedProducts.filter(p => p.productVariantId !== item.product_variant_id));
    } else {
      const existing = selectedProducts.find(p => p.productVariantId === item.product_variant_id);
      if (existing) {
        setSelectedProducts(selectedProducts.map(p =>
          p.productVariantId === item.product_variant_id
            ? { ...p, quantity: clampedQuantity }
            : p
        ));
      } else {
        setSelectedProducts([...selectedProducts, {
          id: item.id,
          name: item.name || 'Unknown Product',
          quantity: clampedQuantity,
          maxQuantity: item.amount_issued,
          productVariantId: item.product_variant_id
        }]);
      }
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
                    <CardContent className="p-6">
                      <div className="flex items-start gap-2 mb-4">
                        <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h2 className="text-h3 text-black mb-1">
                            {question.text || question.question || question.title || question.label || `Question ${index + 1}`}
                          </h2>
                          {question.description && (
                            <p className="text-xs text-muted-foreground mb-1">{question.description}</p>
                          )}
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
                ))}
                
                <Button onClick={handleSubmitSurvey} disabled={loading} className="w-full">
                  {loading ? "Submitting..." : "Submit Survey"}
                </Button>
              </div>
            )}
          </div>
        );

      case "sale":
        const filteredSaleProducts = products.filter(p =>
          (p.name || '').toLowerCase().includes(saleSearchTerm.toLowerCase())
        );
        return (
          <div className="space-y-4 mt-4">
            {!showSaleCart ? (
              <>
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Search products..."
                    value={saleSearchTerm}
                    onChange={(e) => setSaleSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Product List */}
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {filteredSaleProducts.map((product) => (
                    <Card key={product.product_variant_id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                            <ShoppingCart size={16} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name || 'Unknown Product'}</p>
                            <p className="text-xs text-muted-foreground">Available: {product.amount_issued}</p>
                            {product.product_variants?.price > 0 && (
                              <p className="text-xs font-medium text-primary">KES {product.product_variants.price}</p>
                            )}
                          </div>
                          <div className="flex items-center">
                            <Button size="sm" onClick={() => { addToSaleCart(product); setShowSaleCart(true); }}>
                              <Plus size={14} className="mr-1" /> Add
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Cart indicator */}
                {saleCartItems.length > 0 && (
                  <Button onClick={() => setShowSaleCart(true)} className="w-full">
                    View Cart ({saleCartItems.reduce((s, i) => s + i.quantity, 0)} items) • KES {saleTotalAmount.toFixed(2)}
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Sale Items Cart View */}
                <div>
                  <h3 className="text-lg font-bold">Sale Items</h3>
                  <div className="flex justify-between items-center text-xl font-bold mt-1">
                    <span>Total:</span>
                    <span>KES {saleTotalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {saleCartItems.map((item) => (
                    <div key={item.productVariantId} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingCart size={14} className="text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        {editingSalePriceId === item.productVariantId ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">KES</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={item.price}
                              onBlur={(e) => updateSalePrice(item.productVariantId, parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateSalePrice(item.productVariantId, parseFloat((e.target as HTMLInputElement).value) || 0);
                                }
                              }}
                              autoFocus
                              className="w-24 h-7 text-sm p-1"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-muted-foreground">KES {item.price}</p>
                            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingSalePriceId(item.productVariantId)}>
                              <Edit2 size={10} />
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateSaleQuantity(item.productVariantId, item.quantity - 1)}>
                          <Minus size={14} />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateSaleQuantity(item.productVariantId, parseInt(e.target.value) || 1)}
                          className="w-12 h-8 text-center p-0 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateSaleQuantity(item.productVariantId, item.quantity + 1)}>
                          <Plus size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Product button */}
                <Button variant="outline" onClick={() => setShowSaleCart(false)} className="w-full">
                  <Plus size={16} className="mr-2" /> Add Product
                </Button>

                <Button onClick={handleSubmitSale} disabled={saleCartItems.length === 0 || loading} className="w-full">
                  {loading ? "Recording..." : `Record Sale • KES ${saleTotalAmount.toFixed(2)}`}
                </Button>
              </>
            )}
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
                      <Input
                        type="number"
                        min={0}
                        max={item.amount_issued}
                        value={selectedProducts.find(p => p.productVariantId === item.product_variant_id)?.quantity || 0}
                        onChange={(e) => updateProductQuantity(item, parseInt(e.target.value) || 0)}
                        className="w-16 text-center h-9"
                      />
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

      case "feedback":
        return (
          <div className="space-y-4 mt-4">
            <div>
              <Label>Feedback Notes</Label>
              <Textarea
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Enter feedback about this store..."
                rows={3}
              />
            </div>

            {/* Add Photos Section */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Camera size={16} />
                Add Photos
              </Label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={handlePhotosSelected}
              />

              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
                className="w-full h-16 border-dashed flex flex-col gap-1"
              >
                <Camera size={20} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {photoPreviewUrls.length > 0 ? "Add More Photos" : "Take or Select Photos"}
                </span>
              </Button>
            </div>

            <Button
              onClick={handleUploadFeedback}
              disabled={(!feedbackNotes.trim() && selectedPhotos.length === 0) || uploadingPhotos}
              className="w-full"
            >
              {uploadingPhotos ? "Submitting..." : "Submit Feedback"}
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
                  onClick={() => handleActionClick("feedback")}
                >
                  <MessageSquare size={24} />
                  <span className="text-xs">Collect Feedback</span>
                </Button>
                {isPepsiResearch && (
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => setShowStockReport(true)}
                  >
                    <Package size={24} />
                    <span className="text-xs">Stock Report</span>
                  </Button>
                )}
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

      {/* Stock Report Dialog for Pepsi Research */}
      <StockReportDialog
        open={showStockReport}
        onOpenChange={setShowStockReport}
        reportType="morning"
        storeId={storeId}
        onComplete={() => {
          setShowStockReport(false);
        }}
      />
    </Dialog>
  );
};
