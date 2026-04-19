ALTER TABLE public.project_components
  ADD COLUMN IF NOT EXISTS enable_closing_report boolean NOT NULL DEFAULT false;

INSERT INTO public.project_components (project_id, enable_closing_report)
VALUES ('6e9e85be-da35-425c-b791-d9e0566f0086', true)
ON CONFLICT (project_id) DO UPDATE
SET enable_closing_report = true;