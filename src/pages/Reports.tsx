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
import { toast } from "sonner";

interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchProductVariants = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        // Fetch all product variants
        const { data: variants, error } = await supabase
          .from('product_variants')
          .select('id, name, price')
          .order('name');

        if (error) throw error;

        setProductVariants(variants || []);
      } catch (err) {
        console.error('Failed to fetch product variants', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductVariants();
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
          work_date: new Date().toISOString().split('T')[0]
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
                      {productVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.name}
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
            <h3 className="text-h3 mb-6 text-black">Report Notes</h3>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Add your report notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              
              <Button 
                className="w-full"
                variant="outline"
                onClick={() => toast.success("Notes saved!")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Save Notes
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
                className="w-full"
                variant="outline"
                onClick={() => toast.success("Images uploaded!")}
              >
                <Camera className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-h3 mb-6 text-black">Export Report</h3>
            
            <Button 
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
