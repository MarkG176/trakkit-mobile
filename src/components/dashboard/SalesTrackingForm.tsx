import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface SaleEntry {
  product_variant_id: string;
  quantity: number;
  product_name?: string;
}

interface SalesTrackingFormProps {
  inventory: Array<{
    id: string;
    product_variant_id: string;
    products: { name: string };
  }>;
  onSubmit: (sales: SaleEntry[]) => void;
  onSkip: () => void;
}

export const SalesTrackingForm = ({ inventory, onSubmit, onSkip }: SalesTrackingFormProps) => {
  const [salesEntries, setSalesEntries] = useState<SaleEntry[]>([
    { product_variant_id: "", quantity: 0 }
  ]);

  const addEntry = () => {
    setSalesEntries([...salesEntries, { product_variant_id: "", quantity: 0 }]);
  };

  const removeEntry = (index: number) => {
    setSalesEntries(salesEntries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof SaleEntry, value: string | number) => {
    const updated = [...salesEntries];
    updated[index] = { ...updated[index], [field]: value };
    setSalesEntries(updated);
  };

  const handleSubmit = () => {
    const validSales = salesEntries.filter(
      entry => entry.product_variant_id && entry.quantity > 0
    );
    onSubmit(validSales);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {salesEntries.map((entry, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <Select
                value={entry.product_variant_id}
                onValueChange={(value) => updateEntry(index, "product_variant_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.product_variant_id} value={item.product_variant_id}>
                      {item.products?.name || "Unknown Product"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Input
                type="number"
                min="0"
                placeholder="Qty"
                value={entry.quantity || ""}
                onChange={(e) => updateEntry(index, "quantity", parseInt(e.target.value) || 0)}
              />
            </div>
            {salesEntries.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(index)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEntry}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Another Product
      </Button>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onSkip}
        >
          Skip
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSubmit}
        >
          Submit Sales
        </Button>
      </div>
    </div>
  );
};
