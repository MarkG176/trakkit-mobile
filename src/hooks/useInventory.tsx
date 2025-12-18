import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface InventoryItem {
  id: string;
  name: string | null;
  product_variant_id: string;
  amount_issued: number;
  price: number;
  sku: string | null;
}

export const useInventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_task_inventory')
        .select(`
          id,
          name,
          product_variant_id,
          amount_issued,
          product_variants (
            id,
            name,
            sku,
            price
          )
        `)
        .eq('agent_id', user.id)
        .eq('is_deleted', false);

      if (error) throw error;

      // Transform data - prioritize product_variants.name over agent_task_inventory.name
      const transformedData: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        name: (item.product_variants as any)?.name || item.name || 'Unknown Product',
        product_variant_id: item.product_variant_id,
        amount_issued: item.amount_issued,
        price: (item.product_variants as any)?.price || 0,
        sku: (item.product_variants as any)?.sku || null,
      }));

      setInventory(transformedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  return { inventory, loading, refetch: fetchInventory };
};
