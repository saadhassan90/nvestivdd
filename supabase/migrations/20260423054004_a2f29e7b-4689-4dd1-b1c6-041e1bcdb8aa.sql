-- Create ic_memos table
CREATE TABLE public.ic_memos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_markdown TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ic_memos ENABLE ROW LEVEL SECURITY;

-- Public access policy (matches the rest of the app's pattern)
CREATE POLICY "Allow public access on ic_memos"
ON public.ic_memos
FOR ALL
USING (true)
WITH CHECK (true);

-- Auto-update updated_at trigger
CREATE TRIGGER update_ic_memos_updated_at
BEFORE UPDATE ON public.ic_memos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.ic_memos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ic_memos;

-- Index on project_id (already unique, but explicit for clarity)
CREATE INDEX idx_ic_memos_project_id ON public.ic_memos(project_id);