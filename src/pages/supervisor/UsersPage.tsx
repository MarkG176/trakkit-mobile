import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Search, 
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle,
  Plus
} from "lucide-react";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { UserCard } from "@/components/supervisor/UserCard";

interface WorkspaceUser {
  user_id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'member' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export const UsersPage = () => {
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  
  // Users list state
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteRole, setInviteRole] = useState<"agent" | "supervisor">("agent");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<WorkspaceUser | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  // Team assignment dialog state
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [invitedUserEmail, setInvitedUserEmail] = useState("");
  const [invitedUserId, setInvitedUserId] = useState<string | null>(null);
  const [assigningTeam, setAssigningTeam] = useState(false);
  const [isCreatingNewTeam, setIsCreatingNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Fetch users from workspace
  const fetchUsers = async () => {
    if (!currentWorkspaceId) return;
    
    setLoading(true);
    try {
      // Get all users in the workspace
      const { data: workspaceUsers, error: workspaceError } = await supabase
        .from('user_workspaces')
        .select('user_id, role, is_active, created_at')
        .eq('workspace_id', currentWorkspaceId);

      if (workspaceError) throw workspaceError;

      if (!workspaceUsers || workspaceUsers.length === 0) {
        setUsers([]);
        return;
      }

      // Get user details from user_roles
      const userIds = workspaceUsers.map(u => u.user_id);
      const { data: userDetails, error: detailsError } = await supabase
        .from('user_roles')
        .select('user_id, email, display_name')
        .in('user_id', userIds);

      if (detailsError) throw detailsError;

      // Merge data
      const mergedUsers: WorkspaceUser[] = workspaceUsers.map(wu => {
        const details = userDetails?.find(ud => ud.user_id === wu.user_id);
        return {
          user_id: wu.user_id,
          email: details?.email || 'Unknown',
          display_name: details?.display_name || null,
          role: wu.role as 'admin' | 'member' | 'viewer',
          is_active: wu.is_active ?? true,
          created_at: wu.created_at,
        };
      });

      setUsers(mergedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch teams for workspace
  const fetchTeams = async () => {
    if (!currentWorkspaceId) return;
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('workspace_id', currentWorkspaceId);
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, [currentWorkspaceId]);

  // Check if email exists in workspace
  const checkEmailExists = async (email: string) => {
    if (!email.trim() || !currentWorkspaceId) return;
    
    setCheckingEmail(true);
    setExistingUser(null);
    
    try {
      // Check in user_roles first
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('user_id, email, display_name')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (userRole) {
        // Check if this user is already in the workspace
        const { data: workspaceMember } = await supabase
          .from('user_workspaces')
          .select('user_id, role, is_active, created_at')
          .eq('workspace_id', currentWorkspaceId)
          .eq('user_id', userRole.user_id)
          .single();

        if (workspaceMember) {
          setExistingUser({
            user_id: userRole.user_id,
            email: userRole.email,
            display_name: userRole.display_name,
            role: workspaceMember.role as 'admin' | 'member' | 'viewer',
            is_active: workspaceMember.is_active ?? true,
            created_at: workspaceMember.created_at,
          });
        }
      }
    } catch (error) {
      // User doesn't exist, that's fine
    } finally {
      setCheckingEmail(false);
    }
  };

  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inviteEmail.includes('@')) {
        checkEmailExists(inviteEmail);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inviteEmail, currentWorkspaceId]);

  // Handle invite
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!currentWorkspaceId) {
      toast({
        title: "No workspace selected",
        description: "Please select a workspace first",
        variant: "destructive",
      });
      return;
    }

    if (existingUser) {
      toast({
        title: "User already exists",
        description: "This user is already in your workspace",
        variant: "destructive",
      });
      return;
    }

    setInviteLoading(true);
    try {
      // Send magic link invitation
      const { error: inviteError } = await supabase.auth.signInWithOtp({
        email: inviteEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            display_name: inviteDisplayName.trim() || undefined,
            invited_role: inviteRole,
            invited_workspace: currentWorkspaceId,
          },
        },
      });

      if (inviteError) throw inviteError;

      toast({
        title: "Invitation sent!",
        description: `A magic link has been sent to ${inviteEmail}`,
      });

      // Store invited email for team assignment
      setInvitedUserEmail(inviteEmail.trim().toLowerCase());
      
