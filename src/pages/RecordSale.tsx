// [CMP-5e6401] RecordSale — record sale transaction flow
import { useState, useEffect, useCallback, useRef } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, Trash2, Edit2, Camera, X, CheckCircle } from "lucide-react";
import { ImageCaptionInput } from "@/components/ImageCaptionInput";
import { useNavigate } from "react-router-dom";
import { useSalesForm } from "@/hooks/useSalesForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { workspaceService } from "@/services/workspaceService";
import { useInStoreWorkLocation } from "@/hooks/useInStoreWorkLocation";
import { useProjectComponents } from "@/hooks/useProjectComponents";
import { useInventory, InventoryItem } from "@/hooks/useInventory";
import { SaleFeedbackDialog, FeedbackData } from "@/components/dashboard/SaleFeedbackDialog";
import { useToast } from "@/hooks/use-toast";
import { formatProductName } from "@/utils/formatProductName";
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Cache key for storing custom prices
const CUSTOM_PRICES_CACHE_KEY = 'wholesale_custom_prices';

// Helper to get cached prices
const getCachedPrices = (): Record<string, number> => {
  try {
    const cached = localStorage.getItem(CUSTOM_PRICES_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

// Helper to save price to cache
const savePriceToCache = (productId: string, price: number) => {
  const cached = getCachedPrices();
  cached[productId] = price;
  localStorage.setItem(CUSTOM_PRICES_CACHE_KEY, JSON.stringify(cached));
};

export const RecordSale = () => {
  const navigate = useNavigate();
  const { submitSale, loading: submitting } = useSalesForm();
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const isSalePhotoRequired = isEnabled('CRM-0034P');
  const canOverridePrice = isEnabled('CRM-0034C');
  const { inventory, loading } = useInventory();
  const hideInventoryCounts = useInStoreWorkLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [pendingSaleData, setPendingSaleData] = useState<{
    totalAmount: number;
    itemCount: number;
    customerName: string;
  } | null>(null);

  // Wholesale photo capture state
  const [salePhotoUrl, setSalePhotoUrl] = useState<string | null>(null);
  const [salePhotoCaption, setSalePhotoCaption] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWholesale = isSalePhotoRequired || canOverridePrice;

  // Get price for a product, using cached price for wholesale
  const getProductPrice = useCallback((item: InventoryItem): number => {
    if (canOverridePrice) {
      const cached = getCachedPrices();
      if (cached[item.product_variant_id] !== undefined) {
        return cached[item.product_variant_id];
      }
    }
    return item.price || 0;
  }, [canOverridePrice]);

  const addToCart = (item: InventoryItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.product_variant_id);
    const itemPrice = getProductPrice(item);
    
    if (existingItem) {
      setCartItems(cartItems.map(cartItem => 
        cartItem.id === item.product_variant_id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, { 
        id: item.product_variant_id, 
        name: formatProductName(item.name, item.sku), 
        price: itemPrice, 
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

  const updatePrice = (id: string, newPrice: number) => {
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, price: newPrice } : item
    ));
    if (canOverridePrice) {
      savePriceToCache(id, newPrice);
    }
    setEditingPriceId(null);
  };

  // Upload sale photo to storage
  const uploadSalePhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    setIsUploadingPhoto(true);
    try {
      const workspaceName = workspaceService.getWorkspaceName();
      const projectName = await workspaceService.getProjectNameAsync();
      
      // Create folder structure: workspaceName/projectName/userId/timestamp
      let folderPath = '';
      
      if (workspaceName && workspaceName !== 'Unknown Workspace') {
        const sanitizedWorkspaceName = workspaceName.replace(/[^a-zA-Z0-9-_]/g, '_');
        folderPath += sanitizedWorkspaceName;
      } else {
        folderPath = user.id;
      }
      
      if (projectName && projectName !== 'No Project') {
        const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
        folderPath += `/${sanitizedProjectName}`;
      }
      
      folderPath += `/${user.id}`;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${folderPath}/sale_${timestamp}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('sale-photos')
        .upload(fileName, file);
      
      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: "Could not upload sale photo. Please try again.",
          variant: "destructive"
        });
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('sale-photos')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading sale photo:', error);
      return null;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle photo capture
  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    const photoUrl = await uploadSalePhoto(file);
    if (photoUrl) {
      setSalePhotoUrl(photoUrl);
      toast({
        title: "Photo Captured",
        description: "Sale photo uploaded successfully.",
      });
    }
  };

  // Remove captured photo
  const removeSalePhoto = () => {
    setSalePhotoUrl(null);
    setSalePhotoCaption("");
  };

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      return;
    }
    
    // For wholesale, require photo before proceeding
    if (isSalePhotoRequired && !salePhotoUrl) {
      toast({
        title: "Photo Required",
        description: "Please capture a photo of the sale before completing.",
        variant: "destructive"
      });
      return;
    }
    
    // Store sale data and show feedback dialog
    setPendingSaleData({
      totalAmount: totalAmount,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      customerName: customerName || 'Customer',
    });
    setShowCustomerInfo(false);
    setShowFeedbackDialog(true);
  };

  const processSaleWithFeedback = async (feedbackData: FeedbackData) => {
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

      // Create or update customer record
      let customerId: string | null = null;
      if (customerName && customerPhone) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customerPhone)
          .maybeSingle();

        if (existingCustomer) {
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
      } else {
        // Create anonymous customer so purchase can still be recorded
        const { data: anonCustomer } = await supabase
          .from('customers')
          .insert({
            name: customerName || 'Walk-in Customer',
            phone: customerPhone || null,
            location_lat: location.latitude,
            location_lng: location.longitude,
            workspace_id: currentWorkspaceId
          })
          .select()
          .single();
        customerId = anonCustomer?.id;
      }

      // Submit sale with feedback data
      const success = await submitSale({
        items: cartItems.map(item => ({
          productVariantId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        customerName,
        customerPhone,
        customerEmail,
        engagementType: feedbackData.engagementType,
        notes: feedbackData.notes,
        sentiment: feedbackData.sentiment,
        imageUrl: salePhotoUrl || undefined,
        ...(salePhotoCaption ? {
          imageMetadata: { caption: salePhotoCaption, type: 'sale_photo' }
        } : {})
      });

      // Record customer purchases (even if no customer was created)
      if (success) {
        const projectId = currentProjectId || null;

        // 3️⃣ Insert purchases
        for (const item of cartItems) {
          await supabase
            .from('customer_purchases')
            .insert({
              customer_id: customerId,
              customer_name: customerName || 'Walk-in Customer',
              agent_id: user?.id ?? null,
              product_variant_id: item.id,
              quantity: item.quantity,
              total_value: item.price * item.quantity,
              location_lat: location.latitude,
              location_lng: location.longitude,
              workspace_id: currentWorkspaceId,
              project_id: projectId,
            } as any);
        }
      }

      if (success) {
        setShowFeedbackDialog(false);
        navigate("/");
      }
    } catch (error) {
      console.error('Error completing sale:', error);
    }
  };

  const handleFeedbackSubmit = async (feedbackData: FeedbackData) => {
    await processSaleWithFeedback(feedbackData);
  };

  const handleFeedbackSkip = async () => {
    await processSaleWithFeedback({
      engagementType: 'direct',
      notes: '',
      sentiment: 0
    });
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
                        <h3 className="font-medium text-base break-words whitespace-normal leading-snug">{formatProductName(item.name, item.sku)}</h3>
                        {!hideInventoryCounts && (
                          <p className="text-sm text-muted-foreground">Available: {item.amount_issued}</p>
                        )}
                        {item.price > 0 && (
                          <p className="text-sm font-medium text-primary">KES {item.price}</p>
                        )}
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
                  {isWholesale && editingPriceId === item.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">KES</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={item.price}
                        onBlur={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updatePrice(item.id, parseFloat((e.target as HTMLInputElement).value) || 0);
                          }
                        }}
                        autoFocus
                        className="w-24 h-7 text-sm p-1"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">KES {item.price}</p>
                      {isWholesale && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setEditingPriceId(item.id)}
                        >
                          <Edit2 size={12} />
                        </Button>
                      )}
                    </div>
                  )}
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
                  <Minus size={14} />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowCart(false)}
              className="w-full h-10"
            >
              <Plus size={16} className="mr-2" /> Add Product
            </Button>
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
        <SheetContent side="bottom" className="h-[75vh]">
          <SheetHeader>
            <SheetTitle className="text-left">Customer Information</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-4 overflow-y-auto max-h-[45vh]">
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

            {/* Wholesale Photo Capture Section */}
            {isWholesale && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Camera size={16} />
                  Sale Photo <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Required: Take a photo of the sale for verification
                </p>
                
                {salePhotoUrl ? (
                  <div className="relative">
                    <img 
                      src={salePhotoUrl} 
                      alt="Sale photo" 
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white"
                        disabled
                      >
                        <CheckCircle size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={removeSalePhoto}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    <div className="mt-2">
                      <ImageCaptionInput
                        value={salePhotoCaption}
                        onChange={setSalePhotoCaption}
                        placeholder="Add a caption for this sale photo..."
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      isUploadingPhoto ? 'bg-muted' : 'hover:bg-muted/50 border-primary/50'
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Camera size={32} className="text-primary mb-2" />
                        <p className="text-sm font-medium">Tap to capture photo</p>
                        <p className="text-xs text-muted-foreground">Take a photo of the sale</p>
                      </>
                    )}
                  </div>
                )}
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleCompleteSale}
              disabled={isWholesale && !salePhotoUrl}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isWholesale && !salePhotoUrl ? (
                'Photo Required to Complete'
              ) : (
                `Complete Sale • KES ${totalAmount.toFixed(2)}`
              )}
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

      {/* Feedback Dialog */}
      {pendingSaleData && (
        <SaleFeedbackDialog
          open={showFeedbackDialog}
          onOpenChange={setShowFeedbackDialog}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleFeedbackSkip}
          totalAmount={pendingSaleData.totalAmount}
          itemCount={pendingSaleData.itemCount}
          customerName={pendingSaleData.customerName}
        />
      )}

    </MobileLayout>
  );
};