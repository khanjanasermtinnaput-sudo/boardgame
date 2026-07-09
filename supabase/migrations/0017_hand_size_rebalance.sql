-- Rebalance base hand size from 6 to 4. Reissues resolve_phase_4_to_5 and
-- game_start with the new target rather than editing the original
-- migrations in place (Supabase migrations are append-only history).

create or replace function private.resolve_phase_4_to_5(_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  _need integer;
begin
  for rec in select profile_id, hand from public.game_players where game_id = _game_id loop
    _need := 4 - jsonb_array_length(rec.hand);
    if _need > 0 then
      perform private.draw_cards(_game_id, rec.profile_id, _need);
    end if;
  end loop;

  update public.games set phase = 5 where id = _game_id;
end;
$$;

create or replace function public.game_start(_room_id uuid)
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  _game public.games;
  _ready_count integer;
  _total integer;
  _rp record;
  _initial_market jsonb := '{"house":1.0,"business":1.0,"growth_stock":1.0,"dividend_stock":1.0,"gold":1.0,"car":1.0,"land":1.0,"commercial_building":1.0,"crypto":1.0,"special_asset":1.0}'::jsonb;
  _deck jsonb;
begin
  if not exists (
    select 1 from public.rooms where id = _room_id and host_id = auth.uid() and status = 'lobby'
  ) then
    raise exception 'not_host_or_not_in_lobby';
  end if;

  select count(*) filter (where is_ready), count(*)
    into _ready_count, _total
    from public.room_players where room_id = _room_id and not is_spectator;

  if _total < 2 then
    raise exception 'not_enough_players';
  end if;
  if _ready_count < _total then
    raise exception 'players_not_ready';
  end if;

  update public.rooms set status = 'in_game' where id = _room_id;

  insert into public.games (room_id, status, age, phase, round_no, market)
  values (_room_id, 'active', 20, 1, 1, _initial_market)
  returning * into _game;

  for _rp in
    select profile_id, seat from public.room_players
    where room_id = _room_id and not is_spectator
  loop
    select jsonb_agg(id order by random()) into _deck from public.card_catalog;

    insert into public.game_players (game_id, profile_id, seat, cash, salary, deck, deck_cursor, hand, assets, debts)
    values (_game.id, _rp.profile_id, _rp.seat, 10000, 2000, _deck, 0, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb);

    perform private.draw_cards(_game.id, _rp.profile_id, 4);
    perform private.recompute_player(_game.id, _rp.profile_id);
  end loop;

  return _game;
end;
$$;

revoke all on function public.game_start(uuid) from public;
grant execute on function public.game_start(uuid) to authenticated;
