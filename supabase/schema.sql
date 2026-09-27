create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tasks_title_length
    check (char_length(trim(title)) between 1 and 200),

  constraint tasks_status_check
    check (status in ('pending', 'in_progress', 'completed'))
);


create table public.time_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz not null default now(),

  constraint time_logs_duration_check
    check (duration_seconds is null or duration_seconds >= 0),

  constraint time_logs_end_after_start
    check (ended_at is null or ended_at >= started_at),

  constraint time_logs_completion_check
    check (
      (ended_at is null and duration_seconds is null)
      or
      (ended_at is not null and duration_seconds is not null)
    )
);


create index tasks_user_id_idx
  on public.tasks(user_id);

create index tasks_user_status_idx
  on public.tasks(user_id, status);

create index time_logs_user_id_idx
  on public.time_logs(user_id);

create index time_logs_task_id_idx
  on public.time_logs(task_id);

create index time_logs_started_at_idx
  on public.time_logs(started_at);


create unique index one_active_timer_per_user
  on public.time_logs(user_id)
  where ended_at is null;


alter table public.tasks enable row level security;
alter table public.time_logs enable row level security;


revoke all on table public.tasks from anon, authenticated;
revoke all on table public.time_logs from anon, authenticated;

grant select, insert, update, delete
  on table public.tasks
  to authenticated;

grant select, insert, update, delete
  on table public.time_logs
  to authenticated;


create policy "users can view their own tasks"
on public.tasks
for select
to authenticated
using (
  (select auth.uid()) = user_id
);


create policy "users can create their own tasks"
on public.tasks
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);


create policy "users can update their own tasks"
on public.tasks
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);


create policy "users can delete their own tasks"
on public.tasks
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);


create policy "users can view their own time logs"
on public.time_logs
for select
to authenticated
using (
  (select auth.uid()) = user_id
);


create policy "users can create their own time logs"
on public.time_logs
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.tasks
    where tasks.id = time_logs.task_id
      and tasks.user_id = (select auth.uid())
  )
);


create policy "users can update their own time logs"
on public.time_logs
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.tasks
    where tasks.id = time_logs.task_id
      and tasks.user_id = (select auth.uid())
  )
);


create policy "users can delete their own time logs"
on public.time_logs
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);