import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PerformanceData {
  tasksToday: number;
  surveysCompleted: number;
  salesTarget: { current: number; target: number };
}

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  type: "survey" | "meeting" | "delivery";
}

export const useDashboardData = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    tasksToday: 0,
    surveysCompleted: 0,
    salesTarget: { current: 0, target: 0 }
  });
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch performance data
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's tasks
      const { data: tasks } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('agent_id', user?.id)
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      // Get survey interactions count
      const { data: surveys } = await supabase
        .from('interactions')
        .select('*, agent_tasks!inner(*)')
        .eq('agent_tasks.agent_id', user?.id)
        .eq('interaction_type', 'survey')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      // Get sales data
      const { data: sales } = await supabase
        .from('interactions')
        .select('*, agent_tasks!inner(*)')
        .eq('agent_tasks.agent_id', user?.id)
        .eq('interaction_type', 'sale')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      // Get agent's current task target
      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('individual_sales_target')
        .eq('agent_id', user?.id)
        .eq('status', 'pending')
        .single();

      setPerformanceData({
        tasksToday: tasks?.length || 0,
        surveysCompleted: surveys?.length || 0,
        salesTarget: { 
          current: sales?.length || 0, 
          target: currentTask?.individual_sales_target || 10 
        }
      });

      // Fetch schedule data (upcoming tasks)
      const { data: upcomingTasks } = await supabase
        .from('agent_tasks_view')
        .select('*')
        .eq('ambassador_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      if (upcomingTasks) {
        const scheduleItems: ScheduleItem[] = upcomingTasks.map((task, index) => ({
          id: task.id,
          time: new Date(task.created_at || '').toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          title: task.client_name || `Task ${index + 1}`,
          location: task.address || task.location_name || 'TBD',
          type: task.survey_type ? 'survey' : 'meeting'
        }));
        setScheduleData(scheduleItems);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { performanceData, scheduleData, loading, refetch: fetchDashboardData };
};