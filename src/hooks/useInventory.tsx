import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { saveInventorySnapshot, getProjectedInventoryItems } from "@/services/offline/inventorySnapshotStore";
import { subscribeOutboxFlush } from "@/services/offline/flushOutbox";

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
  const { currentWorkspaceId } = useWorkspace();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const mapRowsToInventory = (data: unknown[]): InventoryItem[] => {
    const dedupedInventory = new Map<string, InventoryItem>();

    (data || []).forEach((item: any) => {
      const variant = Array.isArray(item.product_variants)
        ? item.product_variants[0]
        : item.product_variants;

      const productVariantId = item.product_variant_id;
      const displayName = item.name || variant?.name || "Unknown Product";
      const existing = dedupedInventory.get(productVariantId);

      if (existing) {
        existing.amount_issued += Number(item.amount_issued || 0);
        if (!existing.name && displayName) existing.name = displayName;
        if (!existing.sku && variant?.sku) existing.sku = variant.sku;
        if (!existing.price && variant?.price) existing.price = Number(variant.price);
        return;
      }

      dedupedInventory.set(productVariantId, {
        id: productVariantId,
        name: displayName,
        product_variant_id: productVariantId,
        amount_issued: Number(item.amount_issued || 0),
        price: Number(variant?.price || 0),
        sku: variant?.sku || null,
      });
    });

    return Array.from(dedupedInventory.values());
  };

  const applyLocalProjection = useCallback(
    async (serverItems: InventoryItem[]) => {
      if (!currentWorkspaceId) return serverItems;
      const projected = await getProjectedInventoryItems(currentWorkspaceId);
      if (projected.length === 0) return serverItems;

      const projectedMap = new Map(
        projected.map((p) => [p.product_variant_id, p.amount_issued])
      );

      return serverItems.map((item) => ({
        ...item,
        amount_issued: projectedMap.get(item.product_variant_id) ?? item.amount_issued,
      }));
    },
    [currentWorkspaceId]
  );

  const fetchInventory = async () => {
    if (!user || !currentWorkspaceId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (!navigator.onLine) {
        const projected = await getProjectedInventoryItems(currentWorkspaceId);
        if (projected.length > 0) {
          setInventory(
            projected.map((p) => ({
              id: p.product_variant_id,
              name: p.name,
              product_variant_id: p.product_variant_id,
              amount_issued: p.amount_issued,
              price: p.price,
              sku: p.sku,
            }))
          );
          return;
        }
      }

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
            workspace_id
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

      const serverItems = mapRowsToInventory(data || []);
      await saveInventorySnapshot(currentWorkspaceId, user.id, serverItems);
      const withProjection = await applyLocalProjection(serverItems);
      setInventory(withProjection);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      const projected = await getProjectedInventoryItems(currentWorkspaceId);
      if (projected.length > 0) {
        setInventory(
          projected.map((p) => ({
            id: p.product_variant_id,
            name: p.name,
            product_variant_id: p.product_variant_id,
            amount_issued: p.amount_issued,
            price: p.price,
            sku: p.sku,
          }))
        );
      } else {
        toast.error("Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    const unsub = subscribeOutboxFlush(() => {
      void fetchInventory();
    });
    return unsub;
  }, [user, currentWorkspaceId]);

  return { inventory, loading, refetch: fetchInventory };
};
