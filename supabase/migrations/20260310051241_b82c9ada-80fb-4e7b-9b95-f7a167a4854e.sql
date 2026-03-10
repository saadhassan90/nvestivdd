ALTER TABLE public.projects DROP CONSTRAINT projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status = ANY (ARRAY['pending', 'uploading', 'processing', 'analyzing', 'extracting', 'complete', 'error']));

ALTER TABLE public.task_queue DROP CONSTRAINT task_queue_status_check;
ALTER TABLE public.task_queue ADD CONSTRAINT task_queue_status_check CHECK (status = ANY (ARRAY['pending', 'processing', 'running', 'extracting', 'complete', 'failed', 'error', 'max_retries_exceeded']));