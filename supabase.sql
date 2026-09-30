create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  project text,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  project text,
  input_text text,
  result_text text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.audits enable row level security;

drop policy if exists "Users can view their clients"
on public.clients;

create policy "Users can view their clients"
on public.clients
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their clients"
on public.clients;

create policy "Users can create their clients"
on public.clients
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their clients"
on public.clients;

create policy "Users can update their clients"
on public.clients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their clients"
on public.clients;

create policy "Users can delete their clients"
on public.clients
for delete
to authenticated
using (auth.uid() = user_id);


drop policy if exists "Users can view their audits"
on public.audits;

create policy "Users can view their audits"
on public.audits
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their audits"
on public.audits;

create policy "Users can create their audits"
on public.audits
for insert
to authenticated
with check (auth.uid() = user_id);

grant select, insert, update, delete
on public.clients
to authenticated;

grant select, insert
on public.audits
to authenticated;
