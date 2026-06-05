ALTER TABLE public.interrogatory_items
ADD COLUMN IF NOT EXISTS good_answer_direction text,
ADD COLUMN IF NOT EXISTS bad_answer_direction text;