import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Target, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WorkHoursData {
  totalHours: number;
  todayHours: number;
  weeklyTarget: number;
  monthlyTarget: number;
  weeklyProgress: number;
  monthlyProgress: number;
  todayTasks: number;
  completedTasks: number;
}

export const WorkHoursCard = () => {
  const { user } = useAuth();
  const [workHours, setWorkHours] = useState<WorkHoursData>({
    totalHours: 0,
    todayHours: 0,
    weeklyTarget: 40,
    monthlyTarget: 160,
    weeklyProgress: 0,
    monthlyProgress: 0,
    todayTasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkHours = async () => {
      if (!user) return;

      try {
        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        // Get this week's date range
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Get this month's date range
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

        // Fetch status logs for calculations
        const { data: statusLogs, error } = await supabase
          .from('agent_status_log')
          .select('*')
          .eq('agent_id', user.id)
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching status logs:', error);
          return;
        }

        // Calculate today's hours
        const todayLogs = statusLogs?.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= startOfDay && logDate <= endOfDay;
        }) || [];

        // Calculate weekly hours
        const weeklyLogs = statusLogs?.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= startOfWeek && logDate <= endOfWeek;
        }) || [];

        // Calculate work hours from status logs
        const calculateHours = (logs: any[]) => {
          let totalMinutes = 0;
          let currentCheckIn: any = null;

          logs.forEach(log => {
            if (log.status === 'checked_in' && !currentCheckIn) {
              currentCheckIn = log;
            } else if ((log.status === 'lunch' || log.status === 'checked_out') && currentCheckIn) {
              const checkInTime = new Date(currentCheckIn.created_at);
              const checkOutTime = new Date(log.created_at);
              const diffMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
              totalMinutes += Math.max(0, diffMinutes);
              currentCheckIn = null;
            }
          });

          // If still checked in at end of logs
          if (currentCheckIn) {
            const checkInTime = new Date(currentCheckIn.created_at);
            const now = new Date();
            const diffMinutes = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
            totalMinutes += Math.max(0, diffMinutes);
          }

          return totalMinutes / 60; // Convert to hours
        };

        const todayHours = calculateHours(todayLogs);
        const weeklyHours = calculateHours(weeklyLogs);
        const monthlyHours = calculateHours(statusLogs || []);

        // Fetch today's tasks
        const { data: todayTasks } = await supabase
          .from('agent_tasks')
          .select('id, status')
          .eq('agent_id', user.id)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());

        const completedTasks = todayTasks?.filter(task => task.status === 'completed').length || 0;
        const totalTasks = todayTasks?.length || 0;

        setWorkHours({
          totalHours: monthlyHours,
          todayHours: todayHours,
          weeklyTarget: 40,
          monthlyTarget: 160,
          weeklyProgress: Math.min(100, (weeklyHours / 40) * 100),
          monthlyProgress: Math.min(100, (monthlyHours / 160) * 100),
          todayTasks: totalTasks,
          completedTasks: completedTasks
        });

      } catch (error) {
        console.error('Error calculating work hours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkHours();
  }, [user]);

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Work Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Work Hours
        </CardTitle>
        <CardDescription>
          Track your daily progress and targets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Hours */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Today</span>
            <Badge variant="outline" className="font-mono">
              {formatHours(workHours.todayHours)}
            </Badge>
          </div>
          <Progress 
            value={Math.min(100, (workHours.todayHours / 8) * 100)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            Target: 8 hours
          </p>
        </div>

        {/* Weekly Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              This Week
            </span>
            <Badge variant="secondary">
              {workHours.weeklyProgress.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={workHours.weeklyProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Target: {workHours.weeklyTarget} hours
          </p>
        </div>

        {/* Today's Tasks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Target className="h-3 w-3" />
              Today's Tasks
            </span>
            <Badge variant="outline">
              {workHours.completedTasks}/{workHours.todayTasks}
            </Badge>
          </div>
          <Progress 
            value={workHours.todayTasks > 0 ? (workHours.completedTasks / workHours.todayTasks) * 100 : 0} 
            className="h-2"
          />
        </div>

        {/* Monthly Overview */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Activity className="h-3 w-3" />
              This Month
            </span>
            <div className="text-right">
              <p className="text-sm font-mono">{formatHours(workHours.totalHours)}</p>
              <p className="text-xs text-muted-foreground">
                {workHours.monthlyProgress.toFixed(0)}% of target
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
