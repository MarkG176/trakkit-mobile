/**
 * Workspace service for managing workspace context and operations
 */

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  start_date: string;
  target_areas: string[] | null;
  workspace_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

class WorkspaceService {
  private currentWorkspaceId: string | null = null;
  private currentProjectId: string | null = null;

  constructor() {
    // Initialize with Capwell workspace by default
    this.currentWorkspaceId = 'capwell-workspace-id';
    this.currentProjectId = 'capwell-project-id';
  }

  /**
   * Get the current workspace ID
   */
  getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }

  /**
   * Get the current project ID
   */
  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }

  /**
   * Set the current workspace
   */
  setCurrentWorkspace(workspaceId: string): void {
    this.currentWorkspaceId = workspaceId;
    console.log('🏢 Workspace changed to:', workspaceId);
  }

  /**
   * Set the current project
   */
  setCurrentProject(projectId: string): void {
    this.currentProjectId = projectId;
    console.log('📋 Project changed to:', projectId);
  }

  /**
   * Get workspace context for database operations
   */
  getWorkspaceContext(): { workspace_id: string } | {} {
    return this.currentWorkspaceId ? { workspace_id: this.currentWorkspaceId } : {};
  }

  /**
   * Get project context for database operations
   */
  getProjectContext(): { project_id: string } | {} {
    return this.currentProjectId ? { project_id: this.currentProjectId } : {};
  }

  /**
   * Get combined workspace and project context
   */
  getFullContext(): { workspace_id?: string; project_id?: string } {
    const context: { workspace_id?: string; project_id?: string } = {};
    
    if (this.currentWorkspaceId) {
      context.workspace_id = this.currentWorkspaceId;
    }
    
    if (this.currentProjectId) {
      context.project_id = this.currentProjectId;
    }
    
    return context;
  }

  /**
   * Ensure agent action includes workspace ID
   */
  ensureWorkspaceContext(data: any): any {
    const workspaceContext = this.getWorkspaceContext();
    return {
      ...data,
      ...workspaceContext
    };
  }

  /**
   * Ensure sales record includes workspace and project context
   */
  ensureSalesContext(data: any): any {
    const fullContext = this.getFullContext();
    return {
      ...data,
      ...fullContext
    };
  }

  /**
   * Check if we're using Capwell workspace
   */
  isCapwellWorkspace(): boolean {
    return this.currentWorkspaceId === 'capwell-workspace-id';
  }

  /**
   * Get workspace name
   */
  getWorkspaceName(): string {
    switch (this.currentWorkspaceId) {
      case 'capwell-workspace-id':
        return 'Capwell';
      default:
        return 'Unknown Workspace';
    }
  }

  /**
   * Get project name
   */
  getProjectName(): string {
    switch (this.currentProjectId) {
      case 'capwell-project-id':
        return 'Capwell Instore Activation';
      default:
        return 'Unknown Project';
    }
  }

  /**
   * Log workspace context for debugging
   */
  logContext(): void {
    console.log('🏢 Current Workspace Context:', {
      workspace_id: this.currentWorkspaceId,
      workspace_name: this.getWorkspaceName(),
      project_id: this.currentProjectId,
      project_name: this.getProjectName(),
      is_capwell: this.isCapwellWorkspace()
    });
  }
}

// Export singleton instance
export const workspaceService = new WorkspaceService();

// Export types
export type { Workspace, Project };
