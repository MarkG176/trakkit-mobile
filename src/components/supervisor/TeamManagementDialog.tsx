// [CMP-a76686] TeamManagementDialog — team management dialog component
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Check, X, Loader2, Users } from "lucide-react";

interface Team {
  id: string;
  name: string;
  memberCount: number;
}

interface TeamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onTeamsChanged?: () => void;
}

export const TeamManagementDialog = ({ open, onOpenChange, workspaceId, onTeamsChanged }: TeamManagementDialogProps) => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('name');

      if (error) throw error;

      // Get member counts
      const teamIds = (teamsData || []).map(t => t.id);
      let memberCounts: Record<string, number> = {};
      
      if (teamIds.length > 0) {
        const { data: members } = await supabase
          .from('team_members')
          .select('team_id')
          .in('team_id', teamIds);
        
        (members || []).forEach(m => {
          memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
        });
      }

      setTeams((teamsData || []).map(t => ({
        id: t.id,
        name: t.name,
        memberCount: memberCounts[t.id] || 0,
      })));
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchTeams();
  }, [open, workspaceId]);

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase
        .from('teams')
        .insert({ name: newTeamName.trim(), workspace_id: workspaceId });
      if (error) throw error;
      toast({ title: "Team created", description: `"${newTeamName.trim()}" has been created` });
      setNewTeamName("");
      fetchTeams();
      onTeamsChanged?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create team", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (teamId: string) => {
    if (!editName.trim()) return;
    setSavingId(teamId);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: editName.trim() })
        .eq('id', teamId);
      if (error) throw error;
      toast({ title: "Team renamed" });
      setEditingId(null);
      fetchTeams();
      onTeamsChanged?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to rename team", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Delete "${team.name}"? ${team.memberCount > 0 ? `This team has ${team.memberCount} member(s).` : ''}`)) return;
    setSavingId(team.id);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_deleted: true })
        .eq('id', team.id);
      if (error) throw error;
      toast({ title: "Team deleted", description: `"${team.name}" has been removed` });
      fetchTeams();
      onTeamsChanged?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete team", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Teams
          </DialogTitle>
          <DialogDescription>Create, rename, or remove teams</DialogDescription>
        </DialogHeader>

        {/* Create new team */}
        <div className="flex gap-2">
          <Input
            placeholder="New team name..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            disabled={creating}
          />
          <Button onClick={handleCreate} disabled={creating || !newTeamName.trim()} size="sm">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {/* Teams list */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No teams yet. Create one above.</p>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                {editingId === team.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(team.id)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(team.id)} disabled={savingId === team.id}>
                      {savingId === team.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(team.id); setEditName(team.name); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(team)} disabled={savingId === team.id}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
