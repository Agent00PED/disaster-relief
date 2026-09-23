-- Run after 30_registration_details.sql.
-- Do not invent a month/day for existing accounts that only have a birth year.
begin;
alter table public.profiles add column if not exists birth_date date;
comment on column public.profiles.birth_date is 'Primary birth date for new registrations; unknown for legacy year-only accounts';
comment on column public.profiles.birth_year is 'Buddhist calendar birth year; compatibility field derived from birth_date for new registrations';

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

  insert into public.profiles (id, full_name, role, center_id, username, first_name, last_name, phone, birth_year, birth_date, id_photo_path)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    requested_role,
    requested_center,
    requested_username,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(extract(year from nullif(new.raw_user_meta_data ->> 'birth_date', '')::date)::int + 543,
      nullif(new.raw_user_meta_data ->> 'birth_year', '')::int),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    null
  );
  return new;
end;
$$;
commit;
