-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.boards (
  id integer NOT NULL DEFAULT nextval('boards_id_seq'::regclass),
  title character varying NOT NULL,
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT FALSE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT boards_pkey PRIMARY KEY (id),
  CONSTRAINT boards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.lists (
  id integer NOT NULL DEFAULT nextval('lists_id_seq'::regclass),
  board_id integer,
  title character varying NOT NULL,
  position_index double precision NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  user_id uuid,
  CONSTRAINT lists_pkey PRIMARY KEY (id),
  CONSTRAINT lists_board_id_fkey FOREIGN KEY (board_id) REFERENCES public.boards(id),
  CONSTRAINT lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tasks (
  id integer NOT NULL DEFAULT nextval('tasks_id_seq'::regclass),
  list_id integer,
  title character varying NOT NULL,
  description text,
  position_index double precision NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  user_id uuid,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.lists(id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);