      // Try to find user ID from user_roles (may exist if already in system)
      const { data: existingUserRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();
      
      if (existingUserRole) {
        setInvitedUserId(existingUserRole.user_id);
      } else {
        setInvitedUserId(null);
      }
      
      setInviteDialogOpen(false);
      
      // Show team dialog - always show to allow assignment
      setTeamDialogOpen(true);

      // Reset invite form
      setInviteEmail("");
      setInviteDisplayName("");
      setInviteRole("agent");
      setExistingUser(null);
      
      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Filtered users (simple search, no sorting needed for cards)
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.display_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Users</h1>
            <p className="text-sm opacity-90">Manage workspace members</p>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <Card className="p-3 flex-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 flex-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.is_active).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No users found matching your search' : 'No users in this workspace'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.user_id}
                displayName={user.display_name}
                email={user.email}
                role={user.role}
                isActive={user.is_active}
              />
            ))}
          </div>
        )}
      </div>

      <SupervisorBottomNav />

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add User
            </DialogTitle>
            <DialogDescription>
              Send a magic link invitation to add a new team member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address *</Label>
              <div className="relative">
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteLoading}
                />
                {checkingEmail && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Existing user warning */}
              {existingUser && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">User already exists</p>
                    <p className="text-muted-foreground">
                      {existingUser.display_name || existingUser.email} is already a {existingUser.role} in this workspace
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inviteDisplayName">Display Name</Label>
              <Input
                id="inviteDisplayName"
                type="text"
                placeholder="John Doe"
                value={inviteDisplayName}
                onChange={(e) => setInviteDisplayName(e.target.value)}
                disabled={inviteLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={inviteRole} 
                onValueChange={(v) => setInviteRole(v as "agent" | "supervisor")} 
                disabled={inviteLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setInviteDialogOpen(false);
                setInviteEmail("");
                setInviteDisplayName("");
                setInviteRole("agent");
                setExistingUser(null);
              }} 
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInvite} 
              disabled={inviteLoading || !!existingUser}
            >
              {inviteLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Assignment Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={(open) => {
        setTeamDialogOpen(open);
        if (!open) {
          setIsCreatingNewTeam(false);
          setNewTeamName("");
          setSelectedTeamId("");
          setInvitedUserEmail("");
          setInvitedUserId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Add to Team
            </DialogTitle>
            <DialogDescription>
              Would you like to add {invitedUserEmail} to a team?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!isCreatingNewTeam ? (
              <>
                <div className="space-y-2">
                  <Label>Select Team</Label>
                  <Select 
                    value={selectedTeamId} 
                    onValueChange={setSelectedTeamId}
                    disabled={assigningTeam}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setIsCreatingNewTeam(true);
                    setSelectedTeamId("");
                  }}
                  disabled={assigningTeam}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Team
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Label>New Team Name</Label>
                <Input
                  placeholder="Enter team name..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  disabled={assigningTeam}
                />
                <Button 
                  variant="link" 
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => {
                    setIsCreatingNewTeam(false);
                    setNewTeamName("");
                  }}
                  disabled={assigningTeam}
                >
                  ← Back to team selection
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setTeamDialogOpen(false);
                setSelectedTeamId("");
                setInvitedUserEmail("");
                setIsCreatingNewTeam(false);
                setNewTeamName("");
              }} 
              disabled={assigningTeam}
            >
              Skip
            </Button>
            <Button 
              onClick={async () => {
                let teamIdToUse = selectedTeamId;
                
                // If creating new team, create it first
                if (isCreatingNewTeam) {
                  if (!newTeamName.trim()) {
                    toast({
                      title: "Team name required",
                      description: "Please enter a name for the new team",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  setAssigningTeam(true);
                  try {
                    const { data: newTeam, error: createError } = await supabase
                      .from('teams')
                      .insert({
                        name: newTeamName.trim(),
                        workspace_id: currentWorkspaceId,
                      })
                      .select('id')
                      .single();
                    
                    if (createError) throw createError;
                    teamIdToUse = newTeam.id;
                    
                    // Refresh teams list
                    fetchTeams();
                  } catch (error: any) {
                    console.error('Error creating team:', error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to create team",
                      variant: "destructive",
                    });
                    setAssigningTeam(false);
                    return;
                  }
                } else if (!selectedTeamId) {
                  toast({
                    title: "Select a team",
                    description: "Please select a team or create a new one",
                    variant: "destructive",
                  });
                  return;
                }
                
                setAssigningTeam(true);
                try {
                  // Use stored user ID if available, otherwise try to find by email
                  let userIdToAssign = invitedUserId;
                  
                  if (!userIdToAssign) {
                    const { data: userRole } = await supabase
                      .from('user_roles')
                      .select('user_id')
                      .eq('email', invitedUserEmail)
                      .single();
                    
                    userIdToAssign = userRole?.user_id || null;
                  }
                  
                  if (userIdToAssign) {
                    // Add user to team with correct column names
                    const { error } = await supabase
                      .from('team_members')
                      .insert({
                        team_id: teamIdToUse,
                        agent_id: userIdToAssign,
                        workspace_id: currentWorkspaceId,
                      });
                    
                    if (error) throw error;
                    
                    toast({
                      title: "Added to team!",
                      description: isCreatingNewTeam 
                        ? `Created "${newTeamName}" and added user to the team`
                        : `User has been added to the team`,
                    });
                  } else {
                    // User doesn't exist yet - they need to accept the invitation first
                    toast({
                      title: isCreatingNewTeam ? "Team created!" : "Team selected",
                      description: "The user will need to be added to the team after they accept the invitation",
                    });
                  }
                } catch (error: any) {
                  console.error('Error assigning team:', error);
                  toast({
                    title: "Error",
                    description: error.message || "Failed to assign user to team",
                    variant: "destructive",
                  });
                } finally {
                  setAssigningTeam(false);
                  setTeamDialogOpen(false);
                  setSelectedTeamId("");
                  setInvitedUserEmail("");
                  setInvitedUserId(null);
                  setIsCreatingNewTeam(false);
                  setNewTeamName("");
                }
              }} 
              disabled={assigningTeam || (!selectedTeamId && !isCreatingNewTeam) || (isCreatingNewTeam && !newTeamName.trim())}
            >
              {assigningTeam ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {isCreatingNewTeam ? "Create & Add" : "Add to Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
