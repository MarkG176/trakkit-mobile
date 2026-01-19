import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Incident {
  id: string;
  title: string;
  type: string;
  priority: "high" | "medium" | "low";
  status: "new" | "in_progress" | "resolved";
  reportedBy: string;
  reportedAt: string;
  description: string;
}

export const IncidentReporting = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showNewIncidentDialog, setShowNewIncidentDialog] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: "",
    type: "",
    priority: "medium" as "high" | "medium" | "low",
    description: "",
  });
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchIncidents();
    }
  }, [currentWorkspaceId]);

  const fetchIncidents = async () => {
    if (!currentWorkspaceId) return;

    try {
      setLoading(true);
      const { data: notes, error } = await supabase
        .from('notes')
        .select('id, content, priority, note_type, created_at, agent_id, metadata, is_deleted')
        .eq('workspace_id', currentWorkspaceId)
        .eq('note_type', 'incident')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const agentIds = Array.from(new Set(notes?.map(note => note.agent_id).filter(Boolean) || []));
      let agentMap = new Map<string, string>();

      if (agentIds.length > 0) {
        const { data: agents, error: agentsError } = await supabase
          .from('user_roles')
          .select('user_id, display_name, email')
          .in('user_id', agentIds);

        if (agentsError) throw agentsError;

        agentMap = new Map(
          agents?.map(agent => [
            agent.user_id, 
            agent.display_name || agent.email || 'Unknown'
          ]) || []
        );
      }

      const mappedIncidents: Incident[] = (notes || []).map(note => {
        const metadata = (note.metadata || {}) as Record<string, any>;
        const title = metadata.title || note.content.substring(0, 40) || "Incident Report";
        const type = metadata.incident_type || metadata.type || "General";
        const status = metadata.status || "new";
        const priority = (note.priority as Incident["priority"]) || metadata.priority || "medium";
        const reportedBy = note.agent_id ? agentMap.get(note.agent_id) || "Unknown" : "Unknown";

        return {
          id: note.id,
          title,
          type,
          priority,
          status,
          reportedBy,
          reportedAt: note.created_at || new Date().toISOString(),
          description: note.content,
        };
      });

      setIncidents(mappedIncidents);
    } catch (error: any) {
      toast({
        title: "Error loading incidents",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!newIncident.title || !newIncident.type || !newIncident.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!currentWorkspaceId || !user) {
      toast({
        title: "Unable to report incident",
        description: "Select a workspace and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          content: newIncident.description.trim(),
          note_type: 'incident',
          priority: newIncident.priority,
          workspace_id: currentWorkspaceId,
          agent_id: user.id,
          is_private: false,
          metadata: {
            title: newIncident.title.trim(),
            incident_type: newIncident.type,
            status: "new",
          },
        });

      if (error) throw error;

      toast({
        title: "Incident reported",
        description: "The incident has been logged successfully.",
      });

      setShowNewIncidentDialog(false);
      setNewIncident({
        title: "",
        type: "",
        priority: "medium",
        description: "",
      });
      fetchIncidents();
    } catch (error: any) {
      toast({
        title: "Error reporting incident",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    };
    return <Badge variant={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      new: "bg-blue-500 text-white",
      in_progress: "bg-yellow-500 text-white",
      resolved: "bg-green-500 text-white",
    };
    return (
      <Badge className={colors[status]}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <SupervisorMobileLayout currentPage="incidents">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Incident Reports</h1>
            <p className="text-sm opacity-90">Manage field issues</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <Button
          onClick={() => setShowNewIncidentDialog(true)}
          className="w-full bg-white text-primary hover:bg-white/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Report New Incident
        </Button>
        
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchIncidents} />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Active Incidents</h2>
          <p className="text-sm text-muted-foreground">
            {incidents.length} incident{incidents.length !== 1 ? "s" : ""} logged
          </p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : incidents.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No incidents reported</p>
            </Card>
          ) : (
            incidents.map((incident) => (
              <Card key={incident.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm">{incident.title}</h3>
                    </div>
                    <div className="flex gap-2 mb-2">
                      {getPriorityBadge(incident.priority)}
                      {getStatusBadge(incident.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Type: {incident.type}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Reported by {incident.reportedBy} •{" "}
                      {new Date(incident.reportedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-muted rounded p-3 mb-3">
                  <p className="text-sm">{incident.description}</p>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={showNewIncidentDialog} onOpenChange={setShowNewIncidentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Incident Title</Label>
              <Input
                id="title"
                placeholder="Brief title..."
                value={newIncident.title}
                onChange={(e) =>
                  setNewIncident({ ...newIncident, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="type">Incident Type</Label>
              <Select
                value={newIncident.type}
                onValueChange={(value) =>
                  setNewIncident({ ...newIncident, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product Damage">Product Damage</SelectItem>
                  <SelectItem value="Agent Device Issue">Agent Device Issue</SelectItem>
                  <SelectItem value="Customer Complaint">Customer Complaint</SelectItem>
                  <SelectItem value="Safety Issue">Safety Issue</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newIncident.priority}
                onValueChange={(value: any) =>
                  setNewIncident({ ...newIncident, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the incident..."
                value={newIncident.description}
                onChange={(e) =>
                  setNewIncident({ ...newIncident, description: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewIncidentDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateIncident}>Report Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupervisorMobileLayout>
  );
};
