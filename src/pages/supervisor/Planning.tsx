import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, Target, Users, TrendingUp, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  status: string;
  sales_target: number;
  duration_months: number;
  product_focus: string;
  agents_required: number;
  target_stores: string[] | null;
  created_at: string;
}

export const Planning = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchProjects();
    }
  }, [currentWorkspaceId]);

  const fetchProjects = async () => {
    if (!currentWorkspaceId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_plans')
        .select('*')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading projects",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const { error } = await supabase
        .from('project_plans')
        .update({ is_deleted: true })
        .eq('id', projectToDelete);

      if (error) throw error;

      toast({
        title: "Project deleted",
        description: "The project has been marked as deleted.",
      });

      setProjects(projects.filter(p => p.id !== projectToDelete));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'planning': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <SupervisorMobileLayout currentPage="planning">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Planning</h1>
            <p className="text-sm opacity-90">Project management and planning</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchProjects} />
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Active Projects</h2>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in workspace
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
        ) : projects.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No projects found in this workspace</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {project.project_name || project.client_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Client: {project.client_name}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sales Target</p>
                        <p className="font-semibold">{project.sales_target.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Agents</p>
                        <p className="font-semibold">{project.agents_required || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-semibold">{project.duration_months} months</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Stores</p>
                        <p className="font-semibold">{project.target_stores?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Product:</span> {project.product_focus}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => navigate(`/supervisor/project-details/${project.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setProjectToDelete(project.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the project as deleted. This action can be reversed by a database administrator if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SupervisorMobileLayout>
  );
};
