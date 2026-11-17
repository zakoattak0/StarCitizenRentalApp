-- Additive migration: preserve all existing crew postings and deals.
begin;
alter table public.crew_listings
  add column if not exists availability jsonb not null default '{"mode":"anytime","noticeHours":0,"timeZone":"UTC","startAt":null,"endAt":null}'::jsonb;
alter table public.deals add column if not exists scheduled_start timestamptz;
alter table public.deals add column if not exists scheduled_end timestamptz;
alter table public.deals add column if not exists schedule_timezone text;
notify pgrst, 'reload schema';
commit;
