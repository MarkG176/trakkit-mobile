import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AgentReport {
  id: string;
  agent_id: string;
  agent_name: string;
  report_date: string;
  start_time: string | null;
  lunch_start_time: string | null;
  lunch_end_time: string | null;
  end_time: string | null;
  total_hours: number;
  lunch_duration: number;
  work_hours: number;
  created_at: string;
  updated_at: string;
}

interface ReportData {
  agent_name: string;
  hours_worked: number;
  start_time: string | null;
  lunch_start_time: string | null;
  lunch_end_time: string | null;
  end_time: string | null;
  work_hours: number;
  lunch_duration: number;
}

export const useAgentReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (date: Date): Promise<ReportData | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get agent's display name
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const agentName = userRole?.display_name || user.email?.split('@')[0] || 'Unknown';

      // Get status logs for the day
      const { data: statusLogs, error: statusError } = await supabase
        .from('agent_status_log')
        .select('*')
        .eq('agent_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });

      if (statusError) {
        throw statusError;
      }

      // Calculate work hours and times
      const reportData = calculateWorkTimes(statusLogs || []);

      // Save or update report
      const { error: upsertError } = await supabase
        .from('agent_reports')
        .upsert({
          agent_id: user.id,
          agent_name: agentName,
          report_date: date.toISOString().split('T')[0],
          start_time: reportData.start_time,
          lunch_start_time: reportData.lunch_start_time,
          lunch_end_time: reportData.lunch_end_time,
          end_time: reportData.end_time,
          total_hours: reportData.hours_worked,
          lunch_duration: reportData.lunch_duration,
          work_hours: reportData.work_hours
        }, {
          onConflict: 'agent_id,report_date'
        });

      if (upsertError) {
        throw upsertError;
      }

      return {
        agent_name: agentName,
        hours_worked: reportData.hours_worked,
        start_time: reportData.start_time,
        lunch_start_time: reportData.lunch_start_time,
        lunch_end_time: reportData.lunch_end_time,
        end_time: reportData.end_time,
        work_hours: reportData.work_hours,
        lunch_duration: reportData.lunch_duration
      };

    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkTimes = (statusLogs: any[]) => {
    let startTime: string | null = null;
    let lunchStartTime: string | null = null;
    let lunchEndTime: string | null = null;
    let endTime: string | null = null;
    let totalWorkMinutes = 0;
    let totalLunchMinutes = 0;
    let currentCheckIn: any = null;
    let currentLunchStart: any = null;

    statusLogs.forEach(log => {
      switch (log.status) {
        case 'checked_in':
          if (!startTime) {
            startTime = log.created_at;
          }
          currentCheckIn = log;
          currentLunchStart = null;
          break;

        case 'lunch':
          if (currentCheckIn) {
            // Calculate work time before lunch
            const checkInTime = new Date(currentCheckIn.created_at);
            const lunchTime = new Date(log.created_at);
            const workMinutes = (lunchTime.getTime() - checkInTime.getTime()) / (1000 * 60);
            totalWorkMinutes += Math.max(0, workMinutes);
          }
          currentLunchStart = log;
          lunchStartTime = log.created_at;
          currentCheckIn = null;
          break;

        case 'checked_out':
          if (currentLunchStart) {
            // Calculate lunch duration
            const lunchStart = new Date(currentLunchStart.created_at);
            const checkOutTime = new Date(log.created_at);
            const lunchMinutes = (checkOutTime.getTime() - lunchStart.getTime()) / (1000 * 60);
            totalLunchMinutes += Math.max(0, lunchMinutes);
            lunchEndTime = log.created_at;
          } else if (currentCheckIn) {
            // Direct check out without lunch
            const checkInTime = new Date(currentCheckIn.created_at);
            const checkOutTime = new Date(log.created_at);
            const workMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
            totalWorkMinutes += Math.max(0, workMinutes);
          }
          endTime = log.created_at;
          currentCheckIn = null;
          currentLunchStart = null;
          break;
      }
    });

    // Handle case where agent is still checked in
    if (currentCheckIn) {
      const checkInTime = new Date(currentCheckIn.created_at);
      const now = new Date();
      const workMinutes = (now.getTime() - checkInTime.getTime()) / (1000 * 60);
      totalWorkMinutes += Math.max(0, workMinutes);
    }

    // Handle case where agent is still on lunch
    if (currentLunchStart) {
      const lunchStart = new Date(currentLunchStart.created_at);
      const now = new Date();
      const lunchMinutes = (now.getTime() - lunchStart.getTime()) / (1000 * 60);
      totalLunchMinutes += Math.max(0, lunchMinutes);
    }

    const totalHours = (totalWorkMinutes + totalLunchMinutes) / 60;
    const workHours = totalWorkMinutes / 60;
    const lunchDuration = totalLunchMinutes / 60;

    return {
      start_time: startTime,
      lunch_start_time: lunchStartTime,
      lunch_end_time: lunchEndTime,
      end_time: endTime,
      hours_worked: totalHours,
      work_hours: workHours,
      lunch_duration: lunchDuration
    };
  };

  const downloadReport = (reportData: ReportData, date: Date) => {
    const formatTime = (timeString: string | null) => {
      if (!timeString) return 'N/A';
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const content = `AGENT REPORT
================
Date: ${date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}

Agent Name: ${reportData.agent_name}
Start Time: ${formatTime(reportData.start_time)}
Lunch Start Time: ${formatTime(reportData.lunch_start_time)}
Lunch End Time: ${formatTime(reportData.lunch_end_time)}
End Time: ${formatTime(reportData.end_time)}

WORK SUMMARY
============
Total Hours: ${reportData.hours_worked.toFixed(2)} hours
Work Hours: ${reportData.work_hours.toFixed(2)} hours
Lunch Duration: ${reportData.lunch_duration.toFixed(2)} hours

Generated on: ${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-report-${reportData.agent_name.replace(/\s+/g, '-').toLowerCase()}-${date.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getReports = async (startDate?: Date, endDate?: Date) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('agent_reports')
        .select('*')
        .eq('agent_id', user.id)
        .order('report_date', { ascending: false });

      if (startDate) {
        query = query.gte('report_date', startDate.toISOString().split('T')[0]);
      }

      if (endDate) {
        query = query.lte('report_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setReports(data || []);

    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    reports,
    loading,
    error,
    generateReport,
    downloadReport,
    getReports
  };
};
