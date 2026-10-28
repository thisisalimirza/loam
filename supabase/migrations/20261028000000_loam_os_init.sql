-- Loam OS: private data, isolated in its own schema.
-- Lives inside an existing Supabase project; touches nothing outside loam_os.
create schema if not exists loam_os;

-- Least-privilege login role for the server. No password here: it is set
-- out of band. anon/authenticated get no grants and there are no policies.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'loam_os_app') then
    create role loam_os_app nologin;
  end if;
end $$;
grant loam_os_app to postgres;

create table loam_os.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#4f5bd5',
  archived boolean not null default false,
  sort double precision not null default 0,
  created_at timestamptz not null default now()
);

create table loam_os.projects (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references loam_os.areas(id) on delete set null,
  name text not null,
  status text not null default 'active' check (status in ('active','paused','done')),
  due_date date,
  created_at timestamptz not null default now()
);

create table loam_os.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text not null default '',
  status text not null default 'todo' check (status in ('todo','doing','done')),
  area_id uuid references loam_os.areas(id) on delete set null,
  project_id uuid references loam_os.projects(id) on delete set null,
  due_date date,
  scheduled_date date,
  done_at timestamptz,
  sort double precision not null default 0,
  created_at timestamptz not null default now()
);
create index on loam_os.tasks (status, due_date);

create table loam_os.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  area_id uuid references loam_os.areas(id) on delete set null,
  notes text not null default '',
  follow_up date,
  created_at timestamptz not null default now()
);

create table loam_os.conversations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references loam_os.people(id) on delete cascade,
  happened_on date not null default current_date,
  channel text not null default 'In person',
  summary text not null default '',
  their_update text not null default '',
  follow_ups text not null default '',
  created_at timestamptz not null default now()
);
create index on loam_os.conversations (person_id, happened_on desc);

create table loam_os.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  body text not null default '',
  area_id uuid references loam_os.areas(id) on delete set null,
  project_id uuid references loam_os.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table loam_os.journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on loam_os.journal_entries (entry_date desc);

create table loam_os.drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  channel text not null default 'X' check (channel in ('Substack','X','LinkedIn','Newsletter')),
  stage text not null default 'idea' check (stage in ('idea','drafting','ready','published')),
  url text,
  published_at date,
  source_entry_id uuid references loam_os.journal_entries(id) on delete set null,
  sort double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table loam_os.links (
  id uuid primary key default gen_random_uuid(),
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  created_at timestamptz not null default now()
);

create table loam_os.pins (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  pin_date date not null,
  area_id uuid references loam_os.areas(id) on delete set null,
  created_at timestamptz not null default now()
);

create table loam_os.login_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  ok boolean not null,
  at timestamptz not null default now()
);
create index on loam_os.login_attempts (ip, at desc);

revoke all on schema loam_os from public, anon, authenticated;
grant usage, create on schema loam_os to loam_os_app;

do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'loam_os' loop
    execute format('alter table loam_os.%I enable row level security', t);
    execute format('alter table loam_os.%I owner to loam_os_app', t);
  end loop;
end $$;

