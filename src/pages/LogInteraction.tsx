import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RecordingIndicator } from "@/components/RecordingIndicator";
import { ArrowLeft, Mic, MicOff, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInteractionForm } from "@/hooks/useInteractionForm";

export const LogInteraction = () => {
  const navigate = useNavigate();
  const { submitInteraction, loading } = useInteractionForm();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sentiment, setSentiment] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

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

  const handleSaveInteraction = async () => {
    if (!customerName) {
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    const success = await submitInteraction({
      interactionType: "Engaged",
      customerName,
      customerPhone,
      notes,
      sentiment,
    });

    if (success) {
      navigate("/");
    }
  };

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
          <h1 className="text-h1">Log Interaction</h1>
        </div>
        
        <RecordingIndicator isRecording={isRecording} duration={recordingDuration} />
      </div>

      <div className="p-4 space-y-6">
        {/* Interaction Type */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Interaction Details</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Interaction Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add details about the interaction..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
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

        {/* Customer Sentiment */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Customer Sentiment</h2>
            
            <div className="flex gap-1">
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
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-h3 mb-4 text-black">Recording</h2>
            
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

        {/* Save Interaction Button */}
        <Button
          onClick={handleSaveInteraction}
          className="w-full h-12 text-lg"
          disabled={!customerName || loading}
        >
          {loading ? "Saving..." : "Save Interaction"}
        </Button>
      </div>
    </MobileLayout>
  );
};