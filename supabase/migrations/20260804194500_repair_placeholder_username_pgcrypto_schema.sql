-- Repair Sprint 3 placeholder username generation when pgcrypto is installed
-- in the extensions schema. Do not broaden search_path; qualify the extension
-- function instead.

create or replace function public.generate_placeholder_username()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'contributor-' || substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12);
    exit when not exists (
      select 1 from public.profiles where lower(username) = lower(candidate)
    );
  end loop;

  return candidate;
end;
$$;
