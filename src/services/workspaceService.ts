/**
 * Workspace service for managing workspace context and operations
 */

import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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

interface UserWorkspace {
  id: string;
  user_id: string;
  workspace_id: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
  workspace: Workspace;
}

class WorkspaceService {
  private currentWorkspaceId: string | null = null;
  private currentProjectId: string | null = null;
  private userWorkspaces: UserWorkspace[] = [];
  private user: User | null = null;
  private initialized: boolean = false;

  constructor() {
    // Will be initialized when user logs in
    this.currentWorkspaceId = null;
    this.currentProjectId = null;
  }

  /**
   * Initialize the workspace service with user data
   */
  async initialize(user: User): Promise<void> {
    this.user = user;
    await this.loadUserWorkspaces();
    this.initialized = true;
  }

  /**
   * Load user's accessible workspaces
   */
  async loadUserWorkspaces(): Promise<void> {
    if (!this.user) {
      console.warn('No user provided to load workspaces');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_workspaces')
        .select(`
          id,
          user_id,
          workspace_id,
          role,
          created_at,
          workspace:workspaces (
            id,
            name,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', this.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading user workspaces:', error);
        this.userWorkspaces = [];
        return;
      }

      // Transform the data to match UserWorkspace interface
      this.userWorkspaces = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        workspace_id: item.workspace_id,
        role: item.role as 'admin' | 'member' | 'viewer',
        joined_at: item.created_at,
        workspace: item.workspace as Workspace
      }));

      // If no workspace is currently set, set the first one as default
      if (!this.currentWorkspaceId && this.userWorkspaces.length > 0) {
        this.currentWorkspaceId = this.userWorkspaces[0].workspace_id;
        console.log('🏢 Default workspace set to:', this.userWorkspaces[0].workspace.name);
        
        // Load projects for the default workspace
        await this.loadProjectsForWorkspace(this.currentWorkspaceId);
      } else if (this.currentWorkspaceId && this.userWorkspaces.length > 0) {
        // If workspace is already set, just ensure projects are loaded
        console.log('🏢 Workspace already set, maintaining:', this.getWorkspaceName());
        await this.loadProjectsForWorkspace(this.currentWorkspaceId);
      }
    } catch (error) {
      console.error('Error loading user workspaces:', error);
      this.userWorkspaces = [];
    }
  }

  /**
   * Check if user has access to a workspace
   */
  hasWorkspaceAccess(workspaceId: string): boolean {
    return this.userWorkspaces.some(uw => uw.workspace_id === workspaceId);
  }

  /**
   * Get user's accessible workspaces
   */
  getUserWorkspaces(): UserWorkspace[] {
    return this.userWorkspaces;
  }

  /**
   * Get current user's role in the current workspace
   */
  getCurrentWorkspaceRole(): 'admin' | 'member' | 'viewer' | null {
    if (!this.currentWorkspaceId) return null;
    
    const userWorkspace = this.userWorkspaces.find(
      uw => uw.workspace_id === this.currentWorkspaceId
    );
    
    return userWorkspace?.role || null;
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
  async setCurrentWorkspace(workspaceId: string): Promise<boolean> {
    if (!this.hasWorkspaceAccess(workspaceId)) {
      console.warn('User does not have access to workspace:', workspaceId);
      return false;
    }

    this.currentWorkspaceId = workspaceId;
    console.log('🏢 Workspace changed to:', workspaceId);
    
    // Load projects for the new workspace
    await this.loadProjectsForWorkspace(workspaceId);
    
    return true;
  }

  /**
   * Load projects for a specific workspace
   */
  private async loadProjectsForWorkspace(workspaceId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, start_date, target_areas')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading projects for workspace:', error);
        return;
      }

      // Set the first project as current, or null if none exist
      this.currentProjectId = data?.[0]?.id || null;
    } catch (error) {
      console.error('Error loading projects for workspace:', error);
    }
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
    if (!this.currentWorkspaceId) {
      throw new Error('No workspace selected. Please select a workspace first.');
    }
    
    const workspaceContext = this.getWorkspaceContext();
    return {
      ...data,
      ...workspaceContext
    };
  }

  /**
   * Check if workspace service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get workspace name by ID
   */
  getWorkspaceNameById(workspaceId: string): string {
    const userWorkspace = this.userWorkspaces.find(uw => uw.workspace_id === workspaceId);
    return userWorkspace?.workspace.name || 'Unknown Workspace';
  }

  /**
   * Refresh workspace data
   */
  async refresh(): Promise<void> {
    if (this.user) {
      await this.loadUserWorkspaces();
    }
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
   * Check if we're using Capwell workspace (legacy support)
   */
  isCapwellWorkspace(): boolean {
    // Check if workspace name contains 'Capwell'
    const currentWorkspace = this.userWorkspaces.find(
      uw => uw.workspace_id === this.currentWorkspaceId
    );
    return currentWorkspace?.workspace.name.toLowerCase().includes('capwell') || false;
  }

  /**
   * Get workspace name
   */
  getWorkspaceName(): string {
    if (!this.currentWorkspaceId) return 'No Workspace';
    
    const userWorkspace = this.userWorkspaces.find(
      uw => uw.workspace_id === this.currentWorkspaceId
    );
    
    return userWorkspace?.workspace.name || 'Unknown Workspace';
  }

  /**
   * Get project name
   */
  getProjectName(): string {
    // Return a simple name, async fetch will be handled separately if needed
    return 'Current Project';
  }
  
  /**
   * Get project name async
   */
  async getProjectNameAsync(): Promise<string> {
    if (!this.currentProjectId) return 'No Project';
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('name')
        .eq('id', this.currentProjectId)
        .single();
      
      if (error) throw error;
      return data?.name || 'Unknown Project';
    } catch (error) {
      console.error('Error fetching project name:', error);
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
export type { Workspace, Project, UserWorkspace };
