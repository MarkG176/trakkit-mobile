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

      <div className="p-4 space-y-6">
        {/* Product Selection */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Select Product & Quantity</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                        {product.price > 0 && ` - KES ${product.price}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipient Information */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Recipient Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient-name">Recipient Name *</Label>
                <Input
                  id="recipient-name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter recipient name"
                />
              </div>

              <div>
                <Label htmlFor="recipient-phone">Phone Number</Label>
                <Input
                  id="recipient-phone"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optional Recording */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Optional Recording</h2>
            
            <Button
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              className="w-full"
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              <span className="ml-2">
                {isRecording ? "Stop Recording" : "Start Recording Audio"}
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Record Giveaway Button */}
        <Button
          onClick={handleRecordGiveaway}
          className="w-full h-12 text-lg"
          disabled={!selectedProduct || !recipientName}
        >
          Record Giveaway
        </Button>
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