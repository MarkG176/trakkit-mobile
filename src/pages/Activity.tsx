import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const Activity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [action, setAction] = useState<string>("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTakePhoto = () => {
    const input = document.getElementById('photo-input') as HTMLInputElement;
    input?.click();
  };

  const handleUpload = () => {
    const input = document.getElementById('upload-input') as HTMLInputElement;
    input?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelfieFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true }
      );
    });
  };

  const handleSubmit = async () => {
    if (!action) {
      toast({
        title: "Error",
        description: "Please select an action",
        variant: "destructive",
      });
      return;
    }

    if (!selfieFile) {
      toast({
        title: "Error",
        description: "Please upload a selfie",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      // Get current location
      const location = await getCurrentLocation();

      // Upload selfie to Supabase storage
      const fileName = `${user.id}-${Date.now()}.${selfieFile.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-selfies')
        .upload(fileName, selfieFile);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded selfie
      const { data: { publicUrl } } = supabase.storage
        .from('agent-selfies')
        .getPublicUrl(fileName);

      // Insert into agent_status_log table
      const { error: logError } = await supabase
        .from('agent_status_log')
        .insert({
          agent_id: user.id,
          status: action.toLowerCase().replace(' ', '_'),
          location_lat: location.lat,
          location_lng: location.lng,
          selfie_url: publicUrl,
          timestamp: new Date().toISOString(),
        });

      if (logError) throw logError;

      toast({
        title: "Success",
        description: `${action} recorded successfully`,
      });

      // Reset form
      setAction("");
      setSelfieFile(null);
      setPreviewUrl("");
      
      // Navigate back or to dashboard
      navigate(-1);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <MobileLayout currentPage="dashboard">
      <div className="bg-background min-h-screen p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-h1">Record Attendance</h1>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X size={24} />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Action Dropdown */}
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Check In">Check In</SelectItem>
                  <SelectItem value="Check Out">Check Out</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selfie Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Selfie</label>
              
              {/* Preview or Upload Area */}
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Selfie preview" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelfieFile(null);
                      setPreviewUrl("");
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-4 text-muted-foreground">
                      <Camera size={32} />
                      <Upload size={32} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drag & Drop Image or Click to Upload
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTakePhoto}
                      >
                        <Camera size={16} className="mr-2" />
                        Take Photo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUpload}
                      >
                        <Upload size={16} className="mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                id="upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !action || !selfieFile}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
