import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { EngagementModal } from "@/components/EngagementModal";
import { ArrowLeft, Mic, MicOff, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const products = [
  { id: "1", name: "Solar Panel Kit", price: 5000 },
  { id: "2", name: "LED Light Set", price: 1500 },
  { id: "3", name: "Power Bank", price: 2000 },
];

export const RecordSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEngagementModal, setShowEngagementModal] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    // Start recording timer
    const interval = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    
    // Store interval for cleanup
    (window as any).recordingInterval = interval;
  };

  const stopRecording = () => {
    setIsRecording(false);
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval);
    }
    setRecordingDuration(0);
  };

  const handleCompleteSale = () => {
    if (!selectedProduct || !customerName) {
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
    // Save sale and engagement data
    toast({
      title: "Sale recorded successfully!",
      description: "+25 points earned. Engagement logged.",
    });
    navigate("/");
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const totalAmount = selectedProductData ? selectedProductData.price * parseInt(quantity) : 0;

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
          <h1 className="text-h1">Record a Sale</h1>
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
                        {product.name} - KES {product.price}
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

              {selectedProductData && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    Total: KES {totalAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Customer Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <Label htmlFor="customer-phone">Phone Number</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Recording</h2>
            
            <div className="flex gap-3">
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className="flex-1"
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                <span className="ml-2">
                  {isRecording ? "Stop Recording" : "Start Recording Audio"}
                </span>
              </Button>

              <Button variant="outline" size="icon">
                <Camera size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Complete Sale Button */}
        <Button
          onClick={handleCompleteSale}
          className="w-full h-12 text-lg"
          disabled={!selectedProduct || !customerName}
        >
          Complete Sale
        </Button>
      </div>

      <EngagementModal
        isOpen={showEngagementModal}
        onClose={() => setShowEngagementModal(false)}
        onSave={handleEngagementSave}
        activityType="sale"
      />
    </MobileLayout>
  );
};