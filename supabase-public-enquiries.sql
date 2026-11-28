-- Amanzi Africa: secure public enquiry intake
-- Run once in the Supabase SQL Editor for project ycerajvpuvhesmoigmms.
-- Public visitors can submit; only authenticated Amanzi Africa admins can read/update.

create table if not exists public.public_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 180),
  client_type text not null check (client_type in ('individual', 'business', 'institution')),
  organisation_name text,
  email text not null check (char_length(trim(email)) between 5 and 254),
  phone text not null check (char_length(trim(phone)) between 7 and 50),
  country text not null default 'Kenya' check (char_length(trim(country)) between 2 and 100),
  service_interest text not null check (char_length(trim(service_interest)) between 2 and 180),
  message text check (message is null or char_length(message) <= 3000),
  consent boolean not null default false check (consent = true),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.public_enquiries enable row level security;

revoke all on table public.public_enquiries from anon, authenticated;
grant insert on table public.public_enquiries to anon;
grant select, update on table public.public_enquiries to authenticated;

drop policy if exists "Public can submit enquiries" on public.public_enquiries;
create policy "Public can submit enquiries"
on public.public_enquiries
for insert
to anon
with check (
  consent = true
  and char_length(trim(full_name)) between 2 and 180
  and char_length(trim(email)) between 5 and 254
  and char_length(trim(phone)) between 7 and 50
);

drop policy if exists "Admins can view enquiries" on public.public_enquiries;
create policy "Admins can view enquiries"
on public.public_enquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update enquiries" on public.public_enquiries;
create policy "Admins can update enquiries"
on public.public_enquiries
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
