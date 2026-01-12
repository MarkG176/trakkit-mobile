import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { CheckInThumbnail } from "@/components/supervisor/CheckInThumbnail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, RefreshCw, Loader2, MapPin, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
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
}

type FilterStatus = 'all' | 'checked_in' | 'on_break' | 'checked_out';

export const CheckInGallery = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  useEffect(() => {
    fetchCheckIns();
  }, [currentWorkspaceId]);

  const fetchCheckIns = async () => {
    if (!currentWorkspaceId) return;

    try {
      setRefreshing(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: statusLogs, error } = await supabase
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
          distance_from_assigned
        `)
        .eq('workspace_id', currentWorkspaceId)
        .gte('timestamp', todayISO)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Get latest status for each agent
      const latestByAgent = new Map<string, typeof statusLogs[0]>();
      statusLogs?.forEach(log => {
        if (!latestByAgent.has(log.agent_id)) {
          latestByAgent.set(log.agent_id, log);
        }
      });

      // Get agent details
      const agentIds = Array.from(latestByAgent.keys());
      const { data: agents } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', agentIds);

      const agentMap = new Map(agents?.map(a => [a.user_id, a]));

      const checkInData: CheckIn[] = Array.from(latestByAgent.values()).map(log => {
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
  };

  const filteredCheckIns = checkIns.filter(c => filter === 'all' || c.status === filter);

  const statusCounts = {
    all: checkIns.length,
    checked_in: checkIns.filter(c => c.status === 'checked_in').length,
    on_break: checkIns.filter(c => c.status === 'on_break').length,
    checked_out: checkIns.filter(c => c.status === 'checked_out').length,
  };

  return (
    <SupervisorMobileLayout currentPage="check-in-gallery">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Check-in Gallery</h1>
            <p className="text-sm opacity-90">Today's agent selfies</p>
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
        
        <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
          {checkIns.length} agents today
        </Badge>
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-3 border-b overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {(['all', 'checked_in', 'on_break', 'checked_out'] as FilterStatus[]).map(status => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="text-xs shrink-0"
            >
              {status === 'all' ? 'All' : status === 'checked_in' ? 'Active' : status === 'on_break' ? 'Break' : 'Out'}
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
        ) : filteredCheckIns.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No check-ins yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredCheckIns.map(checkIn => (
              <CheckInThumbnail
                key={checkIn.id}
                checkIn={checkIn}
                onClick={() => setSelectedCheckIn(checkIn)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedCheckIn} onOpenChange={() => setSelectedCheckIn(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Check-in Details</DialogTitle>
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
                  
                  {selectedCheckIn.distanceFromAssigned && selectedCheckIn.distanceFromAssigned > 100 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{selectedCheckIn.distanceFromAssigned}m from assigned location</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SupervisorMobileLayout>
  );
};
