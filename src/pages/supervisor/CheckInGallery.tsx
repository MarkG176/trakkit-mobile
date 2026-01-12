import { useState, useEffect, useCallback } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { CheckInThumbnail } from "@/components/supervisor/CheckInThumbnail";
import { DateRangeSelector } from "@/components/supervisor/DateRangeSelector";
import { PaginationControls } from "@/components/supervisor/PaginationControls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Camera, RefreshCw, Loader2, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface CheckIn {
  id: string;
  agentId: string;
  agentName: string;
  agentInitials: string;
  imageUrl?: string;
  timestamp: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  status: 'checked_in' | 'on_break' | 'checked_out';
  distanceFromAssigned?: number;
  inRange?: boolean;
  checkInSuccessful?: boolean;
}

type FilterStatus = 'all' | 'checked_in' | 'on_break' | 'checked_out' | 'needs_review';

export const CheckInGallery = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);
  const [rejectingAttendance, setRejectingAttendance] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const { user } = useAuth();

  const { preset, setPreset, setCustomRange, dateRange, startISO, endISO, dateLabel } = useDateRangeFilter('today');

  const filteredCheckIns = checkIns.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'needs_review') return c.checkInSuccessful === false || (c.distanceFromAssigned && c.distanceFromAssigned > 100);
    return c.status === filter;
  });

  const {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ items: filteredCheckIns, itemsPerPage: 12 });

  const fetchCheckIns = useCallback(async () => {
    if (!currentWorkspaceId) return;

    try {
      setRefreshing(true);

      let query = supabase
        .from('agent_status_log')
        .select(`
          id,
          agent_id,
          agent_display_name,
          status,
          timestamp,
          location_lat,
          location_lng,
          selfie_url,
          distance_from_assigned,
          in_range,
          check_in_successful
        `)
        .eq('workspace_id', currentWorkspaceId)
        .order('timestamp', { ascending: false });

      if (startISO) query = query.gte('timestamp', startISO);
      if (endISO) query = query.lte('timestamp', endISO);

      const { data: statusLogs, error } = await query;
      if (error) throw error;

      // Get agent details
      const agentIds = [...new Set(statusLogs?.map(log => log.agent_id) || [])];
      const { data: agents } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', agentIds);

      const agentMap = new Map(agents?.map(a => [a.user_id, a]));

      const checkInData: CheckIn[] = (statusLogs || []).map(log => {
        const agent = agentMap.get(log.agent_id);
        const name = log.agent_display_name || agent?.display_name || agent?.email?.split('@')[0] || 'Unknown';
        
        let status: CheckIn['status'] = 'checked_in';
        if (log.status === 'checked_out') status = 'checked_out';
        else if (log.status === 'lunch' || log.status === 'break') status = 'on_break';

        return {
          id: log.id,
          agentId: log.agent_id,
          agentName: name,
          agentInitials: name.substring(0, 2).toUpperCase(),
          imageUrl: log.selfie_url || undefined,
          timestamp: log.timestamp,
          location: log.location_lat ? `${log.location_lat.toFixed(4)}, ${log.location_lng?.toFixed(4)}` : undefined,
          locationLat: log.location_lat || undefined,
          locationLng: log.location_lng || undefined,
          status,
          distanceFromAssigned: log.distance_from_assigned || undefined,
          inRange: log.in_range ?? undefined,
          checkInSuccessful: log.check_in_successful ?? undefined,
        };
      });

      setCheckIns(checkInData);
    } catch (error: any) {
      toast({
        title: "Error loading check-ins",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWorkspaceId, startISO, endISO, toast]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  // Real-time subscription for new check-ins
  useRealtimeSubscription({
    table: 'agent_status_log',
    event: 'INSERT',
    filter: currentWorkspaceId ? `workspace_id=eq.${currentWorkspaceId}` : undefined,
    onData: () => {
      if (preset === 'today') {
        fetchCheckIns();
      }
    },
    enabled: preset === 'today' && !!currentWorkspaceId,
  });

  const handleConfirmAttendance = async () => {
    if (!selectedCheckIn || !user) return;

    setConfirmingAttendance(true);
    try {
      const { error } = await supabase
        .from('agent_status_log')
        .update({
          check_in_successful: true,
          in_range: true,
        })
        .eq('id', selectedCheckIn.id);

      if (error) throw error;

      toast({
        title: "Attendance Confirmed",
        description: `${selectedCheckIn.agentName}'s attendance has been confirmed.`,
      });

      setSelectedCheckIn(null);
      fetchCheckIns();
    } catch (error: any) {
      toast({
        title: "Error confirming attendance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConfirmingAttendance(false);
    }
  };

  const handleRejectAttendance = async () => {
    if (!selectedCheckIn || !user) return;

    setRejectingAttendance(true);
    try {
      const { error } = await supabase
        .from('agent_status_log')
        .update({
          check_in_successful: false,
          in_range: false,
        })
        .eq('id', selectedCheckIn.id);

      if (error) throw error;

      // Log note for rejection if provided
      if (rejectionNotes.trim()) {
        await supabase.from('notes').insert({
          content: `Attendance rejected: ${rejectionNotes}`,
          note_type: 'attendance_rejection',
          workspace_id: currentWorkspaceId,
          agent_id: user.id,
          metadata: {
            check_in_id: selectedCheckIn.id,
            agent_id: selectedCheckIn.agentId,
            agent_name: selectedCheckIn.agentName,
          },
        });
      }

      toast({
        title: "Attendance Rejected",
        description: `${selectedCheckIn.agentName}'s attendance has been rejected.`,
        variant: "destructive",
      });

      setSelectedCheckIn(null);
      setRejectionNotes("");
      fetchCheckIns();
    } catch (error: any) {
      toast({
        title: "Error rejecting attendance",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRejectingAttendance(false);
    }
  };

  const statusCounts = {
    all: checkIns.length,
    checked_in: checkIns.filter(c => c.status === 'checked_in').length,
    on_break: checkIns.filter(c => c.status === 'on_break').length,
    checked_out: checkIns.filter(c => c.status === 'checked_out').length,
    needs_review: checkIns.filter(c => c.checkInSuccessful === false || (c.distanceFromAssigned && c.distanceFromAssigned > 100)).length,
  };

  const getStatusColor = (checkIn: CheckIn) => {
    if (checkIn.checkInSuccessful === false) return 'border-red-500';
    if (checkIn.distanceFromAssigned && checkIn.distanceFromAssigned > 100) return 'border-yellow-500';
    if (checkIn.checkInSuccessful === true) return 'border-green-500';
    return '';
  };

  return (
    <SupervisorMobileLayout currentPage="check-in-gallery">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Check-in Gallery</h1>
            <p className="text-sm opacity-90">Attendance verification</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchCheckIns}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-white/20"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
            {checkIns.length} check-ins
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
            {dateLabel}
          </Badge>
          {statusCounts.needs_review > 0 && (
            <Badge variant="secondary" className="bg-yellow-500/40 text-primary-foreground">
              {statusCounts.needs_review} need review
            </Badge>
          )}
        </div>
      </div>

      {/* Date range selector */}
      <div className="px-4 py-3 border-b">
        <DateRangeSelector
          preset={preset}
          setPreset={setPreset}
          setCustomRange={setCustomRange}
          dateRange={dateRange}
          dateLabel={dateLabel}
        />
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-3 border-b overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {(['all', 'needs_review', 'checked_in', 'on_break', 'checked_out'] as FilterStatus[]).map(status => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className={`text-xs shrink-0 ${status === 'needs_review' && statusCounts.needs_review > 0 ? 'border-yellow-500' : ''}`}
            >
              {status === 'all' ? 'All' : 
               status === 'checked_in' ? 'Active' : 
               status === 'on_break' ? 'Break' : 
               status === 'checked_out' ? 'Out' : 
               'Needs Review'}
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {statusCounts[status]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Gallery grid */}
      <div className="p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No check-ins found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {paginatedItems.map(checkIn => (
                <div key={checkIn.id} className={`border-2 rounded-lg ${getStatusColor(checkIn)}`}>
                  <CheckInThumbnail
                    checkIn={checkIn}
                    onClick={() => setSelectedCheckIn(checkIn)}
                  />
                </div>
              ))}
            </div>
            
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              onPrevPage={prevPage}
              onNextPage={nextPage}
              hasPrevPage={hasPrevPage}
              hasNextPage={hasNextPage}
            />
          </>
        )}
      </div>

      {/* Detail dialog with confirmation actions */}
      <Dialog open={!!selectedCheckIn} onOpenChange={() => {
        setSelectedCheckIn(null);
        setRejectionNotes("");
      }}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Attendance Verification
            </DialogTitle>
          </DialogHeader>
          {selectedCheckIn && (
            <div className="space-y-4">
              {selectedCheckIn.imageUrl ? (
                <img 
                  src={selectedCheckIn.imageUrl} 
                  alt="Check-in selfie"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-3xl">
                      {selectedCheckIn.agentInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{selectedCheckIn.agentName}</h3>
                  <Badge variant={
                    selectedCheckIn.status === 'checked_in' ? 'default' :
                    selectedCheckIn.status === 'on_break' ? 'secondary' : 'destructive'
                  }>
                    {selectedCheckIn.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(selectedCheckIn.timestamp), 'PPp')}</span>
                  </div>
                  
                  {selectedCheckIn.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedCheckIn.location}</span>
                    </div>
                  )}
                  
                  {selectedCheckIn.distanceFromAssigned !== undefined && (
                    <div className={`flex items-center gap-2 ${selectedCheckIn.distanceFromAssigned > 100 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {selectedCheckIn.distanceFromAssigned > 100 ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>{selectedCheckIn.distanceFromAssigned}m from assigned location</span>
                    </div>
                  )}

                  {selectedCheckIn.checkInSuccessful === true && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Attendance confirmed</span>
                    </div>
                  )}

                  {selectedCheckIn.checkInSuccessful === false && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>Attendance rejected</span>
                    </div>
                  )}
                </div>

                {/* Rejection notes input */}
                {selectedCheckIn.checkInSuccessful !== true && (
                  <div className="pt-2">
                    <Textarea
                      placeholder="Notes for rejection (optional)..."
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {selectedCheckIn.checkInSuccessful === undefined && (
                <DialogFooter className="flex gap-2 pt-4">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleRejectAttendance}
                    disabled={rejectingAttendance}
                  >
                    {rejectingAttendance ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmAttendance}
                    disabled={confirmingAttendance}
                  >
                    {confirmingAttendance ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Confirm
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SupervisorMobileLayout>
  );
};
