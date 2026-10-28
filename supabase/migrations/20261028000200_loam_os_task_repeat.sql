-- Recurring tasks: when one is completed, the next occurrence is created.
alter table loam_os.tasks add column if not exists repeat text
  check (repeat in ('daily','weekdays','weekly','monthly','yearly'));
