-- Allow the trusted server functions to write to the shared game tables.
--
-- Lovable Cloud only exposes the project URL + publishable (anon) key to the
-- server runtime (no service-role key), so the server writes with the anon
-- role and RLS applies. Without these policies every write is silently
-- rejected and the server falls back to ephemeral in-memory state, which is
-- why the leaderboard and player progress reset on each redeploy.
--
-- All writes still go exclusively through validated, rate-limited
-- createServerFn handlers — the browser has no direct table write path.
-- drop+create keeps this idempotent.

drop policy if exists "server write users" on public.users;
create policy "server write users" on public.users
  for all using (true) with check (true);

drop policy if exists "server write chat" on public.chat_messages;
create policy "server write chat" on public.chat_messages
  for all using (true) with check (true);

drop policy if exists "server write catches" on public.fish_catches;
create policy "server write catches" on public.fish_catches
  for all using (true) with check (true);

drop policy if exists "server write presence" on public.world_presence;
create policy "server write presence" on public.world_presence
  for all using (true) with check (true);

drop policy if exists "server write plots" on public.world_plots;
create policy "server write plots" on public.world_plots
  for all using (true) with check (true);

drop policy if exists "server write winners" on public.leaderboard_winners;
create policy "server write winners" on public.leaderboard_winners
  for all using (true) with check (true);
