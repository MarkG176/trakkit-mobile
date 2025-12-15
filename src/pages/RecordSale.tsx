import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSalesForm } from "@/hooks/useSalesForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string | null;
  product_variant_id: string;
  amount_issued: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const RecordSale = () => {
  const navigate = useNavigate();
  const { submitSale, loading: submitting } = useSalesForm();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_task_inventory')
        .select('id, name, product_variant_id, amount_issued')
        .eq('agent_id', user.id)
        .eq('is_deleted', false);

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: InventoryItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.product_variant_id);
    if (existingItem) {
      setCartItems(cartItems.map(cartItem => 
        cartItem.id === item.product_variant_id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, { 
        id: item.product_variant_id, 
        name: item.name || 'Unknown Product', 
        price: 0, 
        quantity: 1 
      }]);
    }
    setShowCart(true);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      return;
    }
    
    try {
      // Get current location
      let location = { latitude: null, longitude: null };
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (error) {
          console.log('Could not get location:', error);
        }
      }

      // Create or update customer record if customer info provided
      let customerId = null;
      if (customerName && customerPhone) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customerPhone)
          .maybeSingle();

        if (existingCustomer) {
          // Update existing customer
          await supabase
            .from('customers')
            .update({
              name: customerName,
              location_lat: location.latitude,
              location_lng: location.longitude,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingCustomer.id);
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              name: customerName,
              phone: customerPhone,
              location_lat: location.latitude,
              location_lng: location.longitude,
              workspace_id: currentWorkspaceId
            })
            .select()
            .single();
          customerId = newCustomer?.id;
        }
      }

      // Submit sale with customer tracking
      const success = await submitSale({
        items: cartItems.map(item => ({
          productVariantId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        customerName,
        customerPhone,
        customerEmail,
        engagementType: 'direct',
        notes: '',
        sentiment: 0
      });

      // Record customer purchases if customer was created
      if (success && customerId) {
        for (const item of cartItems) {
          await supabase
            .from('customer_purchases')
            .insert({
              customer_id: customerId,
              agent_id: user?.id,
              product_variant_id: item.id,
              quantity: item.quantity,
              total_value: item.price * item.quantity,
              location_lat: location.latitude,
              location_lng: location.longitude,
              workspace_id: currentWorkspaceId
            });
        }
      }

      if (success) {
        navigate("/");
      }
    } catch (error) {
      console.error('Error completing sale:', error);
    }
  };

  const handleEngagementSave = async (engagementData: any) => {
    const success = await submitSale({
      items: cartItems.map(item => ({
        productVariantId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      customerName,
      customerPhone,
      customerEmail,
      engagementType: engagementData.engagementType,
      notes: engagementData.notes,
      sentiment: engagementData.sentiment
    });

    if (success) {
      navigate("/");
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_variant_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <MobileLayout currentPage="dashboard">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">Record a Sale</h1>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Search Bar */}
        <div className="p-4 bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto px-4 pb-20">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Loading inventory...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No products in inventory</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInventory.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingCart size={24} className="text-muted-foreground" />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base">{item.name || 'Unknown Product'}</h3>
                        <p className="text-sm text-muted-foreground">Available: {item.amount_issued}</p>
                      </div>

                      {/* Add Button */}
                      <div className="flex items-center">
                        <Button
                          onClick={() => addToCart(item)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          + Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => setShowCart(true)}
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            size="icon"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 text-xs flex items-center justify-center">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </Button>
        </div>
      )}

      {/* Persistent Complete Sale Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-40">
          <Button
            onClick={() => setShowCart(true)}
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
          >
            Complete Sale • KES {totalAmount.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle className="text-left">Sale Items</SheetTitle>
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>KES {totalAmount.toFixed(2)}</span>
            </div>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 overflow-y-auto max-h-[40vh]">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center">
                  <ShoppingCart size={16} className="text-muted-foreground" />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">KES {item.price}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={12} />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQty = parseInt(e.target.value) || 1;
                      updateQuantity(item.id, newQty);
                    }}
                    className="w-16 h-8 text-center p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={12} />
                  </Button>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => updateQuantity(item.id, 0)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <Button
              onClick={() => {
                setShowCart(false);
                setShowCustomerInfo(true);
              }}
              className="w-full h-12 bg-primary hover:bg-primary/90"
            >
              Continue to Customer Info
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showCustomerInfo} onOpenChange={setShowCustomerInfo}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle className="text-left">Customer Information</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="customer-name" className="text-sm font-medium">Customer Name</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="customer-phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="customer-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                className="mt-2"
              />
            </div>

          </div>

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleCompleteSale}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
            >
              Complete Sale • KES {totalAmount.toFixed(2)}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCustomerInfo(false)}
              className="w-full h-12"
            >
              Back to Cart
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </MobileLayout>
  );
};