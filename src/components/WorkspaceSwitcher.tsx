// [CMP-dcdd9f] WorkspaceSwitcher — workspace switcher component
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, RefreshCw, Users } from 'lucide-react';
import { workspaceService, UserWorkspace } from '@/services/workspaceService';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: (workspaceId: string) => void;
  className?: string;
}

export const WorkspaceSwitcher = ({ onWorkspaceChange, className }: WorkspaceSwitcherProps) => {
  const [workspaces, setWorkspaces] = useState<UserWorkspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // Listen for workspace changes from other components
  useEffect(() => {
    const interval = setInterval(() => {
      const currentId = workspaceService.getCurrentWorkspaceId();
      if (currentId !== currentWorkspaceId) {
        setCurrentWorkspaceId(currentId);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentWorkspaceId]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const userWorkspaces = workspaceService.getUserWorkspaces();
      setWorkspaces(userWorkspaces);
      setCurrentWorkspaceId(workspaceService.getCurrentWorkspaceId());
    } catch (error) {
      console.error('Error loading workspaces:', error);
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    if (workspaceId === currentWorkspaceId) return;

    try {
      setLoading(true);
      const success = await workspaceService.setCurrentWorkspace(workspaceId);
      
      if (success) {
        setCurrentWorkspaceId(workspaceId);
        onWorkspaceChange?.(workspaceId);
        
        toast({
          title: "Workspace Changed",
          description: `Switched to ${workspaceService.getWorkspaceNameById(workspaceId)}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to switch workspace",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
      toast({
        title: "Error",
        description: "Failed to switch workspace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await workspaceService.refresh();
      await loadWorkspaces();
      
      toast({
        title: "Refreshed",
        description: "Workspace data updated",
      });
    } catch (error) {
      console.error('Error refreshing workspaces:', error);
      toast({
        title: "Error",
        description: "Failed to refresh workspaces",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="ml-2">Admin</Badge>;
      case 'member':
        return <Badge variant="secondary" className="ml-2">Member</Badge>;
      case 'viewer':
        return <Badge variant="outline" className="ml-2">Viewer</Badge>;
      default:
        return null;
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No workspaces available</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Building className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentWorkspaceId || ''}
        onValueChange={handleWorkspaceChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[200px] bg-white/90 border-white/20 text-black">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((userWorkspace) => (
            <SelectItem key={userWorkspace.workspace_id} value={userWorkspace.workspace_id}>
              <div className="flex items-center justify-between w-full">
                <span>{userWorkspace.workspace.name}</span>
                {getRoleBadge(userWorkspace.role)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
        title="Refresh workspaces"
        className="text-primary-foreground hover:bg-white/20"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
