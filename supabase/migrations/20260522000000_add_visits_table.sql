CREATE TABLE public.visits (
  id integer PRIMARY KEY DEFAULT 1,
  count integer DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.visits (id, count) VALUES (1, 0);
