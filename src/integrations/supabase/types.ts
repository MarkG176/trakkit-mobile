export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          category: string
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          ip_address: string | null
          status: string
          user_agent: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action: string
          category: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string
          user_agent?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          agent_id: string
          created_at: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          performed_at: string | null
          points_earned: number | null
          workspace_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          agent_id: string
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          performed_at?: string | null
          points_earned?: number | null
          workspace_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          agent_id?: string
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          performed_at?: string | null
          points_earned?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_availability: {
        Row: {
          agent_id: string
          availability_type: string
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          is_available: boolean | null
          reason: string | null
          start_time: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          availability_type?: string
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          reason?: string | null
          start_time?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          availability_type?: string
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          reason?: string | null
          start_time?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_availability_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_battery_status: {
        Row: {
          agent_id: string
          app_version: string | null
          battery_level: number | null
          created_at: string | null
          device_model: string | null
          id: string
          is_charging: boolean | null
          last_sync: string | null
          location_lat: number | null
          location_lng: number | null
          network_status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          app_version?: string | null
          battery_level?: number | null
          created_at?: string | null
          device_model?: string | null
          id?: string
          is_charging?: boolean | null
          last_sync?: string | null
          location_lat?: number | null
          location_lng?: number | null
          network_status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          app_version?: string | null
          battery_level?: number | null
          created_at?: string | null
          device_model?: string | null
          id?: string
          is_charging?: boolean | null
          last_sync?: string | null
          location_lat?: number | null
          location_lng?: number | null
          network_status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_battery_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_device_status: {
        Row: {
          agent_id: string
          battery_level: number | null
          created_at: string | null
          device_info: Json | null
          id: string
          is_charging: boolean | null
          last_update: string | null
          location_lat: number | null
          location_lng: number | null
          profile_image_url: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          battery_level?: number | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_charging?: boolean | null
          last_update?: string | null
          location_lat?: number | null
          location_lng?: number | null
          profile_image_url?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          battery_level?: number | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          is_charging?: boolean | null
          last_update?: string | null
          location_lat?: number | null
          location_lng?: number | null
          profile_image_url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_device_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_kpi_results: {
        Row: {
          agent_id: string
          created_at: string | null
          date: string
          id: string
          kpi_id: string
          target_value: number | null
          value: number
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          date: string
          id?: string
          kpi_id: string
          target_value?: number | null
          value: number
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          date?: string
          id?: string
          kpi_id?: string
          target_value?: number | null
          value?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_kpi_results_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_kpi_results_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ranks: {
        Row: {
          achievements: Json | null
          agent_id: string
          badges: Json | null
          created_at: string | null
          current_rank: string | null
          id: string
          last_rank_update: string | null
          monthly_points: number | null
          rank_level: number | null
          total_points: number | null
          updated_at: string | null
          weekly_points: number | null
          workspace_id: string | null
        }
        Insert: {
          achievements?: Json | null
          agent_id: string
          badges?: Json | null
          created_at?: string | null
          current_rank?: string | null
          id?: string
          last_rank_update?: string | null
          monthly_points?: number | null
          rank_level?: number | null
          total_points?: number | null
          updated_at?: string | null
          weekly_points?: number | null
          workspace_id?: string | null
        }
        Update: {
          achievements?: Json | null
          agent_id?: string
          badges?: Json | null
          created_at?: string | null
          current_rank?: string | null
          id?: string
          last_rank_update?: string | null
          monthly_points?: number | null
          rank_level?: number | null
          total_points?: number | null
          updated_at?: string | null
          weekly_points?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_ranks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_report_summary: {
        Row: {
          agent_id: string
          agent_name: string
          check_ins_count: number | null
          created_at: string | null
          id: string
          interactions_count: number | null
          net_work_minutes: number | null
          notes_count: number | null
          recent_notes: Json | null
          report_date: string
          total_lunch_minutes: number | null
          total_segments: number | null
          total_work_minutes: number | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          check_ins_count?: number | null
          created_at?: string | null
          id?: string
          interactions_count?: number | null
          net_work_minutes?: number | null
          notes_count?: number | null
          recent_notes?: Json | null
          report_date?: string
          total_lunch_minutes?: number | null
          total_segments?: number | null
          total_work_minutes?: number | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          check_ins_count?: number | null
          created_at?: string | null
          id?: string
          interactions_count?: number | null
          net_work_minutes?: number | null
          notes_count?: number | null
          recent_notes?: Json | null
          report_date?: string
          total_lunch_minutes?: number | null
          total_segments?: number | null
          total_work_minutes?: number | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_report_summary_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_status_log: {
        Row: {
          agent_display_name: string | null
          agent_id: string
          assigned_location_lat: number | null
          assigned_location_lng: number | null
          check_in_successful: boolean | null
          created_at: string | null
          distance_from_assigned: number | null
          id: string
          in_range: boolean | null
          location_lat: number | null
          location_lng: number | null
          selfie_url: string | null
          status: string
          store_id: string | null
          team_id: string | null
          timestamp: string
          workspace_id: string | null
        }
        Insert: {
          agent_display_name?: string | null
          agent_id: string
          assigned_location_lat?: number | null
          assigned_location_lng?: number | null
          check_in_successful?: boolean | null
          created_at?: string | null
          distance_from_assigned?: number | null
          id?: string
          in_range?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          selfie_url?: string | null
          status: string
          store_id?: string | null
          team_id?: string | null
          timestamp?: string
          workspace_id?: string | null
        }
        Update: {
          agent_display_name?: string | null
          agent_id?: string
          assigned_location_lat?: number | null
          assigned_location_lng?: number | null
          check_in_successful?: boolean | null
          created_at?: string | null
          distance_from_assigned?: number | null
          id?: string
          in_range?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          selfie_url?: string | null
          status?: string
          store_id?: string | null
          team_id?: string | null
          timestamp?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_status_log_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_status_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_status_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_task_inventory: {
        Row: {
          agent_id: string | null
          amount_issued: number
          created_at: string
          id: string
          is_deleted: boolean | null
          name: string | null
          product_variant_id: string
          products: Json | null
          task_id: string
        }
        Insert: {
          agent_id?: string | null
          amount_issued?: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          name?: string | null
          product_variant_id?: string
          products?: Json | null
          task_id?: string
        }
        Update: {
          agent_id?: string | null
          amount_issued?: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          name?: string | null
          product_variant_id?: string
          products?: Json | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_inventory_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_task_inventory_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string | null
          assigned_product_variant_id: string | null
          completed_at: string | null
          created_at: string | null
          day_plan_id: string | null
          id: string
          individual_sales_target: number
          is_deleted: boolean | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          assigned_product_variant_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          day_plan_id?: string | null
          id?: string
          individual_sales_target: number
          is_deleted?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          assigned_product_variant_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          day_plan_id?: string | null
          id?: string
          individual_sales_target?: number
          is_deleted?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agent_tasks_assigned_product_variant_id_fkey"
            columns: ["assigned_product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_day_plan_id_fkey"
            columns: ["day_plan_id"]
            isOneToOne: false
            referencedRelation: "day_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_work_segments: {
        Row: {
          agent_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          segment_end: string | null
          segment_start: string
          segment_type: string
          updated_at: string | null
          work_date: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          segment_end?: string | null
          segment_start: string
          segment_type: string
          updated_at?: string | null
          work_date: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          segment_end?: string | null
          segment_start?: string
          segment_type?: string
          updated_at?: string | null
          work_date?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_work_segments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_metrics: {
        Row: {
          created_at: string | null
          dimensions: Json | null
          id: string
          metric_type: string
          metric_value: number
          recorded_date: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metric_type: string
          metric_value: number
          recorded_date: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metric_type?: string
          metric_value?: number
          recorded_date?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_metrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          ambassador_id: string
          county: string
          estate: string
          id: string
          name: string
          number: string
          sub_county: string
          type: string
          visited_at: string
          workspace_id: string | null
        }
        Insert: {
          ambassador_id: string
          county: string
          estate: string
          id?: string
          name: string
          number: string
          sub_county: string
          type?: string
          visited_at?: string
          workspace_id?: string | null
        }
        Update: {
          ambassador_id?: string
          county?: string
          estate?: string
          id?: string
          name?: string
          number?: string
          sub_county?: string
          type?: string
          visited_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          center_lat: number
          center_lng: number
          created_at: string
          id: string
          is_deleted: boolean | null
          name: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          center_lat: number
          center_lng: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          name: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          center_lat?: number
          center_lng?: number
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          name?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string
          area_id: string | null
          created_at: string
          id: string
          is_deleted: boolean | null
          latitude: number
          longitude: number
          name: string
          type: string
          updated_at: string
          visit_status: string
          workspace_id: string | null
        }
        Insert: {
          address: string
          area_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          latitude: number
          longitude: number
          name: string
          type: string
          updated_at?: string
          visit_status?: string
          workspace_id?: string | null
        }
        Update: {
          address?: string
          area_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          type?: string
          updated_at?: string
          visit_status?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_requests: {
        Row: {
          agent_id: string
          id: string
          notes: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          task_id: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          id?: string
          notes?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          task_id: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          id?: string
          notes?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          task_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sync_operations: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          operation_type: string
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id: string
          operation_type: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          operation_type?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      customer_purchases: {
        Row: {
          agent_id: string
          created_at: string | null
          customer_id: string
          customer_name: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          product_variant_id: string | null
          project_id: string | null
          purchase_date: string | null
          quantity: number
          store_id: string | null
          total_value: number
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          customer_id: string
          customer_name?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          product_variant_id?: string | null
          project_id?: string | null
          purchase_date?: string | null
          quantity?: number
          store_id?: string | null
          total_value?: number
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          customer_id?: string
          customer_name?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          product_variant_id?: string | null
          project_id?: string | null
          purchase_date?: string | null
          quantity?: number
          store_id?: string | null
          total_value?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_purchases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_purchases_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "customer_purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_purchases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          county: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          location_lat: number | null
          location_lng: number | null
          name: string
          phone: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          county?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          phone?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          county?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales_tracking: {
        Row: {
          agent_id: string
          agent_name: string | null
          created_at: string | null
          id: string
          product_name: string | null
          product_variant_id: string
          project_id: string | null
          quantity_sold: number
          recorded_at: string
          status_event: string
          total_value: number
          unit_price: number | null
          work_date: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          agent_name?: string | null
          created_at?: string | null
          id?: string
          product_name?: string | null
          product_variant_id: string
          project_id?: string | null
          quantity_sold?: number
          recorded_at?: string
          status_event: string
          total_value?: number
          unit_price?: number | null
          work_date?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          agent_name?: string | null
          created_at?: string | null
          id?: string
          product_name?: string | null
          product_variant_id?: string
          project_id?: string | null
          quantity_sold?: number
          recorded_at?: string
          status_event?: string
          total_value?: number
          unit_price?: number | null
          work_date?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_tracking_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_sales_tracking_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stock_reports: {
        Row: {
          agent_id: string
          closing_stock: number | null
          created_at: string
          id: string
          notes: string | null
          opening_stock: number | null
          product_variant_id: string
          quantity_sold: number | null
          report_type: string
          reported_at: string
          stock_level: string | null
          store_id: string | null
          work_date: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          closing_stock?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opening_stock?: number | null
          product_variant_id: string
          quantity_sold?: number | null
          report_type: string
          reported_at?: string
          stock_level?: string | null
          store_id?: string | null
          work_date?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          closing_stock?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opening_stock?: number | null
          product_variant_id?: string
          quantity_sold?: number | null
          report_type?: string
          reported_at?: string
          stock_level?: string | null
          store_id?: string | null
          work_date?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_stock_reports_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_stock_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_stock_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      day_plans: {
        Row: {
          area_name: string
          created_at: string | null
          date: string
          id: string
          is_deleted: boolean | null
          notes: string | null
          project_id: string | null
          status: string | null
          supervisor_id: string | null
          team_id: string | null
          total_sales_target: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          area_name: string
          created_at?: string | null
          date: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          project_id?: string | null
          status?: string | null
          supervisor_id?: string | null
          team_id?: string | null
          total_sales_target?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          area_name?: string
          created_at?: string | null
          date?: string
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          project_id?: string | null
          status?: string | null
          supervisor_id?: string | null
          team_id?: string | null
          total_sales_target?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "day_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "day_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          contact: string
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
        }
        Insert: {
          contact: string
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
        }
        Update: {
          contact?: string
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
        }
        Relationships: []
      }
      giveaways: {
        Row: {
          agent_id: string
          created_at: string
          customer_interest_level: string | null
          engagement_duration: number | null
          engagement_quality: string | null
          follow_up_required: boolean | null
          id: string
          is_deleted: boolean | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          products_given: Json
          project_id: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recorded_at: string
          store_id: string | null
          total_items: number
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          customer_interest_level?: string | null
          engagement_duration?: number | null
          engagement_quality?: string | null
          follow_up_required?: boolean | null
          id?: string
          is_deleted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          products_given?: Json
          project_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recorded_at?: string
          store_id?: string | null
          total_items?: number
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          customer_interest_level?: string | null
          engagement_duration?: number | null
          engagement_quality?: string | null
          follow_up_required?: boolean | null
          id?: string
          is_deleted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          products_given?: Json
          project_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recorded_at?: string
          store_id?: string | null
          total_items?: number
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaways_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaways_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "giveaways_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      google_invite_forms: {
        Row: {
          created_at: string
          created_by: string
          default_role: string | null
          default_team_id: string | null
          form_id: string
          form_url: string
          id: string
          is_active: boolean
          is_deleted: boolean
          last_processed_at: string | null
          responder_url: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_role?: string | null
          default_team_id?: string | null
          form_id: string
          form_url: string
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          last_processed_at?: string | null
          responder_url: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_role?: string | null
          default_team_id?: string | null
          form_id?: string
          form_url?: string
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          last_processed_at?: string | null
          responder_url?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          google_email: string | null
          id: string
          is_deleted: boolean
          refresh_token: string | null
          scopes: string[] | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          google_email?: string | null
          id?: string
          is_deleted?: boolean
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          google_email?: string | null
          id?: string
          is_deleted?: boolean
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      google_sheet_links: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_deleted: boolean
          last_synced_at: string | null
          resource_type: string
          sheet_id: string
          sheet_url: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_deleted?: boolean
          last_synced_at?: string | null
          resource_type: string
          sheet_id: string
          sheet_url: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_deleted?: boolean
          last_synced_at?: string | null
          resource_type?: string
          sheet_id?: string
          sheet_url?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          agent_id: string | null
          contact_method: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          follow_up_required: boolean | null
          id: string
          image_metadata: Json | null
          image_url: string | null
          interaction_data: Json | null
          interaction_type: string | null
          is_deleted: boolean | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          next_action: string | null
          outcome: string | null
          priority: string | null
          product_variant_id: string | null
          quantity_sold: number
          sale_value: number | null
          store_id: string | null
          survey_template_id: string | null
          task_id: string | null
          timestamp: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          contact_method?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          follow_up_required?: boolean | null
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          interaction_data?: Json | null
          interaction_type?: string | null
          is_deleted?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          next_action?: string | null
          outcome?: string | null
          priority?: string | null
          product_variant_id?: string | null
          quantity_sold: number
          sale_value?: number | null
          store_id?: string | null
          survey_template_id?: string | null
          task_id?: string | null
          timestamp?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          contact_method?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          follow_up_required?: boolean | null
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          interaction_data?: Json | null
          interaction_type?: string | null
          is_deleted?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          next_action?: string | null
          outcome?: string | null
          priority?: string | null
          product_variant_id?: string | null
          quantity_sold?: number
          sale_value?: number | null
          store_id?: string | null
          survey_template_id?: string | null
          task_id?: string | null
          timestamp?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_survey_template_id_fkey"
            columns: ["survey_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sessions: {
        Row: {
          agent_id: string
          created_at: string
          date: string
          id: string
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          date?: string
          id?: string
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          date?: string
          id?: string
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          product_id: string
          qty: number
          reference: string | null
          type: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          product_id: string
          qty: number
          reference?: string | null
          type: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          product_id?: string
          qty?: number
          reference?: string | null
          type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          description: string | null
          formula: string
          id: string
          is_agent_kpi: boolean | null
          is_team_kpi: boolean | null
          name: string
          unit: string
        }
        Insert: {
          description?: string | null
          formula: string
          id?: string
          is_agent_kpi?: boolean | null
          is_team_kpi?: boolean | null
          name: string
          unit: string
        }
        Update: {
          description?: string | null
          formula?: string
          id?: string
          is_agent_kpi?: boolean | null
          is_team_kpi?: boolean | null
          name?: string
          unit?: string
        }
        Relationships: []
      }
      location_area_mappings: {
        Row: {
          area_id: string
          country: string
          county_name: string
          created_at: string
          id: string
          is_default: boolean | null
          sub_county_name: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          area_id: string
          country?: string
          county_name: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          sub_county_name: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          area_id?: string
          country?: string
          county_name?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          sub_county_name?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_area_mappings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_area_mappings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          created_at: string | null
          email: string | null
          event_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          event_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          event_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          agent_id: string | null
          contact_email: string | null
          contact_phone: string | null
          content: string
          created_at: string | null
          customer_name: string | null
          follow_up_date: string | null
          id: string
          interaction_id: string | null
          is_deleted: boolean | null
          is_private: boolean | null
          metadata: Json | null
          note_type: string | null
          priority: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          content: string
          created_at?: string | null
          customer_name?: string | null
          follow_up_date?: string | null
          id?: string
          interaction_id?: string | null
          is_deleted?: boolean | null
          is_private?: boolean | null
          metadata?: Json | null
          note_type?: string | null
          priority?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          content?: string
          created_at?: string | null
          customer_name?: string | null
          follow_up_date?: string | null
          id?: string
          interaction_id?: string | null
          is_deleted?: boolean | null
          is_private?: boolean | null
          metadata?: Json | null
          note_type?: string | null
          priority?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          agent_id: string
          base_salary: number | null
          bonus_amount: number | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          days_present: number | null
          days_worked: number | null
          deductions: number | null
          end_date: string
          id: string
          notes: string | null
          payment_reference: string | null
          performance_metrics: Json | null
          start_date: string
          status: string | null
          supervisor_id: string | null
          total_payout: number | null
          total_sales_amount: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          base_salary?: number | null
          bonus_amount?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          days_present?: number | null
          days_worked?: number | null
          deductions?: number | null
          end_date: string
          id?: string
          notes?: string | null
          payment_reference?: string | null
          performance_metrics?: Json | null
          start_date: string
          status?: string | null
          supervisor_id?: string | null
          total_payout?: number | null
          total_sales_amount?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          base_salary?: number | null
          bonus_amount?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          days_present?: number | null
          days_worked?: number | null
          deductions?: number | null
          end_date?: string
          id?: string
          notes?: string | null
          payment_reference?: string | null
          performance_metrics?: Json | null
          start_date?: string
          status?: string | null
          supervisor_id?: string | null
          total_payout?: number | null
          total_sales_amount?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_returns: {
        Row: {
          actual_returns: Json | null
          agent_id: string
          confirmation_notes: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          confirmed_qty: Json | null
          created_at: string | null
          day_plan_id: string | null
          discrepancy_reason: string | null
          expected_returns: Json
          id: string
          return_date: string | null
          selfie_metadata: Json | null
          selfie_url: string | null
          session_id: string | null
          status: string | null
          supervisor_confirmed: boolean | null
          supervisor_id: string | null
          updated_at: string | null
          warehouse_notes: string | null
          warehouse_photo_url: string | null
          workspace_id: string | null
        }
        Insert: {
          actual_returns?: Json | null
          agent_id: string
          confirmation_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_qty?: Json | null
          created_at?: string | null
          day_plan_id?: string | null
          discrepancy_reason?: string | null
          expected_returns?: Json
          id?: string
          return_date?: string | null
          selfie_metadata?: Json | null
          selfie_url?: string | null
          session_id?: string | null
          status?: string | null
          supervisor_confirmed?: boolean | null
          supervisor_id?: string | null
          updated_at?: string | null
          warehouse_notes?: string | null
          warehouse_photo_url?: string | null
          workspace_id?: string | null
        }
        Update: {
          actual_returns?: Json | null
          agent_id?: string
          confirmation_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_qty?: Json | null
          created_at?: string | null
          day_plan_id?: string | null
          discrepancy_reason?: string | null
          expected_returns?: Json
          id?: string
          return_date?: string | null
          selfie_metadata?: Json | null
          selfie_url?: string | null
          session_id?: string | null
          status?: string | null
          supervisor_confirmed?: boolean | null
          supervisor_id?: string | null
          updated_at?: string | null
          warehouse_notes?: string | null
          warehouse_photo_url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_returns_day_plan_id_fkey"
            columns: ["day_plan_id"]
            isOneToOne: false
            referencedRelation: "route_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_returns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_returns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          custom_price: number | null
          id: string
          is_deleted: boolean | null
          name: string
          price: number | null
          product_id: string | null
          sku: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_price?: number | null
          id?: string
          is_deleted?: boolean | null
          name: string
          price?: number | null
          product_id?: string | null
          sku?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_price?: number | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          price?: number | null
          product_id?: string | null
          sku?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          name: string
          project_id: string | null
          workspace_id: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          project_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          project_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_inventory: {
        Row: {
          created_at: string | null
          id: string
          product_variant_id: string | null
          project_id: string | null
          quantity_available: number | null
          quantity_sold: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_variant_id?: string | null
          project_id?: string | null
          quantity_available?: number | null
          quantity_sold?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_variant_id?: string | null
          project_id?: string | null
          quantity_available?: number | null
          quantity_sold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_inventory_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_inventory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_inventory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_plans: {
        Row: {
          activities: Json | null
          agents_required: number | null
          cached_active_agents: number | null
          cached_giveaway_count: number | null
          cached_product_breakdown: Json | null
          cached_total_sales: number | null
          cached_units_sold: number | null
          client_name: string
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_months: number
          end_date: string | null
          id: string
          is_deleted: boolean | null
          is_public: boolean | null
          metrics_updated_at: string | null
          mobile_components: Json
          phases: Json
          product_focus: string
          project_name: string | null
          project_type: string
          resource_requirements: Json | null
          sales_target: number
          start_date: string | null
          status: string
          supervisors_required: number | null
          target_market: string | null
          target_stores: string[] | null
          team_leaders: string[] | null
          total_doors_target: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activities?: Json | null
          agents_required?: number | null
          cached_active_agents?: number | null
          cached_giveaway_count?: number | null
          cached_product_breakdown?: Json | null
          cached_total_sales?: number | null
          cached_units_sold?: number | null
          client_name: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_months: number
          end_date?: string | null
          id?: string
          is_deleted?: boolean | null
          is_public?: boolean | null
          metrics_updated_at?: string | null
          mobile_components?: Json
          phases?: Json
          product_focus: string
          project_name?: string | null
          project_type?: string
          resource_requirements?: Json | null
          sales_target: number
          start_date?: string | null
          status?: string
          supervisors_required?: number | null
          target_market?: string | null
          target_stores?: string[] | null
          team_leaders?: string[] | null
          total_doors_target?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activities?: Json | null
          agents_required?: number | null
          cached_active_agents?: number | null
          cached_giveaway_count?: number | null
          cached_product_breakdown?: Json | null
          cached_total_sales?: number | null
          cached_units_sold?: number | null
          client_name?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_months?: number
          end_date?: string | null
          id?: string
          is_deleted?: boolean | null
          is_public?: boolean | null
          metrics_updated_at?: string | null
          mobile_components?: Json
          phases?: Json
          product_focus?: string
          project_name?: string | null
          project_type?: string
          resource_requirements?: Json | null
          sales_target?: number
          start_date?: string | null
          status?: string
          supervisors_required?: number | null
          target_market?: string | null
          target_stores?: string[] | null
          team_leaders?: string[] | null
          total_doors_target?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_report_cache: {
        Row: {
          created_at: string
          date_from: string
          date_to: string
          facts: Json | null
          generated_at: string
          id: string
          project_id: string | null
          report: string
          scope_hash: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date_from: string
          date_to: string
          facts?: Json | null
          generated_at?: string
          id?: string
          project_id?: string | null
          report: string
          scope_hash?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          date_from?: string
          date_to?: string
          facts?: Json | null
          generated_at?: string
          id?: string
          project_id?: string | null
          report?: string
          scope_hash?: string
          workspace_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_name: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_deleted: boolean | null
          name: string
          start_date: string
          target_areas: string[] | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_deleted?: boolean | null
          name: string
          start_date: string
          target_areas?: string[] | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_deleted?: boolean | null
          name?: string
          start_date?: string
          target_areas?: string[] | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          agent_id: string
          created_at: string
          generated_at: string
          id: string
          metrics: Json
          period: string
          report_date: string
          report_type: string
          team_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          generated_at?: string
          id?: string
          metrics?: Json
          period: string
          report_date?: string
          report_type?: string
          team_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          metrics?: Json
          period?: string
          report_date?: string
          report_type?: string
          team_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      route_assignments: {
        Row: {
          agent_id: string | null
          area_id: string | null
          area_name: string | null
          building_ids: string[]
          county_name: string | null
          created_at: string
          date: string
          id: string
          is_deleted: boolean | null
          project_id: string | null
          sales_target: number | null
          status: string
          sub_county_name: string | null
          supervisor_id: string | null
          survey_template_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          area_id?: string | null
          area_name?: string | null
          building_ids?: string[]
          county_name?: string | null
          created_at?: string
          date: string
          id?: string
          is_deleted?: boolean | null
          project_id?: string | null
          sales_target?: number | null
          status?: string
          sub_county_name?: string | null
          supervisor_id?: string | null
          survey_template_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          area_id?: string | null
          area_name?: string | null
          building_ids?: string[]
          county_name?: string | null
          created_at?: string
          date?: string
          id?: string
          is_deleted?: boolean | null
          project_id?: string | null
          sales_target?: number | null
          status?: string
          sub_county_name?: string | null
          supervisor_id?: string | null
          survey_template_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_assignments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "route_assignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          locations: Json
          planned_date: string
          project_id: string | null
          route_name: string
          started_at: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          locations: Json
          planned_date: string
          project_id?: string | null
          route_name: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          locations?: Json
          planned_date?: string
          project_id?: string | null
          route_name?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          agent_id: string | null
          category: string | null
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          is_deleted: boolean | null
          product_category: string | null
          product_id: string | null
          product_name: string | null
          product_variant_id: string | null
          project_id: string | null
          quantity: number
          sale_id: string | null
          store_id: string | null
          total_price: number
          unit_price: number
          variant_name: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_deleted?: boolean | null
          product_category?: string | null
          product_id?: string | null
          product_name?: string | null
          product_variant_id?: string | null
          project_id?: string | null
          quantity: number
          sale_id?: string | null
          store_id?: string | null
          total_price: number
          unit_price: number
          variant_name?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_deleted?: boolean | null
          product_category?: string | null
          product_id?: string | null
          product_name?: string | null
          product_variant_id?: string | null
          project_id?: string | null
          quantity?: number
          sale_id?: string | null
          store_id?: string | null
          total_price?: number
          unit_price?: number
          variant_name?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "sale_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          agent_id: string | null
          created_at: string | null
          currency: string | null
          customer_location: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          is_deleted: boolean | null
          notes: string | null
          payment_method: string | null
          project_id: string | null
          sale_date: string | null
          status: string | null
          total_amount: number
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_location?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          sale_date?: string | null
          status?: string | null
          total_amount: number
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_location?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          sale_date?: string | null
          status?: string | null
          total_amount?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sales_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: string
          is_pending: boolean | null
          movement_type: string
          product_variant_id: string
          project_id: string | null
          quantity: number
          request_id: string | null
          task_id: string | null
          timestamp: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          id?: string
          is_pending?: boolean | null
          movement_type: string
          product_variant_id: string
          project_id?: string | null
          quantity: number
          request_id?: string | null
          task_id?: string | null
          timestamp?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          id?: string
          is_pending?: boolean | null
          movement_type?: string
          product_variant_id?: string
          project_id?: string | null
          quantity?: number
          request_id?: string | null
          task_id?: string | null
          timestamp?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stock_movements_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "checkout_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_report_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          questions: Json
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          questions?: Json
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          questions?: Json
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_report_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reports: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          notes: string | null
          product_variant_id: string
          report_type: string
          reported_at: string
          responses: Json | null
          stock_level: string
          store_id: string | null
          template_id: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_variant_id: string
          report_type: string
          reported_at?: string
          responses?: Json | null
          stock_level: string
          store_id?: string | null
          template_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_variant_id?: string
          report_type?: string
          reported_at?: string
          responses?: Json | null
          stock_level?: string
          store_id?: string | null
          template_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_reports_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "stock_report_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      store_price_reports: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          measurement: string | null
          price: number
          product_variant_id: string
          sku: string | null
          stock_level: string | null
          store_id: string | null
          work_date: string
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          measurement?: string | null
          price?: number
          product_variant_id: string
          sku?: string | null
          stock_level?: string | null
          store_id?: string | null
          work_date?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          measurement?: string | null
          price?: number
          product_variant_id?: string
          sku?: string | null
          stock_level?: string | null
          store_id?: string | null
          work_date?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_price_reports_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_price_reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_price_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      store_visits: {
        Row: {
          agent_id: string
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_selfie_url: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          distance_from_store: number | null
          estimated_duration: string | null
          id: string
          notes: string | null
          planned_date: string
          planned_time: string | null
          route_id: string | null
          status: string | null
          store_id: string
          tasks_completed: Json | null
          updated_at: string | null
          visit_order: number | null
          workspace_id: string | null
        }
        Insert: {
          agent_id: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_selfie_url?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          distance_from_store?: number | null
          estimated_duration?: string | null
          id?: string
          notes?: string | null
          planned_date: string
          planned_time?: string | null
          route_id?: string | null
          status?: string | null
          store_id: string
          tasks_completed?: Json | null
          updated_at?: string | null
          visit_order?: number | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_selfie_url?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          distance_from_store?: number | null
          estimated_duration?: string | null
          id?: string
          notes?: string | null
          planned_date?: string
          planned_time?: string | null
          route_id?: string | null
          status?: string | null
          store_id?: string
          tasks_completed?: Json | null
          updated_at?: string | null
          visit_order?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_visits_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          added_by: string | null
          address: string | null
          client_operation_id: string | null
          contact: string | null
          country: string | null
          county: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          last_visited_at: string | null
          priority: number | null
          products: Json
          store_lat: number
          store_long: number
          store_name: string
          store_type: string | null
          updated_at: string | null
          visit_frequency: string | null
          workspace_id: string | null
        }
        Insert: {
          added_by?: string | null
          address?: string | null
          client_operation_id?: string | null
          contact?: string | null
          country?: string | null
          county: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          last_visited_at?: string | null
          priority?: number | null
          products?: Json
          store_lat: number
          store_long: number
          store_name: string
          store_type?: string | null
          updated_at?: string | null
          visit_frequency?: string | null
          workspace_id?: string | null
        }
        Update: {
          added_by?: string | null
          address?: string | null
          client_operation_id?: string | null
          contact?: string | null
          country?: string | null
          county?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          last_visited_at?: string | null
          priority?: number | null
          products?: Json
          store_lat?: number
          store_long?: number
          store_name?: string
          store_type?: string | null
          updated_at?: string | null
          visit_frequency?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stores_added_by_user_roles"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean
          is_read: boolean
          location_label: string | null
          location_lat: number | null
          location_lng: number | null
          message: string
          recipient_id: string
          sender_id: string
          sender_name: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_read?: boolean
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          message: string
          recipient_id: string
          sender_id: string
          sender_name?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_read?: boolean
          location_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          message?: string
          recipient_id?: string
          sender_id?: string
          sender_name?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          agent_email: string | null
          agent_id: string
          agent_name: string | null
          created_at: string
          id: string
          image_url: string | null
          inventory_issue_type: string | null
          is_deleted: boolean
          message: string
          project_id: string | null
          status: string
          ticket_type: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agent_email?: string | null
          agent_id: string
          agent_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_issue_type?: string | null
          is_deleted?: boolean
          message: string
          project_id?: string | null
          status?: string
          ticket_type: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agent_email?: string | null
          agent_id?: string
          agent_name?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_issue_type?: string | null
          is_deleted?: boolean
          message?: string
          project_id?: string | null
          status?: string
          ticket_type?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          answer_number: number | null
          answer_text: string | null
          created_at: string | null
          id: string
          question_id: string | null
          response_id: string | null
        }
        Insert: {
          answer_number?: number | null
          answer_text?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          response_id?: string | null
        }
        Update: {
          answer_number?: number | null
          answer_text?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          response_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_insight_cache: {
        Row: {
          created_at: string
          data_fingerprint: string
          generated_at: string
          id: string
          report: string
          survey_template_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          data_fingerprint: string
          generated_at?: string
          id?: string
          report: string
          survey_template_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          data_fingerprint?: string
          generated_at?: string
          id?: string
          report?: string
          survey_template_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_insight_cache_survey_template_id_fkey"
            columns: ["survey_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          question_order: number
          question_text: string
          question_type: string
          survey_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_order: number
          question_text: string
          question_type: string
          survey_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_order?: number
          question_text?: string
          question_type?: string
          survey_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          completion_status: string | null
          completion_time_seconds: number | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          interaction_id: string | null
          is_completed: boolean | null
          is_deleted: boolean | null
          location_lat: number | null
          location_lng: number | null
          responses: Json
          started_at: string | null
          survey_template_id: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          completion_status?: string | null
          completion_time_seconds?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_id?: string | null
          is_completed?: boolean | null
          is_deleted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          responses: Json
          started_at?: string | null
          survey_template_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          completion_status?: string | null
          completion_time_seconds?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_id?: string | null
          is_completed?: boolean | null
          is_deleted?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          responses?: Json
          started_at?: string | null
          survey_template_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_template_id_fkey"
            columns: ["survey_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          anonymous_responses: boolean | null
          collect_location: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          estimated_duration_minutes: number | null
          id: string
          is_deleted: boolean | null
          is_published: boolean | null
          project_id: string | null
          questions: Json
          settings: Json | null
          start_date: string | null
          status: string | null
          target_department: string | null
          title: string
          updated_at: string | null
          version: number | null
          workspace_id: string | null
        }
        Insert: {
          anonymous_responses?: boolean | null
          collect_location?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_deleted?: boolean | null
          is_published?: boolean | null
          project_id?: string | null
          questions: Json
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          target_department?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
          workspace_id?: string | null
        }
        Update: {
          anonymous_responses?: boolean | null
          collect_location?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_deleted?: boolean | null
          is_published?: boolean | null
          project_id?: string | null
          questions?: Json
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          target_department?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "survey_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          address: string
          ambassador_id: string | null
          completed_at: string | null
          created_at: string
          distance: string
          eta: string
          id: string
          individual_sales_target: number | null
          latitude: number
          location_name: string
          longitude: number
          route_assignment_id: string | null
          started_at: string | null
          status: string
          survey_type: string
          updated_at: string
        }
        Insert: {
          address: string
          ambassador_id?: string | null
          completed_at?: string | null
          created_at?: string
          distance: string
          eta: string
          id?: string
          individual_sales_target?: number | null
          latitude: number
          location_name: string
          longitude: number
          route_assignment_id?: string | null
          started_at?: string | null
          status: string
          survey_type: string
          updated_at?: string
        }
        Update: {
          address?: string
          ambassador_id?: string | null
          completed_at?: string | null
          created_at?: string
          distance?: string
          eta?: string
          id?: string
          individual_sales_target?: number | null
          latitude?: number
          location_name?: string
          longitude?: number
          route_assignment_id?: string | null
          started_at?: string | null
          status?: string
          survey_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_route_assignment_id_fkey"
            columns: ["route_assignment_id"]
            isOneToOne: false
            referencedRelation: "route_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      team_kpi_results: {
        Row: {
          created_at: string | null
          date: string
          id: string
          kpi_id: string
          target_value: number | null
          team_id: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          kpi_id: string
          target_value?: number | null
          team_id: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          kpi_id?: string
          target_value?: number | null
          team_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_kpi_results_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_kpi_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          team_id: string | null
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          team_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          team_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_workspace_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_deleted: boolean | null
          member_count: number
          name: string | null
          project_id: string | null
          team_lead_id: string | null
          team_type: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          member_count?: number
          name?: string | null
          project_id?: string | null
          team_lead_id?: string | null
          team_type?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          member_count?: number
          name?: string | null
          project_id?: string | null
          team_lead_id?: string | null
          team_type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_stats_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "teams_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teams_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          account_locked_until: string | null
          archive_reason: string | null
          archived_at: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_reason: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          invited_by: string | null
          is_active: boolean
          last_failed_login: string | null
          last_ip_address: unknown
          last_login_at: string | null
          last_name: string | null
          location: string | null
          login_attempts: number | null
          magic_link_sent_at: string | null
          phone_number: string | null
          project_id: string | null
          rating: number | null
          role: Database["public"]["Enums"]["app_role"]
          role_title: string | null
          team_leader_id: string | null
          user_id: string
          workspace_id: string | null
          years_experience: number | null
        }
        Insert: {
          account_locked_until?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_reason?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean
          last_failed_login?: string | null
          last_ip_address?: unknown
          last_login_at?: string | null
          last_name?: string | null
          location?: string | null
          login_attempts?: number | null
          magic_link_sent_at?: string | null
          phone_number?: string | null
          project_id?: string | null
          rating?: number | null
          role: Database["public"]["Enums"]["app_role"]
          role_title?: string | null
          team_leader_id?: string | null
          user_id: string
          workspace_id?: string | null
          years_experience?: number | null
        }
        Update: {
          account_locked_until?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_reason?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean
          last_failed_login?: string | null
          last_ip_address?: unknown
          last_login_at?: string | null
          last_name?: string | null
          location?: string | null
          login_attempts?: number | null
          magic_link_sent_at?: string | null
          phone_number?: string | null
          project_id?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["app_role"]
          role_title?: string | null
          team_leader_id?: string | null
          user_id?: string
          workspace_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_workspaces: {
        Row: {
          active_components: Json | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          name: string | null
          role: string
          team_type: string
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          active_components?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string | null
          role: string
          team_type?: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          active_components?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string | null
          role?: string
          team_type?: string
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: string
          status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_messages: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          recipient_id: string | null
          sender_email: string | null
          sender_id: string
          sender_name: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          recipient_id?: string | null
          sender_email?: string | null
          sender_id: string
          sender_name: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          recipient_id?: string | null
          sender_email?: string | null
          sender_id?: string
          sender_name?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_deleted: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      agent_daily_work_summary: {
        Row: {
          agent_id: string | null
          last_updated: string | null
          net_work_minutes: number | null
          total_lunch_minutes: number | null
          total_segments: number | null
          total_work_minutes: number | null
          work_date: string | null
        }
        Relationships: []
      }
      agent_tasks_view: {
        Row: {
          address: string | null
          ambassador_id: string | null
          area_name: string | null
          client_name: string | null
          completed_at: string | null
          created_at: string | null
          day_plan_date: string | null
          day_sales_target: number | null
          distance: string | null
          eta: string | null
          id: string | null
          individual_sales_target: number | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          product_focus: string | null
          route_assignment_id: string | null
          started_at: string | null
          status: string | null
          survey_type: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_route_assignment_id_fkey"
            columns: ["route_assignment_id"]
            isOneToOne: false
            referencedRelation: "route_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      current_stock: {
        Row: {
          agent_id: string | null
          current_quantity: number | null
          last_transaction_at: string | null
          product_id: string | null
        }
        Relationships: []
      }
      project_stats_view: {
        Row: {
          agents_count: number | null
          completed_tasks: number | null
          day_plan_count: number | null
          project_id: string | null
          team_member_count: number | null
          total_tasks: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_plans_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _mark_sync_op: {
        Args: {
          p_agent_id: string
          p_id: string
          p_type: string
          p_workspace_id: string
        }
        Returns: undefined
      }
      approve_checkout_request: {
        Args: { request_id: string; reviewer_id: string }
        Returns: undefined
      }
      archive_agent_account: {
        Args: { agent_user_id: string; reason?: string }
        Returns: undefined
      }
      calculate_and_store_work_summary: {
        Args: { p_agent_id: string; p_work_date: string }
        Returns: undefined
      }
      calculate_daily_kpis: { Args: { for_date: string }; Returns: undefined }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_attempts?: number
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: boolean
      }
      compute_user_workspace_active_components: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: Json
      }
      confirm_product_return: {
        Args: {
          p_confirmed_qty: Json
          p_return_id: string
          p_warehouse_notes?: string
          p_warehouse_photo_url?: string
        }
        Returns: boolean
      }
      create_tasks_for_day_plan: {
        Args: { day_plan_id: string }
        Returns: undefined
      }
      current_user_role: { Args: never; Returns: string }
      deactivate_agent_account: {
        Args: { agent_user_id: string; reason?: string }
        Returns: undefined
      }
      get_agent_current_stock: {
        Args: { target_agent_id?: string }
        Returns: {
          current_quantity: number
          last_transaction_at: string
          product_id: string
        }[]
      }
      get_agent_dashboard_stats: {
        Args: { p_agent_id: string }
        Returns: {
          completed_tasks: number
          completion_rate: number
          conversion_rate: number
          pending_tasks: number
          total_apartments: number
          total_conversions: number
          total_surveys: number
          total_tasks: number
        }[]
      }
      get_agent_metric_aggregates: {
        Args: {
          p_agent_id: string
          p_project_id?: string
          p_today_date?: string
          p_today_start?: string
          p_week_start?: string
          p_week_start_date?: string
          p_workspace_id: string
        }
        Returns: Json
      }
      get_agent_tasks: {
        Args: { p_agent_id: string }
        Returns: {
          address: string
          ambassador_id: string | null
          completed_at: string | null
          created_at: string
          distance: string
          eta: string
          id: string
          individual_sales_target: number | null
          latitude: number
          location_name: string
          longitude: number
          route_assignment_id: string | null
          started_at: string | null
          status: string
          survey_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_agent_work_summary: {
        Args: {
          p_agent_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          agent_id: string
          check_in_time: string
          check_out_time: string
          lunch_duration_minutes: number
          lunch_end_time: string
          lunch_start_time: string
          net_work_minutes: number
          total_work_minutes: number
          work_date: string
        }[]
      }
      get_current_user_role_direct: { Args: never; Returns: string }
      get_current_user_role_safe: { Args: never; Returns: string }
      get_dashboard_stats: { Args: { p_workspace_id: string }; Returns: Json }
      get_default_workspace: { Args: never; Returns: string }
      get_follow_ups_due: {
        Args: { p_agent_id?: string; p_due_date?: string }
        Returns: {
          customer_name: string
          customer_phone: string
          days_overdue: number
          interaction_id: string
          interaction_type: string
          next_action: string
          original_date: string
          priority: string
        }[]
      }
      get_interaction_summary: {
        Args: {
          p_agent_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          avg_sale_value: number
          follow_ups_required: number
          successful_interactions: number
          top_interaction_type: string
          total_interactions: number
          total_sale_value: number
          total_sales: number
        }[]
      }
      get_pending_returns: {
        Args: never
        Returns: {
          agent_email: string
          agent_name: string
          created_at: string
          expected_returns: Json
          return_date: string
          return_id: string
          selfie_url: string
        }[]
      }
      get_project_types: { Args: never; Returns: string[] }
      get_projects_with_stats: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      get_recent_tasks: {
        Args: { p_agent_id: string }
        Returns: {
          address: string
          ambassador_id: string | null
          completed_at: string | null
          created_at: string
          distance: string
          eta: string
          id: string
          individual_sales_target: number | null
          latitude: number
          location_name: string
          longitude: number
          route_assignment_id: string | null
          started_at: string | null
          status: string
          survey_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_supervisor_stats: {
        Args: { p_supervisor_id: string; p_workspace_id?: string }
        Returns: Json
      }
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      get_user_workspace_id: { Args: never; Returns: string }
      get_users_with_emails: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
          role: string
          username: string
        }[]
      }
      handle_failed_login: {
        Args: { ip_address?: unknown; user_email: string }
        Returns: boolean
      }
      handle_successful_login: {
        Args: { ip_address?: unknown; user_email: string }
        Returns: undefined
      }
      is_account_locked: { Args: { user_email: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_supervisor: { Args: never; Returns: boolean }
      is_supervisor_def: { Args: never; Returns: boolean }
      issue_stock_to_agent: {
        Args: {
          agent_id: string
          product_variant_id: string
          quantity: number
          task_id: string
        }
        Returns: undefined
      }
      log_auth_attempt: {
        Args: {
          p_email: string
          p_event_type: string
          p_ip_address: unknown
          p_metadata?: Json
          p_user_agent: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      reactivate_agent_account: {
        Args: { agent_user_id: string; new_project_id?: string }
        Returns: undefined
      }
      record_inventory_transaction: {
        Args: {
          p_metadata?: Json
          p_product_id: string
          p_qty: number
          p_reference?: string
          p_type: string
        }
        Returns: string
      }
      refresh_agent_report_summary: {
        Args: { p_agent_id: string; p_date?: string }
        Returns: undefined
      }
      refresh_current_stock: { Args: never; Returns: undefined }
      reject_product_return: {
        Args: { p_rejection_reason: string; p_return_id: string }
        Returns: boolean
      }
      request_product_return: {
        Args: {
          p_day_plan_id?: string
          p_expected_returns: Json
          p_session_id?: string
        }
        Returns: string
      }
      safe_upsert_user_role: {
        Args: { new_role: string; user_uuid: string }
        Returns: undefined
      }
      set_current_workspace_id: {
        Args: { workspace_id: string }
        Returns: undefined
      }
      set_safe_search_path: { Args: never; Returns: undefined }
      submit_checkout_request: {
        Args: { agent_id: string; movements: Json; task_id: string }
        Returns: string
      }
      sync_create_store: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      sync_daily_stock_reports: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      sync_field_note: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      sync_inventory_assign: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      sync_record_giveaway: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      sync_record_sale_batch: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      sync_record_survey: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      sync_store_price_reports: {
        Args: {
          p_client_operation_id: string
          p_payload: Json
          p_workspace_id: string
        }
        Returns: Json
      }
      track_magic_link_sent: {
        Args: { p_user_email: string }
        Returns: undefined
      }
      update_display_name: {
        Args: { new_display_name: string }
        Returns: undefined
      }
      update_last_login: { Args: never; Returns: undefined }
      upsert_user_role: {
        Args: { new_role: string; user_uuid: string }
        Returns: undefined
      }
      user_has_workspace_access: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: boolean
      }
      user_is_workspace_admin: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "supervisor" | "agent" | "admin" | "driver" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["supervisor", "agent", "admin", "driver", "client"],
    },
  },
} as const
