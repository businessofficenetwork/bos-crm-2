-- Grant the CRM app access to the leads table, matching the
-- permissive "allow all" policy every other CRM table already has
-- (no auth system exists yet, so this doesn't introduce new
-- exposure beyond what already exists everywhere else). The landing
-- page's Netlify function keeps using the service_role key
-- regardless, since it bypasses RLS entirely either way.
create policy "allow all - leads" on public.leads for all using (true) with check (true);
