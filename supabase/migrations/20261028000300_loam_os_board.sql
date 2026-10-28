-- First-class board: custom columns, priority, checklist, tags, dependencies,
-- links to people and notes, activity, saved views, archive.
create table loam_os.board_columns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  kind text not null default 'todo' check (kind in ('todo','doing','done')),
  wip int check (wip is null or wip > 0),
  sort double precision not null default 0,
  created_at timestamptz not null default now()
);
insert into loam_os.board_columns (name, kind, sort) values ('To do','todo',1),('Doing','doing',2),('Done','done',3);

alter table loam_os.tasks
  add column column_id uuid references loam_os.board_columns(id) on delete set null,
  add column priority text not null default 'normal' check (priority in ('urgent','high','normal','low')),
  add column checklist jsonb not null default '[]',
  add column tags text[] not null default '{}',
  add column status_changed_at timestamptz not null default now(),
  add column archived_at timestamptz;
update loam_os.tasks t set column_id = c.id, status_changed_at = coalesce(t.done_at, t.created_at)
  from loam_os.board_columns c where c.kind = t.status;

create or replace function loam_os.task_touch() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status or new.column_id is distinct from old.column_id then
    new.status_changed_at := now();
    insert into loam_os.task_activity (task_id, kind, body)
      values (new.id, 'move', coalesce((select name from loam_os.board_columns where id = new.column_id), new.status));
  end if;
  return new;
end $$;

create table loam_os.task_deps (
  task_id uuid not null references loam_os.tasks(id) on delete cascade,
  blocked_by uuid not null references loam_os.tasks(id) on delete cascade,
  primary key (task_id, blocked_by),
  check (task_id <> blocked_by)
);
create table loam_os.task_links (
  task_id uuid not null references loam_os.tasks(id) on delete cascade,
  kind text not null check (kind in ('person','note')),
  ref_id uuid not null,
  primary key (task_id, kind, ref_id)
);
create table loam_os.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references loam_os.tasks(id) on delete cascade,
  kind text not null check (kind in ('created','move','comment','edit')),
  body text not null default '',
  created_at timestamptz not null default now()
);
create index on loam_os.task_activity (task_id, created_at);
create trigger task_touch before update on loam_os.tasks for each row execute function loam_os.task_touch();

create table loam_os.board_views (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  filters jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Same access model as the rest of the schema: RLS on, no policies, owned by the app role.
do $$ declare t text; begin
  foreach t in array array['board_columns','task_deps','task_links','task_activity','board_views'] loop
    execute format('alter table loam_os.%I enable row level security', t);
    execute format('alter table loam_os.%I owner to loam_os_app', t);
    execute format('revoke all on loam_os.%I from anon, authenticated', t);
  end loop;
end $$;
alter function loam_os.task_touch() owner to loam_os_app;
