-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function that fires pg_net to invoke process-task-queue on new task insert
CREATE OR REPLACE FUNCTION public.notify_task_queue_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/process-task-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object('trigger', 'task_queue_insert', 'task_id', NEW.id, 'project_id', NEW.project_id)
  );
  RETURN NEW;
END;
$$;

-- Create trigger on task_queue INSERT
CREATE TRIGGER on_task_queue_insert
  AFTER INSERT ON public.task_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_queue_insert();
