-- Mission 2 final polish: normalize known beta place categories.

update public.places
set category = 'Restaurant', updated_at = now()
where lower(name) like '%fuji japanese steakhouse%';

update public.places
set category = 'Coffee shop', updated_at = now()
where lower(name) like '%starbucks%';

update public.places
set category = 'Library', updated_at = now()
where lower(name) = 'rapid city public library';

update public.places
set category = 'Attraction', updated_at = now()
where lower(name) = 'main street square';
