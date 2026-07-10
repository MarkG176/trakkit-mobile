import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { formatProductWithVariant } from "@/utils/formatProductName";

export interface InventoryItem {
  id: string;
  name: string | null;
  product_name: string | null;
  variant_name: string | null;
  product_variant_id: string;
  amount_issued: number;
  price: number;
  sku: string | null;
}

export const useInventory = () => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    if (!user || !currentWorkspaceId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agent_task_inventory")
        .select(`
          id,
          name,
          product_variant_id,
          amount_issued,
          product_variants!inner (
            id,
            name,
            sku,
            price,
            workspace_id,
            products:product_id (
              name
            )
          ),
          agent_tasks!inner (
            workspace_id,
            is_deleted
          )
        `)
        .eq("agent_id", user.id)
        .eq("is_deleted", false)
        .eq("product_variants.workspace_id", currentWorkspaceId)
        .eq("agent_tasks.workspace_id", currentWorkspaceId)
        .eq("agent_tasks.is_deleted", false);

      if (error) throw error;

      const dedupedInventory = new Map<string, InventoryItem>();

      (data || []).forEach((item: any) => {
        const variant = Array.isArray(item.product_variants)
          ? item.product_variants[0]
          : item.product_variants;
        const productRecord = Array.isArray(variant?.products)
          ? variant.products[0]
          : variant?.products;

        const productVariantId = item.product_variant_id;
        const variantName = variant?.name || null;
        const productName = productRecord?.name || item.name || null;
        const displayName = formatProductWithVariant(productName, variantName);
        const existing = dedupedInventory.get(productVariantId);

        if (existing) {
          existing.amount_issued += Number(item.amount_issued || 0);
          if (!existing.name && displayName) existing.name = displayName;
          if (!existing.product_name && productName) existing.product_name = productName;
          if (!existing.variant_name && variantName) existing.variant_name = variantName;
          if (!existing.sku && variant?.sku) existing.sku = variant.sku;
          if (!existing.price && variant?.price) existing.price = Number(variant.price);
          return;
        }

        dedupedInventory.set(productVariantId, {
          id: productVariantId,
          name: displayName,
          product_name: productName,
          variant_name: variantName,
          product_variant_id: productVariantId,
          amount_issued: Number(item.amount_issued || 0),
          price: Number(variant?.price || 0),
          sku: variant?.sku || null,
        });
      });

      setInventory(Array.from(dedupedInventory.values()));
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user, currentWorkspaceId]);

  return { inventory, loading, refetch: fetchInventory };
};
