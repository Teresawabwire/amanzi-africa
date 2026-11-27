-- Amanzi Africa Upgrade 2.0: client engagement and private document foundation
-- Review before running in the Supabase SQL Editor.
-- Assumes public.profiles has id (uuid) and role (text), with authenticated users
-- permitted to read their own profile row. Never use a service-role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.client_engagements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  contact_name text not null,
  contact_phone text,
  sector text,
  country text not null default 'Kenya',
  selected_service text,
  engagement_status text not null default 'registration'
    check (engagement_status in ('registration','service_selection','agreement','documents','assessment','confirmation','completed')),
  progress_step integer not null default 1 check (progress_step between 1 and 6),
  registration_data jsonb not null default '{}'::jsonb,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_engagements enable row level security;

drop policy if exists "Clients view own engagement" on public.client_engagements;
create policy "Clients view own engagement"
on public.client_engagements for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Clients create own engagement" on public.client_engagements;
create policy "Clients create own engagement"
on public.client_engagements for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Clients update own engagement" on public.client_engagements;
create policy "Clients update own engagement"
on public.client_engagements for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Amanzi admins view engagements" on public.client_engagements;
create policy "Amanzi admins view engagements"
on public.client_engagements for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Amanzi admins update engagements" on public.client_engagements;
create policy "Amanzi admins update engagements"
on public.client_engagements for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create or replace function public.set_client_engagement_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists client_engagements_updated_at on public.client_engagements;
create trigger client_engagements_updated_at
before update on public.client_engagements
for each row execute function public.set_client_engagement_updated_at();

-- Prevent client accounts from changing internal review fields or self-approving.
create or replace function public.guard_client_engagement_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) then
    if new.engagement_status is distinct from old.engagement_status
       or new.progress_step is distinct from old.progress_step
       or new.admin_notes is distinct from old.admin_notes then
      raise exception 'Only an Amanzi Africa administrator may change review status or internal notes.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists client_engagement_guard_admin_fields on public.client_engagements;
create trigger client_engagement_guard_admin_fields
before update on public.client_engagements
for each row execute function public.guard_client_engagement_admin_fields();

-- Private bucket: client files are stored under <auth-user-id>/<filename>.
-- 15 MB maximum; restrict uploads to common business-document formats.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  15728640,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 15728640,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Clients read own private documents" on storage.objects;
create policy "Clients read own private documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'client-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);

drop policy if exists "Clients upload own private documents" on storage.objects;
create policy "Clients upload own private documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'client-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Clients update own private documents" on storage.objects;
create policy "Clients update own private documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'client-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
)
with check (
  bucket_id = 'client-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
);

-- No public read policy, anonymous access, or public file URLs are created.
-- Admin access is limited to accounts whose profiles.role is exactly 'admin'.
