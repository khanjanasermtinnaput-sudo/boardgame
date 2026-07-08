-- F9 (found via live adversarial testing): SELECT policies on rooms,
-- room_players, chat_messages, games, game_actions, game_log, and
-- game_results all reference private.is_room_member / is_room_host /
-- game_room_id. Those functions only had EXECUTE granted to `authenticated`,
-- not `anon`. A genuinely unauthenticated caller (Postgres `anon` role — not
-- the app's anonymous-session users, who are `authenticated`) hitting any of
-- these tables got a raw "permission denied for function is_room_member"
-- (42501) instead of a clean, policy-correct result. Access was never
-- actually exposed (permission denied still denies), but it's an ugly
-- internal-error leak and breaks the intended "is_public rooms are visible
-- to anyone" behavior for genuinely logged-out callers.
--
-- The helper functions only ever check auth.uid(), which is NULL for the
-- anon role and makes every membership/host check safely evaluate to false
-- — so granting anon EXECUTE cannot expose anything new.

grant execute on function
  private.is_room_member(uuid),
  private.is_room_host(uuid),
  private.game_room_id(uuid)
to anon;
