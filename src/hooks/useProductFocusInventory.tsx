import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

export interface ProductFocusItem {
  id: string;
  name: string | null;
  product_variant_id: string;
  price: number;
  sku: string | null;
}

const quotePostgrestFilterValue = (value: string) => {
  if (/[",()]/.test(value) || /\s/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const useProductFocusInventory = () => {
  const { currentWorkspaceId, currentProjectId, currentWorkspaceLabel } = useWorkspace();
  const [products, setProducts] = useState<ProductFocusItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProductFocusInventory = async () => {
    if (!currentWorkspaceId || !currentProjectId || currentWorkspaceLabel?.toLowerCase() !== 'wholesale') {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from("project_plans")
        .select("product_focus")
        .eq("id", currentProjectId)
        .eq("workspace_id", currentWorkspaceId)
        .single();

      if (projectError || !projectData?.product_focus) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const focusTokens = projectData.product_focus
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);

      if (focusTokens.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const quotedTokens = focusTokens.map(quotePostgrestFilterValue).join(",");
      const { data: productVariants, error: variantsError } = await supabase
        .from("product_variants")
        .select("id, name, sku, price")
        .eq("workspace_id", currentWorkspaceId)
        .or(`name.in.(${quotedTokens}),sku.in.(${quotedTokens})`);

      if (variantsError) throw variantsError;

      const transformedProducts = (productVariants || []).map((variant) => ({
        id: variant.id,
        name: variant.name || "Unknown Product",
        product_variant_id: variant.id,
        price: variant.price || 0,
        sku: variant.sku,
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching product focus inventory:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductFocusInventory();
  }, [currentWorkspaceId, currentProjectId, currentWorkspaceLabel]);

  return { products, loading, refetch: fetchProductFocusInventory };
};
