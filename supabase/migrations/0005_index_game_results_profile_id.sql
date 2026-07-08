-- Advisor finding: game_results.profile_id (FK to profiles) lacked a
-- covering index.
create index game_results_profile_id_idx on public.game_results (profile_id);
