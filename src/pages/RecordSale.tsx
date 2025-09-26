import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EngagementModal } from "@/components/EngagementModal";
import { ArrowLeft, Search, ShoppingCart, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const products = [
  { id: "1", name: "Premium Coffee Blend", sku: "SKU-PCB-001", price: 24.99 },
  { id: "2", name: "Organic Green Tea", sku: "SKU-OGT-002", price: 18.50 },
  { id: "3", name: "Energy Drink Mix", sku: "SKU-EDM-003", price: 12.75 },
  { id: "4", name: "Herbal Tea Set", sku: "SKU-HTS-004", price: 32.00 },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const RecordSale = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showEngagementModal, setShowEngagementModal] = useState(false);

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }]);
    }
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

  const handleCompleteSale = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart",
        variant: "destructive",
      });
      return;
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Side - Product Selection */}
        <div className="flex-1 p-4 border-r">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={20} />
            <h2 className="text-h3 text-black">Select Products</h2>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3 overflow-y-auto">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2">
                    <ShoppingCart size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-sm text-black">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                  <p className="text-sm font-semibold text-primary">KES {product.price}</p>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Side - Sale Items & Customer Info */}
        <div className="w-80 p-4 bg-muted/30">
          <h2 className="text-h3 mb-4 text-black">Sale Items</h2>
          
          {/* Cart Items */}
          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-background p-3 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-black">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">KES {item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={12} />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={12} />
                  </Button>
                </div>
                <p className="text-sm font-semibold ml-2 text-black">
                  KES {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center text-lg font-semibold text-black">
              <span>Total:</span>
              <span>KES {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 mb-6">
            <h3 className="text-h3 text-black">Customer Information (Optional)</h3>
            
            <div>
              <Label htmlFor="customer-name" className="text-sm">Customer Name</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="customer-phone" className="text-sm">Phone Number</Label>
              <Input
                id="customer-phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="customer-email" className="text-sm">Email Address</Label>
              <Input
                id="customer-email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>
          </div>

          {/* Complete Sale Button */}
          <Button
            onClick={handleCompleteSale}
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
            disabled={cartItems.length === 0}
          >
            Complete Sale • KES {totalAmount.toFixed(2)}
          </Button>
        </div>
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