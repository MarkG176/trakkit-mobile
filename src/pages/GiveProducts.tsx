import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EngagementModal } from "@/components/EngagementModal";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export const GiveProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
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

  const handleRecordGiveaway = () => {
    if (!selectedProduct) {
      toast({
        title: "Missing Information",
        description: "Please select a product to give away",
        variant: "destructive",
      });
      return;
    }

    const selectedItem = inventory.find(item => item.id === selectedProduct);
    if (selectedItem && selectedItem.amount_issued <= 0) {
      toast({
        title: "Out of Stock",
        description: "This product is not available in your inventory",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      stopRecording();
    }
    
    setShowEngagementModal(true);
  };

  const handleEngagementSave = (engagementData: any) => {
    toast({
      title: "Giveaway recorded successfully!",
      description: "+8 points earned. Engagement logged.",
    });
    navigate("/");
  };

  const selectedProductData = inventory.find(item => item.id === selectedProduct);
  
  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_variant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.products.product.name.toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Side - Product Selection */}
        <div className="flex-1 p-4 border-r">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <span className="text-xs text-white">📦</span>
            </div>
            <h2 className="text-h3 text-black">Select Product</h2>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3"
            />
          </div>

          {/* Product Grid */}
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
            <div className="grid grid-cols-2 gap-4 overflow-y-auto">
              {filteredInventory.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3">
                      <div className="w-12 h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm text-black mb-1">{item.products.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">
                      SKU: {item.product_variant_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Available: {item.amount_issued}
                    </p>
                    <Button
                      size="sm"
                      variant={selectedProduct === item.id ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setSelectedProduct(item.id)}
                      disabled={item.amount_issued <= 0}
                    >
                      {selectedProduct === item.id ? "Selected" : 
                       item.amount_issued <= 0 ? "Out of Stock" : "Select"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Recipient Information */}
        <div className="w-80 p-4 bg-muted/30">
          <h2 className="text-h3 mb-4 text-black">Recipient Information (Optional)</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="recipient-name" className="text-sm">Recipient Name</Label>
              <Input
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter recipient's name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm">Notes</Label>
              <textarea
                id="notes"
                rows={4}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. Given at Central Park event. Product demo at mall..."
              />
            </div>
          </div>

          {/* Record Giveaway Button */}
          <Button
            onClick={handleRecordGiveaway}
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
            disabled={!selectedProduct}
          >
            Record Giveaway
          </Button>
        </div>
      </div>

      <EngagementModal
        isOpen={showEngagementModal}
        onClose={() => setShowEngagementModal(false)}
        onSave={handleEngagementSave}
        activityType="giveaway"
      />
    </MobileLayout>
  );
};