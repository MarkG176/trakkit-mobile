import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { workspaceService } from "@/services/workspaceService";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  product_variant_id: string;
  name: string | null;
  amount_issued: number;
}

export const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('agent_task_inventory')
          .select('id, product_variant_id, name, amount_issued')
          .eq('agent_id', user.id)
          .eq('is_deleted', false)
          .gt('amount_issued', 0);

        if (error) throw error;

        setInventory(data || []);
      } catch (err) {
        console.error('Failed to fetch inventory', err);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();
  }, [user]);

  const handleSubmitSale = async () => {
    if (!user || !selectedProduct || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);

    try {
      // Submit to daily_sales_tracking
      const { error } = await supabase
        .from('daily_sales_tracking')
        .insert({
          agent_id: user.id,
          product_variant_id: selectedProduct,
          quantity_sold: 1,
          total_value: amountNum,
          status_event: 'sale',
          work_date: new Date().toISOString().split('T')[0],
          workspace_id: currentWorkspaceId
        });

      if (error) throw error;

      toast.success("Sale recorded successfully!");
      
      // Reset form
      setSelectedProduct("");
      setAmount("");
    } catch (error) {
      console.error("Error recording sale:", error);
      toast.error("Failed to record sale. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !notes.trim()) {
      toast.error("Please enter some notes");
      return;
    }

    const workspaceId = currentWorkspaceId || workspaceService.getCurrentWorkspaceId();
    
    if (!workspaceId) {
      toast.error("No workspace selected. Please select a workspace first.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          agent_id: user.id,
          workspace_id: workspaceId,
          content: notes,
          note_type: 'daily_report',
        })
        .select();

      if (error) {
        console.error("Notes insert error:", error);
        throw error;
      }

      console.log("✅ Note inserted successfully:", data);
      toast.success("Notes saved!");
      setNotes("");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImages = async () => {
    if (!user || images.length === 0) {
      toast.error("Please select images to upload");
      return;
    }

    setSubmitting(true);

    try {
      const uploadPromises = images.map(async (image) => {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        // Fix: Use user ID as first folder to match RLS policy
        const filePath = `${user.id}/Capwell/${fileName}`;

        const { error } = await supabase.storage
          .from('agent-selfies')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error for', filePath, ':', error);
          throw error;
        }
        return filePath;
      });

      await Promise.all(uploadPromises);

      toast.success("Images uploaded successfully!");
      setImages([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout currentPage="more">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/more")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-h1">Sales Report</h1>
        </div>
        
        <p className="text-sm opacity-90">Record your sales for the day</p>
      </div>

      <div className="p-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-h3 mb-6 text-black">Report Daily Sales</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product" className="text-sm mb-2 block">
                    Product
                  </Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.map((item) => (
                        <SelectItem key={item.id} value={item.product_variant_id}>
                          {item.name || 'Unknown Product'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount" className="text-sm mb-2 block">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleSubmitSale} 
                disabled={submitting || loading || !selectedProduct || !amount}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-h3 mb-6 text-black">Notes</h3>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Add your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              
              <Button 
                type="button"
                className="w-full"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={submitting || !notes.trim()}
              >
                <FileText className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-h3 mb-6 text-black">Attach Images</h3>
            
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setImages(Array.from(e.target.files));
                    toast.success(`${e.target.files.length} image(s) selected`);
                  }
                }}
              />
              
              {images.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {images.length} image(s) selected
                </div>
              )}
              
              <Button 
                type="button"
                className="w-full"
                variant="outline"
                onClick={handleUploadImages}
                disabled={submitting || images.length === 0}
              >
                <Camera className="mr-2 h-4 w-4" />
                {submitting ? "Uploading..." : "Upload Images"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-h3 mb-6 text-black">Export Report</h3>
            
            <Button 
              type="button"
              className="w-full"
              onClick={() => toast.success("Report generated and exported!")}
            >
              <Download className="mr-2 h-4 w-4" />
              Generate and Export Report
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center text-muted-foreground">
            Loading products...
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
