DO $$ 
DECLARE
    con_name text;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%tag%';

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.messages DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_tag_check 
CHECK (tag IN ('feature', 'bug', 'improvement', 'milestone', 'general', 'customer', 'revenue', 'ask'));
