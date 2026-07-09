create function public.game_borrow(_game_id uuid, _amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _exists boolean;
begin
  if _amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' or _game.phase <> 1 then
    raise exception 'not_investment_phase';
  end if;

  select exists (
    select 1 from public.game_players where game_id = _game_id and profile_id = _uid
  ) into _exists;
  if not _exists then
    raise exception 'not_in_game';
  end if;

  update public.game_players
    set cash = cash + _amount,
        debts = debts || jsonb_build_array(jsonb_build_object(
          'debt_id', gen_random_uuid(),
          'principal', _amount,
          'outstanding', _amount,
          'created_age', _game.age
        ))
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;

create function public.game_repay(_game_id uuid, _debt_id uuid, _amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _debts jsonb;
  _cash bigint;
  _found jsonb := null;
  _new_debts jsonb := '[]'::jsonb;
  _elem jsonb;
  _outstanding bigint;
  _actual_repay bigint;
  _remaining bigint;
begin
  if _amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' or _game.phase <> 1 then
    raise exception 'not_investment_phase';
  end if;

  select debts, cash into _debts, _cash
    from public.game_players where game_id = _game_id and profile_id = _uid;
  if _debts is null then
    raise exception 'not_in_game';
  end if;

  for _elem in select * from jsonb_array_elements(_debts) loop
    if (_elem ->> 'debt_id')::uuid = _debt_id and _found is null then
      _found := _elem;
    else
      _new_debts := _new_debts || jsonb_build_array(_elem);
    end if;
  end loop;

  if _found is null then
    raise exception 'debt_not_found';
  end if;

  _outstanding := (_found ->> 'outstanding')::bigint;
  _actual_repay := least(_amount, _outstanding);

  if _cash < _actual_repay then
    raise exception 'insufficient_funds';
  end if;

  _remaining := _outstanding - _actual_repay;
  if _remaining > 0 then
    _new_debts := _new_debts || jsonb_build_array(jsonb_set(_found, '{outstanding}', to_jsonb(_remaining)));
  end if;

  update public.game_players
    set cash = cash - _actual_repay,
        debts = _new_debts
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;

revoke all on function public.game_borrow(uuid, bigint) from public;
revoke all on function public.game_repay(uuid, uuid, bigint) from public;
grant execute on function public.game_borrow(uuid, bigint) to authenticated;
grant execute on function public.game_repay(uuid, uuid, bigint) to authenticated;
