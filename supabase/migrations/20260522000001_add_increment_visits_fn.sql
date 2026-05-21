CREATE OR REPLACE FUNCTION public.increment_visits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.visits SET count = count + 1 WHERE id = 1;
END;
$$;
