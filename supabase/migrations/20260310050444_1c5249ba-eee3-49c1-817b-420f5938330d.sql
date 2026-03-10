ALTER TABLE public.task_queue ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.task_queue ADD COLUMN IF NOT EXISTS max_retries integer NOT NULL DEFAULT 3;