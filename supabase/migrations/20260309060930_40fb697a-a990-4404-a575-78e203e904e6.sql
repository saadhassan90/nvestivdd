
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_name TEXT NOT NULL,
  asset_class TEXT,
  established_year TEXT,
  vintage TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'complete', 'error')),
  composite_score INTEGER,
  recommendation TEXT,
  score_tier TEXT CHECK (score_tier IN ('strong_advance', 'advance', 'review', 'decline')),
  module_scores JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT CHECK (file_type IN ('pitch_deck', 'term_sheet', 'financials', 'lpa', 'cim', 'financial_model', 'other')),
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task_queue table
CREATE TABLE public.task_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'l1_analysis',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'error')),
  input_payload JSONB,
  output_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create report_sections table
CREATE TABLE public.report_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL CHECK (section_key IN ('executive_summary', 'module_a', 'module_b', 'module_c', 'module_d', 'module_e', 'red_flags_summary', 'interrogatory_summary', 'data_room_summary')),
  section_title TEXT,
  content TEXT,
  score INTEGER,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  order_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create red_flags table
CREATE TABLE public.red_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'elevated', 'monitor')),
  title TEXT NOT NULL,
  description TEXT,
  module TEXT,
  confidence TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_room_action TEXT,
  interrogatory_question TEXT
);

-- Create interrogatory_items table
CREATE TABLE public.interrogatory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  question_id TEXT,
  question TEXT NOT NULL,
  rationale TEXT,
  module TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  order_index INTEGER
);

-- Create data_room_items table
CREATE TABLE public.data_room_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'standard')),
  document_name TEXT NOT NULL,
  purpose TEXT,
  module TEXT,
  is_received BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER
);

-- Disable RLS on all tables (community portal - open access)
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.red_flags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interrogatory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_room_items DISABLE ROW LEVEL SECURITY;

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Allow public access to documents bucket
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Public upload access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Public update access" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');
CREATE POLICY "Public delete access" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at trigger to projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime on projects and task_queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_queue;
