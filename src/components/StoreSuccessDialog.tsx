import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Gift, MessageSquare, ClipboardList, Star, Plus, Minus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface StoreSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  storeCounty: string;
}

type ActionType = null | "survey" | "sale" | "giveaway" | "interaction";

const interactionTypes = [
  "General Meeting",
  "Consultation",
  "Information Sharing",
  "Follow-up Call",
  "Site Visit",
  "Customer Feedback"
];

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
  products: {
    product_id: string;
    name: string;
    price: number;
    product: {
      name: string;
      description: string;
      category: string;
    };
  };
}

export const StoreSuccessDialog = ({ open, onOpenChange, storeName, storeCounty }: StoreSuccessDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);

  // Survey state
  const [selectedSurvey, setSelectedSurvey] = useState("");
  const [surveys, setSurveys] = useState<any[]>([]);

  // Sale state
  const [productVariantId, setProductVariantId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [products, setProducts] = useState<any[]>([]);

  // Giveaway state
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [giveawayNotes, setGiveawayNotes] = useState("");

  // Interaction state
  const [interactionType, setInteractionType] = useState("");
  const [interactionNotes, setInteractionNotes] = useState("");
  const [sentiment, setSentiment] = useState(0);

  const handleActionClick = async (action: ActionType) => {
    setActiveAction(action);
    
    // Load data based on action
    if (action === "survey") {
      const { data } = await supabase.from('survey_templates').select('*');
      setSurveys(data || []);
    } else if (action === "sale") {
      const { data } = await supabase.from('product_variants').select('*, product:product_id(name, category)');
      setProducts(data || []);
    } else if (action === "giveaway") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('agent_task_inventory')
          .select(`
            id,
            product_variant_id,
            amount_issued,
            products:product_variant_id (
              product_id,
              name,
              price,
              product:product_id (
                name,
                description,
                category
              )
            )
          `)
          .eq('agent_id', user.id)
          .eq('is_deleted', false);
        setInventory(data || []);
      }
    }
  };

  const handleSubmitSurvey = async () => {
    if (!selectedSurvey) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();

      const { error } = await supabase.from('interactions').insert({
        task_id: null,
        interaction_type: 'survey',
        survey_template_id: selectedSurvey,
        customer_name: storeName,
        outcome: 'completed',
        quantity_sold: 0,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      } as any);

      if (error) throw error;

      toast({
        title: "Survey Logged",
        description: "Survey has been recorded successfully.",
      });
      
      onOpenChange(false);
      navigate("/");
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
      
      onOpenChange(false);
      navigate("/");
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
      
      onOpenChange(false);
      navigate("/");
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
    if (!interactionType) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const location = await getCurrentLocation();

      const { error } = await supabase.from('interactions').insert({
        task_id: null,
        interaction_type: interactionType,
        customer_name: storeName,
        outcome: 'completed',
        quantity_sold: 0,
        metadata: { notes: interactionNotes, sentiment },
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      } as any);

      if (error) throw error;

      toast({
        title: "Interaction Logged",
        description: "Interaction has been recorded successfully.",
      });
      
      onOpenChange(false);
      navigate("/");
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
        name: item.products?.product?.name || item.products?.name || 'Unknown Product',
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
            <div>
              <Label>Select Survey</Label>
              <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
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
            <Button onClick={handleSubmitSurvey} disabled={!selectedSurvey || loading} className="w-full">
              {loading ? "Submitting..." : "Submit Survey"}
            </Button>
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
                    <SelectItem key={product.id} value={product.id}>
                      {product.product?.name} - {product.name}
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
                      <p className="font-medium">{item.products?.product?.name || item.products?.name}</p>
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
            <div>
              <Label>Interaction Type</Label>
              <Select value={interactionType} onValueChange={setInteractionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {interactionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={interactionNotes}
                onChange={(e) => setInteractionNotes(e.target.value)}
                placeholder="Add details..."
                rows={3}
              />
            </div>
            <div>
              <Label>Customer Sentiment</Label>
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
            <Button onClick={handleSubmitInteraction} disabled={!interactionType || loading} className="w-full">
              {loading ? "Saving..." : "Save Interaction"}
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
