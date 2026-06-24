// [CMP-2f6d1e] WorkspaceContext — workspace context component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Users, CheckCircle, Settings } from 'lucide-react';
import { workspaceService } from '@/services/workspaceService';
import { useState, useEffect } from 'react';

export const WorkspaceContext = () => {
  const [workspaceId, setWorkspaceId] = useState(workspaceService.getCurrentWorkspaceId());
  const [projectId, setProjectId] = useState(workspaceService.getCurrentProjectId());

  useEffect(() => {
    // Update state when workspace changes (event-driven, no polling)
    const unsubscribe = workspaceService.subscribe(() => {
      setWorkspaceId(workspaceService.getCurrentWorkspaceId());
      setProjectId(workspaceService.getCurrentProjectId());
    });

    return unsubscribe;
  }, []);

  const handleLogContext = () => {
    workspaceService.logContext();
  };

  const isCapwell = workspaceService.isCapwellWorkspace();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Workspace Context
        </CardTitle>
        <CardDescription>
          Current workspace and project configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Workspace Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Workspace:</span>
              <Badge 
                variant={isCapwell ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                {workspaceService.getWorkspaceName()}
              </Badge>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              ID: {workspaceId || 'Not set'}
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {workspaceService.getCurrentProjectId() ? 'Active Project' : 'No Project'}
              </Badge>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              ID: {projectId || 'Not set'}
            </div>
          </div>

          {/* Capwell Status */}
          {isCapwell && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Capwell Instore Activation Active</p>
                  <p className="text-xs mt-1">
                    All agent actions will be associated with the Capwell workspace and project.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Context Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogContext}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Log Context
            </Button>
          </div>

          {/* Debug Info */}
          <div className="text-xs font-mono space-y-1 p-2 bg-gray-50 rounded">
            <div>Workspace ID: {workspaceId || 'null'}</div>
            <div>Project ID: {projectId || 'null'}</div>
            <div>Is Capwell: {isCapwell ? 'true' : 'false'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
