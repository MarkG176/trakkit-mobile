import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SurveyQuestion {
  id: string;
  type?: string;
  text?: string;
  question?: string;
  title?: string;
  label?: string;
  description?: string;
  options?: string[];
  required?: boolean;
  [key: string]: unknown;
}

/**
 * Normalizes the JSONB `questions` field which may arrive as an array, a JSON
 * string, or a plain object keyed by index (matches the parsing in Surveys.tsx).
 */
const parseQuestions = (raw: unknown): SurveyQuestion[] => {
  if (Array.isArray(raw)) return raw as SurveyQuestion[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>) as SurveyQuestion[];
  }
  return [];
};

export const useSurveyTemplate = (templateId: string | null) => {
  return useQuery({
    queryKey: ["survey-template", templateId],
    enabled: Boolean(templateId),
    queryFn: async (): Promise<{ title: string | null; questions: SurveyQuestion[] }> => {
      const { data, error } = await supabase
        .from("survey_templates")
        .select("title, questions")
        .eq("id", templateId!)
        .single();

      if (error) throw error;

      return {
        title: data?.title ?? null,
        questions: parseQuestions(data?.questions),
      };
    },
  });
};
