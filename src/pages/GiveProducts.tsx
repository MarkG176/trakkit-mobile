import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EngagementModal } from "@/components/EngagementModal";
import { ArrowLeft, Mic, MicOff, Plus, Minus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  name: string | null;
  product_variant_id: string;
  amount_issued: number;
}

interface SelectedProduct {
  id: string;
  name: string;
  quantity: number;
  maxQuantity: number;
  productVariantId: string;
}

export const GiveProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your inventory.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('agent_task_inventory')
        .select('id, name, product_variant_id, amount_issued')
        .eq('agent_id', user.id)
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching inventory:', error);
        toast({
          title: "Error loading inventory",
          description: "Could not load your assigned inventory.",
          variant: "destructive",
        });
      } else {
        setInventory(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading inventory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const addProduct = (item: InventoryItem) => {
    const existingProduct = selectedProducts.find(p => p.id === item.id);
    
    if (existingProduct) {
      if (existingProduct.quantity < existingProduct.maxQuantity) {
        setSelectedProducts(prev => 
          prev.map(p => 
            p.id === item.id 
              ? { ...p, quantity: p.quantity + 1 }
              : p
          )
        );
      }
    } else {
      setSelectedProducts(prev => [...prev, {
        id: item.id,
        name: item.name || 'Unknown Product',
        quantity: 1,
        maxQuantity: item.amount_issued,
        productVariantId: item.product_variant_id
      }]);
    }
  };

  const removeProduct = (itemId: string) => {
    const existingProduct = selectedProducts.find(p => p.id === itemId);
    
    if (existingProduct) {
      if (existingProduct.quantity > 1) {
        setSelectedProducts(prev => 
          prev.map(p => 
            p.id === itemId 
              ? { ...p, quantity: p.quantity - 1 }
              : p
          )
        );
      } else {
        setSelectedProducts(prev => prev.filter(p => p.id !== itemId));
      }
    }
  };

  const getProductQuantity = (itemId: string) => {
    const product = selectedProducts.find(p => p.id === itemId);
    return product ? product.quantity : 0;
  };

  const handleRecordGiveaway = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to give away",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      stopRecording();
    }
    
    // Submit directly without engagement modal
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current location if available
      let location = { latitude: null, longitude: null };
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (error) {
          console.log('Could not get location:', error);
        }
      }

      // Prepare products data
      const productsGiven = selectedProducts.map(product => ({
        product_variant_id: product.productVariantId,
        product_name: product.name,
        quantity: product.quantity
      }));

      const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);

      // Save to giveaways table
      const { error } = await supabase
        .from('giveaways')
        .insert({
          agent_id: user.id,
          products_given: productsGiven,
          total_items: totalItems,
          recipient_name: recipientName || null,
          recipient_phone: recipientPhone || null,
          notes: notes || null,
          location_lat: location.latitude,
          location_lng: location.longitude,
          workspace_id: currentWorkspaceId,
        });

      if (error) {
        console.error('Error saving giveaway:', error);
        throw error;
      }

      toast({
        title: "Giveaway recorded successfully!",
        description: "+8 points earned.",
      });
      navigate("/");
    } catch (error) {
      console.error('Error saving giveaway:', error);
      toast({
        title: "Error",
        description: "Failed to save giveaway data.",
        variant: "destructive",
      });
    }
  };


  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_variant_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MobileLayout currentPage="dashboard">
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
          <h1 className="text-h1">Give Products</h1>
        </div>
        
        <RecordingIndicator isRecording={isRecording} duration={recordingDuration} />
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Selected Products Summary */}
      {selectedProducts.length > 0 && (
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Selected Products</h3>
            <span className="text-xs text-muted-foreground">
              {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} items
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                <span>{product.name}</span>
                <span className="font-medium">×{product.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading inventory...</div>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground text-center">
              <div className="text-2xl mb-2">📦</div>
              <div>
                {inventory.length === 0 
                  ? "No products in your inventory" 
                  : "No products match your search"}
              </div>
              <div className="text-sm">
                {inventory.length === 0 
                  ? "Contact your supervisor to get products assigned" 
                  : "Try adjusting your search terms"}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filteredInventory.map((item) => {
              const quantity = getProductQuantity(item.id);
              const isSelected = quantity > 0;
              
              return (
                <div key={item.id} className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-2 relative">
                    <span className="text-2xl">📦</span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {quantity}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-xs text-center mb-1 line-clamp-2">{item.name || 'Unknown Product'}</h3>
                  <p className="text-xs text-muted-foreground mb-2 text-center">
                    Available: {item.amount_issued}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-6 h-6 p-0"
                      onClick={() => removeProduct(item.id)}
                      disabled={quantity === 0}
                    >
                      <Minus size={12} />
                    </Button>
                    <span className="text-xs font-medium min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-6 h-6 p-0"
                      onClick={() => addProduct(item)}
                      disabled={quantity >= item.amount_issued}
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Button */}
      <div className="p-4 border-t bg-background">
        <Button
          onClick={handleRecordGiveaway}
          className="w-full h-12 text-lg"
          disabled={selectedProducts.length === 0}
        >
          {selectedProducts.length === 0 
            ? "Select Products to Give Away" 
            : `Record Giveaway (${selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} items)`}
        </Button>
      </div>

    </MobileLayout>
  );
};