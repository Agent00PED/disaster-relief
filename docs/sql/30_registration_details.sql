-- Run after 28_volunteer_profile.sql and 29_missing_columns.sql. Existing accounts keep nullable new fields.
begin;
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists birth_year integer check (birth_year between 2400 and 2800),
  add column if not exists id_photo_path text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  requested_center uuid;
  requested_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
begin
  -- allowlist: ยอมรับแค่ค่า 'volunteer' เท่านั้นจาก client, อย่างอื่น
  -- (รวมถึงไม่ส่งมาเลย หรือพยายามส่ง 'admin'/'staff') ตกไปเป็น 'staff' หมด
  if requested_role is distinct from 'volunteer' then
    requested_role := 'staff';
  end if;

  if requested_role = 'volunteer' then
    begin
      requested_center := (new.raw_user_meta_data ->> 'center_id')::uuid;
    exception when others then
      requested_center := null;
    end;
  end if;

  insert into public.profiles (id, full_name, role, center_id, username, first_name, last_name, phone, birth_year, id_photo_path)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role,
    requested_center,
    requested_username,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'birth_year', '')::int,
    null
  );
  return new;
end;
$$;

-- Reuse the private volunteer-ids bucket and policies from migration 28.
commit;
