import { supabase } from "@/integrations/supabase/client";

export type LogCategory = 
  | "auth" 
  | "attendance" 
  | "sales" 
  | "inventory" 
  | "stock_report" 
  | "giveaway" 
  | "survey" 
  | "navigation" 
  | "system";

export type LogStatus = "success" | "failed" | "incomplete";

interface LogEntry {
  action: string;
  category: LogCategory;
  status?: LogStatus;
  details?: Record<string, any>;
  errorMessage?: string;
  workspaceId?: string | null;
}

/**
 * Fire-and-forget activity logger. Never throws — errors are silently caught
 * so logging never disrupts user flows.
 */
export const logActivity = async (entry: LogEntry): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Anonymous actions are not logged

    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: entry.action,
      category: entry.category,
      status: entry.status ?? "success",
      details: entry.details ?? {},
      error_message: entry.errorMessage ?? null,
      workspace_id: entry.workspaceId ?? null,
      user_agent: navigator.userAgent,
    });

    if (error) {
      console.warn("[ActivityLogger] Failed to log:", error.message);
    }
  } catch {
    // Silently swallow — logging must never break the app
  }
};

/**
 * Convenience wrapper for logging failed actions with an error object.
 */
export const logFailedActivity = async (
  action: string,
  category: LogCategory,
  error: unknown,
  details?: Record<string, any>,
  workspaceId?: string | null
): Promise<void> => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
      ? String((error as any).message)
      : String(error);

  await logActivity({
    action,
    category,
    status: "failed",
    details,
    errorMessage,
    workspaceId,
  });
};
