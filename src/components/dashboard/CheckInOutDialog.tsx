import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAgentStatus, AgentStatus } from "@/hooks/useAgentStatus";
import { toast } from "sonner";
import { SalesTrackingForm } from "./SalesTrackingForm";

interface CheckInOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckInOutDialog = ({ isOpen, onClose }: CheckInOutDialogProps) => {
  const [status, setStatus] = useState<AgentStatus | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateStatus } = useAgentStatus();

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agent_task_inventory')
        .select(`
          id,
          product_variant_id,
          products:product_variants(name)
        `)
        .eq('agent_id', user.id)
        .eq('is_deleted', false);

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('agent-selfies')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('agent-selfies')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleInitialSubmit = async () => {
    if (!status) {
      toast.error("Please select a status");
      return;
    }

    if (!selectedFile) {
      toast.error("Please upload a selfie");
      return;
    }

    // Show sales form for lunch or checkout
    if (status === "lunch" || status === "checked_out") {
      setShowSalesForm(true);
    } else {
      await processStatusUpdate([]);
    }
  };

  const handleSalesSubmit = async (sales: any[]) => {
    await processStatusUpdate(sales);
  };

  const handleSkipSales = async () => {
    await processStatusUpdate([]);
  };

  const processStatusUpdate = async (sales: any[]) => {
    setIsSubmitting(true);

    try {
      const location = await getCurrentLocation();
      const selfieUrl = await uploadToStorage(selectedFile!);
      
      const result = await updateStatus(
        status as AgentStatus,
        selfieUrl,
        location.lat,
        location.lng
      );

      if (result.success) {
        // Record sales if any
        if (sales.length > 0) {
          await recordSales(sales, status as AgentStatus);
        }
        
        toast.success(result.message);
        onClose();
        setStatus("");
        setSelectedFile(null);
        setShowSalesForm(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error during check-in/out:", error);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const recordSales = async (sales: any[], statusEvent: AgentStatus) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get product prices
      const productIds = sales.map(s => s.product_variant_id);
      const { data: products } = await supabase
        .from('product_variants')
        .select('id, price')
        .in('id', productIds);

      const salesData = sales.map(sale => {
        const product = products?.find(p => p.id === sale.product_variant_id);
        return {
          agent_id: user.id,
          product_variant_id: sale.product_variant_id,
          quantity_sold: sale.quantity,
          total_value: (product?.price || 0) * sale.quantity,
          status_event: statusEvent,
          work_date: new Date().toISOString().split('T')[0]
        };
      });

      const { error } = await supabase
        .from('daily_sales_tracking')
        .insert(salesData);

      if (error) throw error;
    } catch (error) {
      console.error("Error recording sales:", error);
      toast.error("Sales recorded but failed to save to tracking");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {showSalesForm ? "Record Sales" : "Check In/Out"}
          </DialogTitle>
        </DialogHeader>

        {!showSalesForm ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={(value) => setStatus(value as AgentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checked_in">Check In</SelectItem>
                  <SelectItem value="checked_out">Check Out</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Upload Selfie</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <>
                    <Upload size={16} className="mr-2" />
                    {selectedFile.name}
                  </>
                ) : (
                  <>
                    <Camera size={16} className="mr-2" />
                    Take Selfie
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleInitialSubmit}
                disabled={isSubmitting || !status || !selectedFile}
              >
                {isSubmitting ? "Submitting..." : "Continue"}
              </Button>
            </div>
          </div>
        ) : (
          <SalesTrackingForm
            inventory={inventory}
            onSubmit={handleSalesSubmit}
            onSkip={handleSkipSales}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
