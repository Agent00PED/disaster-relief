-- 39_update_request.sql -- Update an untouched pending request through a guarded RPC

create or replace function public.update_request(
  p_id       uuid,
  p_quantity int,
  p_urgency  text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'F5:not_logged_in';
  end if;

  if not public.is_staff_or_admin() then
    raise exception 'F5:admin_only';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'F5:invalid_quantity';
  end if;

  if p_urgency is null or p_urgency not in ('low', 'medium', 'high') then
    raise exception 'F5:invalid_urgency';
  end if;

  select *
    into v_request
    from public.requests
   where id = p_id
   for update;

  if not found then
    raise exception 'F5:request_not_found';
  end if;

  if v_request.status <> 'pending' or v_request.quantity_fulfilled <> 0 then
    raise exception 'F5:update_not_allowed';
  end if;

  update public.requests
     set quantity_requested = p_quantity,
         urgency = p_urgency
   where id = p_id;

  return p_id;
end;
$$;

revoke all on function public.update_request(uuid, int, text) from public;
grant execute on function public.update_request(uuid, int, text) to authenticated;
