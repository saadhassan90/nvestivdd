ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on research_sources" ON public.research_sources FOR SELECT USING (true);
CREATE POLICY "Allow public insert on research_sources" ON public.research_sources FOR INSERT WITH CHECK (true);