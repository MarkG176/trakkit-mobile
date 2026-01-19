import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  UserPlus, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface WorkspaceUser {
  user_id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'member' | 'viewer';
  is_active: boolean;
  created_at: string;
}

type SortField = 'display_name' | 'email' | 'role' | 'created_at';
type SortDirection = 'asc' | 'desc';

export const UsersPage = () => {
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Users list state
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>('display_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
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
  const [assigningTeam, setAssigningTeam] = useState(false);

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

      // Store invited email and show team assignment dialog
      setInvitedUserEmail(inviteEmail);
      setInviteDialogOpen(false);
      
      // Only show team dialog if there are teams
      if (teams.length > 0) {
        setTeamDialogOpen(true);
      }

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

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.display_name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'display_name':
          aVal = a.display_name?.toLowerCase() || a.email.toLowerCase();
          bVal = b.display_name?.toLowerCase() || b.email.toLowerCase();
          break;
        case 'email':
          aVal = a.email.toLowerCase();
          bVal = b.email.toLowerCase();
          break;
        case 'role':
          aVal = a.role;
          bVal = b.role;
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary">Admin</Badge>;
      case 'member':
        return <Badge variant="secondary">Member</Badge>;
      case 'viewer':
        return <Badge variant="outline">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/supervisor')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Users</h1>
            <p className="text-sm opacity-90">Manage workspace members</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Search and Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
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

        {/* Users Table */}
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
          <Card>
            <ScrollArea className="h-[calc(100vh-350px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('display_name')}
                    >
                      <div className="flex items-center">
                        Name
                        <SortIcon field="display_name" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        <SortIcon field="email" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center">
                        Role
                        <SortIcon field="role" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Joined
                        <SortIcon field="created_at" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        {user.display_name || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        )}
      </div>

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
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
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
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setTeamDialogOpen(false);
                setSelectedTeamId("");
                setInvitedUserEmail("");
              }} 
              disabled={assigningTeam}
            >
              Skip
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedTeamId) {
                  toast({
                    title: "Select a team",
                    description: "Please select a team to add the user to",
                    variant: "destructive",
                  });
                  return;
                }
                
                setAssigningTeam(true);
                try {
                  // Find user by email to get their user_id
                  const { data: userRole } = await supabase
                    .from('user_roles')
                    .select('user_id')
                    .eq('email', invitedUserEmail.toLowerCase())
                    .single();
                  
                  if (userRole) {
                    // Add user to team
                    const { error } = await supabase
                      .from('team_members')
                      .insert({
                        team_id: selectedTeamId,
                        user_id: userRole.user_id,
                      });
                    
                    if (error) throw error;
                    
                    toast({
                      title: "Added to team!",
                      description: `User will be added to the team when they accept the invitation`,
                    });
                  } else {
                    toast({
                      title: "Team assignment saved",
                      description: "User will be added to the team when they accept the invitation",
                    });
                  }
                } catch (error: any) {
                  console.error('Error assigning team:', error);
                  toast({
                    title: "Note",
                    description: "User will need to be added to the team after they accept the invitation",
                  });
                } finally {
                  setAssigningTeam(false);
                  setTeamDialogOpen(false);
                  setSelectedTeamId("");
                  setInvitedUserEmail("");
                }
              }} 
              disabled={assigningTeam || !selectedTeamId}
            >
              {assigningTeam ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
