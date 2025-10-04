/**
 * Hook for managing agent actions with workspace context
 */

import { supabase } from '@/integrations/supabase/client';
import { workspaceService } from '@/services/workspaceService';

interface AgentActionData {
  action_type: string;
  points_earned?: number;
  action_data?: any;
  location_lat?: number;
  location_lng?: number;
}

export const useAgentActions = () => {
  /**
   * Record an agent action with workspace context
   */
  const recordAction = async (agentId: string, actionData: AgentActionData) => {
    try {
      const { error } = await supabase
        .from('agent_actions')
        .insert(workspaceService.ensureWorkspaceContext({
          agent_id: agentId,
          action_type: actionData.action_type,
          points_earned: actionData.points_earned || 0,
          action_data: {
            ...actionData.action_data,
            workspace: workspaceService.getWorkspaceName(),
            project: workspaceService.getProjectName(),
            timestamp: new Date().toISOString()
          },
          location_lat: actionData.location_lat,
          location_lng: actionData.location_lng,
          performed_at: new Date().toISOString()
        }));

      if (error) {
        console.error('Error recording agent action:', error);
        throw error;
      }

      console.log('✅ Agent action recorded:', {
        action_type: actionData.action_type,
        workspace: workspaceService.getWorkspaceName(),
        project: workspaceService.getProjectName()
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to record agent action:', error);
      return { success: false, error };
    }
  };

  /**
   * Record status change action
   */
  const recordStatusChange = async (
    agentId: string, 
    status: string, 
    location?: { lat: number; lng: number },
    metadata?: any
  ) => {
    const pointsMap: Record<string, number> = {
      'checked_in': 15,
      'checked_out': 5,
      'lunch': 0,
      'set_location': 10
    };

    return recordAction(agentId, {
      action_type: `status_${status}`,
      points_earned: pointsMap[status] || 0,
      action_data: {
        status,
        ...metadata
      },
      location_lat: location?.lat,
      location_lng: location?.lng
    });
  };

  /**
   * Record interaction action
   */
  const recordInteraction = async (
    agentId: string,
    interactionType: string,
    customerName?: string,
    metadata?: any
  ) => {
    return recordAction(agentId, {
      action_type: 'interaction_completed',
      points_earned: 10,
      action_data: {
        interaction_type: interactionType,
        customer_name: customerName,
        ...metadata
      }
    });
  };

  /**
   * Record sale action
   */
  const recordSale = async (
    agentId: string,
    saleValue: number,
    customerName?: string,
    metadata?: any
  ) => {
    const pointsEarned = Math.max(Math.floor(saleValue / 10) * 5, 25);
    
    return recordAction(agentId, {
      action_type: 'sale_completed',
      points_earned: pointsEarned,
      action_data: {
        sale_value: saleValue,
        customer_name: customerName,
        ...metadata
      }
    });
  };

  /**
   * Record survey action
   */
  const recordSurvey = async (
    agentId: string,
    surveyType: string,
    metadata?: any
  ) => {
    return recordAction(agentId, {
      action_type: 'survey_completed',
      points_earned: 20,
      action_data: {
        survey_type: surveyType,
        ...metadata
      }
    });
  };

  /**
   * Record location setting action
   */
  const recordLocationSet = async (
    agentId: string,
    location: { lat: number; lng: number },
    storeName?: string,
    metadata?: any
  ) => {
    return recordAction(agentId, {
      action_type: 'location_set',
      points_earned: 10,
      action_data: {
        store_name: storeName,
        ...metadata
      },
      location_lat: location.lat,
      location_lng: location.lng
    });
  };

  return {
    recordAction,
    recordStatusChange,
    recordInteraction,
    recordSale,
    recordSurvey,
    recordLocationSet
  };
};
