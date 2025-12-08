import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  brand?: string;
  description?: string;
}

export const useProducts = () => {
  const { currentWorkspaceId } = useWorkspace();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchProducts();
    }
  }, [currentWorkspaceId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch product variants filtered by workspace
      const { data: productVariants, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('workspace_id', currentWorkspaceId);

      if (error) throw error;

      if (productVariants) {
        const formattedProducts: Product[] = productVariants.map(variant => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku || '',
          price: variant.price || 0,
          category: 'general',
          brand: undefined,
          description: undefined
        }));

        setProducts(formattedProducts);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(formattedProducts.map(p => p.category))
        ).map(category => ({
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1)
        }));

        setCategories([
          { id: 'all', name: 'All Products' },
          ...uniqueCategories
        ]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to empty arrays if no products in DB yet
      setProducts([]);
      setCategories([{ id: 'all', name: 'All Products' }]);
    } finally {
      setLoading(false);
    }
  };

  return { products, categories, loading, refetch: fetchProducts };
};
