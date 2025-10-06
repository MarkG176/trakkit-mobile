import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { workspaceService } from '@/services/workspaceService';

interface InteractionFormData {
  interactionType: string;
  customerName: string;
  customerPhone?: string;
  notes: string;
  sentiment: number;
  recordingUrl?: string;
}

export const useInteractionForm = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const submitInteraction = async (formData: InteractionFormData) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to submit interactions",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // Get the current user's active task (optional)
      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      // Insert the interaction
      const { error } = await supabase
        .from('interactions')
        .insert({
          task_id: currentTask?.id || null,
          interaction_type: 'general',
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          outcome: 'completed',
          quantity_sold: 0,
          metadata: {
            interaction_type: formData.interactionType,
            notes: formData.notes,
            sentiment: formData.sentiment,
            recording_url: formData.recordingUrl
          }
        });

      if (error) throw error;

      // Award points for logging interaction with workspace context
      await supabase
        .from('agent_actions')
        .insert(workspaceService.ensureWorkspaceContext({
          agent_id: user.id,
          action_type: 'interaction_logged',
          points_earned: 10,
          action_data: {
            interaction_type: formData.interactionType,
            customer_name: formData.customerName,
            project: workspaceService.getProjectName()
          }
        }));

      toast({
        title: "Interaction logged successfully!",
        description: "+10 points earned.",
      });

      return true;
    } catch (error) {
      console.error('Error submitting interaction:', error);
      toast({
        title: "Error",
        description: "Failed to log interaction. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitInteraction, loading };
};