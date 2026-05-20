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

      // First get the product_focus from the project_plans
      const { data: projectData, error: projectError } = await supabase
        .from("project_plans")
        .select("product_focus")
        .eq("id", currentProjectId)
        .single();

      if (projectError || !projectData?.product_focus) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Parse product_focus - assuming it's a comma-separated list of product names
      const productNames = projectData.product_focus.split(',').map(name => name.trim());

      if (productNames.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Get product variants that match the product names
      const { data: productVariants, error: variantsError } = await supabase
        .from("product_variants")
        .select(`
          id,
          name,
          sku,
          price,
          products!inner (
            name
          )
        `)
        .eq("workspace_id", currentWorkspaceId)
        .in("products.name", productNames);

      if (variantsError) throw variantsError;

      // Transform the data to match our interface
      const transformedProducts = (productVariants || []).map((variant: any) => ({
        id: variant.id,
        name: variant.name || variant.products?.name || 'Unknown Product',
        product_variant_id: variant.id,
        price: variant.price || 0,
        sku: variant.sku
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching product focus inventory:', error);
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