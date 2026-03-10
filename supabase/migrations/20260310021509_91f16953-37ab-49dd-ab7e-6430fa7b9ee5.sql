
-- Knowledge Graph: Nodes (every entity/concept in the system)
CREATE TABLE public.knowledge_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  node_type text NOT NULL,
  label text NOT NULL,
  summary text,
  properties jsonb DEFAULT '{}',
  embedding vector(1536),
  parent_node_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE SET NULL,
  depth_level integer DEFAULT 0,
  source_table text,
  source_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Knowledge Graph: Edges (relationships between nodes)
CREATE TABLE public.knowledge_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id uuid REFERENCES public.knowledge_nodes(id) ON DELETE CASCADE NOT NULL,
  relationship_type text NOT NULL,
  properties jsonb DEFAULT '{}',
  weight numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_knowledge_nodes_project ON public.knowledge_nodes(project_id);
CREATE INDEX idx_knowledge_nodes_type ON public.knowledge_nodes(node_type);
CREATE INDEX idx_knowledge_nodes_parent ON public.knowledge_nodes(parent_node_id);
CREATE INDEX idx_knowledge_nodes_source ON public.knowledge_nodes(source_table, source_id);
CREATE INDEX idx_knowledge_edges_source ON public.knowledge_edges(source_node_id);
CREATE INDEX idx_knowledge_edges_target ON public.knowledge_edges(target_node_id);
CREATE INDEX idx_knowledge_edges_type ON public.knowledge_edges(relationship_type);

-- HNSW vector index for fast similarity search
CREATE INDEX idx_knowledge_nodes_embedding ON public.knowledge_nodes
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- RLS
ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access on knowledge_nodes" ON public.knowledge_nodes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access on knowledge_edges" ON public.knowledge_edges
  FOR ALL USING (true) WITH CHECK (true);

-- Vector similarity search function with graph traversal
CREATE OR REPLACE FUNCTION public.search_knowledge_graph(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 25,
  filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  node_type text,
  label text,
  summary text,
  properties jsonb,
  parent_node_id uuid,
  depth_level integer,
  source_table text,
  source_id uuid,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kn.id,
    kn.project_id,
    kn.node_type,
    kn.label,
    kn.summary,
    kn.properties,
    kn.parent_node_id,
    kn.depth_level,
    kn.source_table,
    kn.source_id,
    (1 - (kn.embedding <=> query_embedding))::float as similarity
  FROM public.knowledge_nodes kn
  WHERE kn.embedding IS NOT NULL
    AND 1 - (kn.embedding <=> query_embedding) > match_threshold
    AND (filter_project_id IS NULL OR kn.project_id = filter_project_id)
  ORDER BY kn.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
