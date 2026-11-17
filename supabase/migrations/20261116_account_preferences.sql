-- Optional profile preferences. Existing accounts remain unset.
begin;
alter table public.users add column if not exists region text check (region is null or region in ('USA', 'EU', 'AUS', 'ASIA'));
alter table public.users add column if not exists time_zone text;
notify pgrst, 'reload schema';
commit;
