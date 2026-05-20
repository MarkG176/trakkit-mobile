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
  active_components: Record<string, boolean | string> | null;
}

const WORKSPACE_STORAGE_KEY = 'trakkit_current_workspace_id';

class WorkspaceService {
  private currentWorkspaceId: string | null = null;
  private currentProjectId: string | null = null;
  private currentWorkspaceLabel: string | null = null;
  private userWorkspaces: UserWorkspace[] = [];
  private user: User | null = null;
  private initialized: boolean = false;

  constructor() {
    // Load saved workspace from localStorage on initialization
    this.currentWorkspaceId = this.loadSavedWorkspaceId();
    this.currentProjectId = null;
  }

  /**
   * Load saved workspace ID from localStorage
   */
  private loadSavedWorkspaceId(): string | null {
    try {
      return localStorage.getItem(WORKSPACE_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Save workspace ID to localStorage
   */
  private saveWorkspaceId(workspaceId: string | null): void {
    try {
      if (workspaceId) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
      } else {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Initialize the workspace service with user data
   */
  async initialize(user: User): Promise<void> {
    // Prevent re-initialization if already initialized with the same user
    if (this.initialized && this.user?.id === user.id) {
      console.log('🏢 Workspace service already initialized for user:', user.id);
      return;
    }

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

    // Store current workspace to preserve it during refresh
    const previousWorkspaceId = this.currentWorkspaceId;

    try {
      const { data, error } = await supabase
        .from('user_workspaces')
        .select(`
          id,
          user_id,
          workspace_id,
          role,
          active_components,
          created_at,
          workspace:workspaces!inner (
            id,
            name,
            description,
            created_at,
            updated_at,
            is_active
          )
        `)
        .eq('user_id', this.user.id)
        .eq('is_active', true)
        .eq('workspace.is_active', true)
        .order('created_at', { ascending: false });

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
        workspace: item.workspace as Workspace,
        active_components: (item as any).active_components ?? null
      }));

      // Preserve current workspace if it still exists in user's workspaces
      if (previousWorkspaceId && this.userWorkspaces.some(w => w.workspace_id === previousWorkspaceId)) {
        this.currentWorkspaceId = previousWorkspaceId;
        await this.loadCurrentWorkspaceLabel();
        console.log('🏢 Preserving current workspace:', this.getWorkspaceName());
        await this.loadProjectsForWorkspace(this.currentWorkspaceId);
      } else if (!this.currentWorkspaceId && this.userWorkspaces.length > 0) {
        // Only set default if no workspace was previously set
        this.currentWorkspaceId = this.userWorkspaces[0].workspace_id;
        await this.loadCurrentWorkspaceLabel();
        console.log('🏢 Default workspace set to:', this.userWorkspaces[0].workspace.name);
        await this.loadProjectsForWorkspace(this.currentWorkspaceId);
      } else if (this.currentWorkspaceId && this.userWorkspaces.length > 0) {
        // If workspace is already set, just ensure projects are loaded
        await this.loadCurrentWorkspaceLabel();
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
   * Get cached active component flags for the current workspace
   * (denormalized from project_plans.mobile_components via DB trigger).
   */
  getCurrentActiveComponents(): Record<string, boolean | string> | null {
    if (!this.currentWorkspaceId) return null;
    const uw = this.userWorkspaces.find(
      (w) => w.workspace_id === this.currentWorkspaceId
    );
    return uw?.active_components ?? null;
  }

  /**
   * Returns true when the current workspace is configured as in-store work location.
   */
  isCurrentWorkspaceInStoreMode(): boolean {
    const activeComponents = this.getCurrentActiveComponents();
    return activeComponents?.work_location === 'in_store';
  }

  /**
   * Load the current workspace label from the active project plan
   */
  private async loadCurrentWorkspaceLabel(): Promise<void> {
    this.currentWorkspaceLabel = null;
    if (!this.currentProjectId) return;
    try {
      const { data, error } = await supabase
        .from('project_plans')
        .select('team_label')
        .eq('id', this.currentProjectId)
        .single() as any;
      if (error) {
        console.error('Error loading current workspace label:', error);
        return;
      }
      this.currentWorkspaceLabel = data?.team_label ?? null;
      console.log('🏷️ Workspace label set to:', this.currentWorkspaceLabel);
    } catch (error) {
      console.error('Error loading current workspace label:', error);
    }
  }

  /**
   * Get current workspace label
   */
  getCurrentWorkspaceLabel(): string | null {
    return this.currentWorkspaceLabel;
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
    this.saveWorkspaceId(workspaceId);
    await this.loadCurrentWorkspaceLabel();
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
      await this.loadCurrentWorkspaceLabel();
    } catch (error) {
      console.error('Error loading projects for workspace:', error);
    }
  }

  /**
   * Set the current project
   */
  async setCurrentProject(projectId: string): Promise<void> {
    this.currentProjectId = projectId;
    await this.loadCurrentWorkspaceLabel();
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
