-- FSX Frontier Service Exchange persistence schema.
-- Run this in the Supabase SQL editor for the project backing the Vercel app.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id text primary key,
  display_name text not null,
  avatar_url text,
  rsi_handle text,
  public_profile_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ship_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id text,
  owner_name text not null,
  ship_name text not null,
  role text not null default 'General',
  manufacturer text,
  rates jsonb not null default '{}'::jsonb,
  offered_rates text[] not null default '{}'::text[],
  rate_base_period text not null default 'hour',
  rate_base integer not null default 0,
  rate_adjustments jsonb not null default '{}'::jsonb,
  pilot_included boolean not null default false,
  pilot_rate integer not null default 0,
  hangar_load_cost integer not null default 0,
  hangar_load_mode text not null default 'flat',
  hangar_load_percent integer not null default 0,
  hangar_fee_treatment text not null default 'add',
  notes text,
  available_dates text[] not null default '{}'::text[],
  ship_config jsonb,
  hangar_services jsonb not null default '[]'::jsonb,
  vehicle jsonb,
  rating numeric(2, 1) not null default 0,
  completed_jobs integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crew_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id text,
  provider_name text not null,
  role text not null,
  price integer not null default 0,
  pay_type text not null default 'flat',
  rating numeric(2, 1) not null default 0,
  completed_jobs integer not null default 0,
  availability_status text not null default 'Available now',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id text,
  posted_by text not null,
  location text,
  needed_by text,
  price text,
  materials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.material_offers (
  id uuid primary key default gen_random_uuid(),
  material_request_id uuid references public.material_requests(id) on delete cascade,
  provider_id text,
  provider_name text not null,
  offer_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rental_availability (
  id uuid primary key default gen_random_uuid(),
  ship_listing_id uuid references public.ship_listings(id) on delete cascade,
  availability_date date not null,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ship_listing_id, availability_date)
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  reviewer_id text,
  reviewee_id text,
  contract_type text,
  rating integer not null check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  org_name text not null,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_ship_listings_updated_at on public.ship_listings;
create trigger set_ship_listings_updated_at
before update on public.ship_listings
for each row execute function public.set_updated_at();

drop trigger if exists set_crew_listings_updated_at on public.crew_listings;
create trigger set_crew_listings_updated_at
before update on public.crew_listings
for each row execute function public.set_updated_at();

drop trigger if exists set_material_requests_updated_at on public.material_requests;
create trigger set_material_requests_updated_at
before update on public.material_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_material_offers_updated_at on public.material_offers;
create trigger set_material_offers_updated_at
before update on public.material_offers
for each row execute function public.set_updated_at();

drop trigger if exists set_rental_availability_updated_at on public.rental_availability;
create trigger set_rental_availability_updated_at
before update on public.rental_availability
for each row execute function public.set_updated_at();

drop trigger if exists set_org_memberships_updated_at on public.org_memberships;
create trigger set_org_memberships_updated_at
before update on public.org_memberships
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.ship_listings enable row level security;
alter table public.crew_listings enable row level security;
alter table public.material_requests enable row level security;
alter table public.material_offers enable row level security;
alter table public.rental_availability enable row level security;
alter table public.ratings enable row level security;
alter table public.org_memberships enable row level security;

-- Temporary public policies for the current no-Supabase-auth phase.
-- Tighten these when Discord accounts are connected to Supabase identities.
drop policy if exists users_select_public on public.users;
create policy users_select_public on public.users for select using (true);

drop policy if exists ship_listings_select_public on public.ship_listings;
create policy ship_listings_select_public on public.ship_listings for select using (true);
drop policy if exists ship_listings_insert_public on public.ship_listings;
create policy ship_listings_insert_public on public.ship_listings for insert with check (true);
drop policy if exists ship_listings_update_public on public.ship_listings;
create policy ship_listings_update_public on public.ship_listings for update using (true) with check (true);
drop policy if exists ship_listings_delete_public on public.ship_listings;
create policy ship_listings_delete_public on public.ship_listings for delete using (true);

drop policy if exists crew_listings_select_public on public.crew_listings;
create policy crew_listings_select_public on public.crew_listings for select using (true);
drop policy if exists crew_listings_insert_public on public.crew_listings;
create policy crew_listings_insert_public on public.crew_listings for insert with check (true);
drop policy if exists crew_listings_delete_public on public.crew_listings;
create policy crew_listings_delete_public on public.crew_listings for delete using (true);

drop policy if exists material_requests_select_public on public.material_requests;
create policy material_requests_select_public on public.material_requests for select using (true);
drop policy if exists material_requests_insert_public on public.material_requests;
create policy material_requests_insert_public on public.material_requests for insert with check (true);
drop policy if exists material_requests_delete_public on public.material_requests;
create policy material_requests_delete_public on public.material_requests for delete using (true);

drop policy if exists material_offers_select_public on public.material_offers;
create policy material_offers_select_public on public.material_offers for select using (true);
drop policy if exists material_offers_insert_public on public.material_offers;
create policy material_offers_insert_public on public.material_offers for insert with check (true);

drop policy if exists rental_availability_select_public on public.rental_availability;
create policy rental_availability_select_public on public.rental_availability for select using (true);

drop policy if exists ratings_select_public on public.ratings;
create policy ratings_select_public on public.ratings for select using (true);

drop policy if exists org_memberships_select_public on public.org_memberships;
create policy org_memberships_select_public on public.org_memberships for select using (true);
