import { useState } from "react";
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

const products = [
  { id: "1", name: "Solar Panel Kit", price: 5000 },
  { id: "2", name: "LED Light Set", price: 1500 },
  { id: "3", name: "Power Bank", price: 2000 },
  { id: "4", name: "Sample Brochure", price: 0 },
];

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
    if (!selectedProduct || !recipientName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
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

  const selectedProductData = products.find(p => p.id === selectedProduct);

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
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="pl-3"
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-4 overflow-y-auto">
            {products.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3">
                    <div className="w-12 h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  </div>
                  <h3 className="font-medium text-sm text-black mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    SKU: {product.id.padStart(6, '0')}
                  </p>
                  <Button
                    size="sm"
                    variant={selectedProduct === product.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    {selectedProduct === product.id ? "Selected" : "Select"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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