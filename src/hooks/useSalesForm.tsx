import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { workspaceService } from '@/services/workspaceService';

interface SaleItem {
  productVariantId: string;
  quantity: number;
  price: number;
}

interface SaleFormData {
  items: SaleItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  engagementType: string;
  notes: string;
  sentiment: number;
}

export const useSalesForm = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const submitSale = async (formData: SaleFormData) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to record sales",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // Get the current user's active task
      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', user.id)
        .eq('status', 'pending')
        .single();

      if (!currentTask) {
        toast({
          title: "No Active Task",
          description: "You need an active task to record sales",
          variant: "destructive",
        });
        return false;
      }

      const totalValue = formData.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      // Record each sale item as separate interactions
      for (const item of formData.items) {
        await supabase
          .from('interactions')
          .insert({
            task_id: currentTask.id,
            interaction_type: 'sale',
            customer_name: formData.customerName,
            customer_phone: formData.customerPhone,
            product_variant_id: item.productVariantId,
            quantity_sold: item.quantity,
            sale_value: item.price * item.quantity,
            outcome: 'sale',
            metadata: {
              engagement_type: formData.engagementType,
              notes: formData.notes,
              sentiment: formData.sentiment,
              customer_email: formData.customerEmail
            }
          });

        // Update inventory with workspace context
        await supabase
          .from('inventory_transactions')
          .insert(workspaceService.ensureWorkspaceContext({
            agent_id: user.id,
            product_id: item.productVariantId,
            qty: -item.quantity, // Negative for sale
            type: 'sale',
            reference: `Sale to ${formData.customerName || 'Customer'}`,
            metadata: {
              task_id: currentTask.id,
              sale_value: item.price * item.quantity
            }
          }));
      }

      // Award points for sale with workspace context
      const pointsEarned = Math.floor(totalValue / 10) * 5; // 5 points per 10 currency units
      await supabase
        .from('agent_actions')
        .insert(workspaceService.ensureWorkspaceContext({
          agent_id: user.id,
          action_type: 'sale_recorded',
          points_earned: Math.max(pointsEarned, 25), // Minimum 25 points
          action_data: {
            total_value: totalValue,
            customer_name: formData.customerName,
            items_count: formData.items.length,
            project: workspaceService.getProjectName()
          }
        }));

      toast({
        title: "Sale recorded successfully!",
        description: `+${Math.max(pointsEarned, 25)} points earned. Engagement logged.`,
      });

      return true;
    } catch (error) {
      console.error('Error submitting sale:', error);
      toast({
        title: "Error",
        description: "Failed to record sale. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitSale, loading };
};