import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Gift, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  stock: number;
  unitPrice: number;
  description: string;
  category: string;
}

const inventoryData: Product[] = [
  { id: "1", name: "Premium Widget A", stock: 12, unitPrice: 89.99, description: "High-quality widget for professional use", category: "Widgets" },
  { id: "2", name: "Standard Tool B", stock: 8, unitPrice: 45.50, description: "Versatile tool for everyday tasks", category: "Tools" },
  { id: "3", name: "Deluxe Kit C", stock: 3, unitPrice: 129.99, description: "Complete starter kit with accessories", category: "Kits" },
  { id: "4", name: "Basic Component D", stock: 25, unitPrice: 12.99, description: "Essential component for basic operations", category: "Components" },
];

export const Inventory = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (selectedProduct) {
    return (
      <MobileLayout currentPage="inventory">
        <div className="min-h-screen bg-background">
          {/* Product Header */}
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedProduct(null)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-lg font-medium">{selectedProduct.name}</h1>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6">
            {/* Product Image Placeholder */}
            <div className="w-full h-48 bg-accent rounded-lg flex items-center justify-center mb-6">
              <Package size={64} className="text-primary" />
            </div>

            {/* Stock Status */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-h3">Stock Available</span>
              <span className={`text-h2 font-bold ${
                selectedProduct.stock < 5 ? "text-destructive" : 
                selectedProduct.stock < 10 ? "text-warning" : "text-success"
              }`}>
                {selectedProduct.stock} units
              </span>
            </div>

            {/* Price */}
            <div className="performance-card mb-4">
              <div className="flex items-center justify-between">
                <span className="text-body">Unit Price</span>
                <span className="text-h3">${selectedProduct.unitPrice}</span>
              </div>
            </div>

            {/* Description */}
            <div className="performance-card mb-6">
              <h3 className="text-h3 mb-2">Description</h3>
              <p className="text-body text-secondary-foreground">{selectedProduct.description}</p>
              <div className="mt-3">
                <span className="inline-block bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs">
                  {selectedProduct.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full h-12">
                <ShoppingCart size={20} className="mr-2" />
                Record a Sale
              </Button>
              <Button variant="outline" className="w-full h-12">
                <Gift size={20} className="mr-2" />
                Record a Giveaway
              </Button>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="inventory">
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-h1">Inventory</h1>
        <p className="text-sm opacity-90">Manage your assigned products</p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 gap-4">
          {inventoryData.map((product) => (
            <div 
              key={product.id} 
              className="performance-card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex items-center gap-4">
                {/* Product Image Placeholder */}
                <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={24} className="text-primary" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-h3 mb-1">{product.name}</h3>
                  <p className="text-secondary text-xs mb-2">{product.category}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-body font-medium">${product.unitPrice}</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${
                        product.stock < 5 ? "text-destructive" : 
                        product.stock < 10 ? "text-warning" : "text-success"
                      }`}>
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};