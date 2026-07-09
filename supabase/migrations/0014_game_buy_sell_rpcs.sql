create function public.game_buy_card(_game_id uuid, _card_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _hand jsonb;
  _cash bigint;
  _idx integer := null;
  _card record;
  _multiplier numeric;
  _price bigint;
  _new_hand jsonb := '[]'::jsonb;
  _elem jsonb;
  _i integer := 0;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' or _game.phase <> 1 then
    raise exception 'not_investment_phase';
  end if;

  select hand, cash into _hand, _cash
    from public.game_players where game_id = _game_id and profile_id = _uid;
  if _hand is null then
    raise exception 'not_in_game';
  end if;

  for _elem in select * from jsonb_array_elements(_hand) loop
    if _elem ->> 'card_id' = _card_id and _idx is null then
      _idx := _i;
    else
      _new_hand := _new_hand || jsonb_build_array(_elem);
    end if;
    _i := _i + 1;
  end loop;

  if _idx is null then
    raise exception 'card_not_in_hand';
  end if;

  select id, name, category, purchase_price, base_value, passive_income, description
    into _card from public.card_catalog where id = _card_id;

  _multiplier := coalesce((_game.market ->> _card.category)::numeric, 1.0);
  _price := round(_card.purchase_price * _multiplier);

  if _cash < _price then
    raise exception 'insufficient_funds';
  end if;

  update public.game_players
    set cash = cash - _price,
        hand = _new_hand,
        assets = assets || jsonb_build_array(jsonb_build_object(
          'instance_id', gen_random_uuid(),
          'card_id', _card.id,
          'name', _card.name,
          'category', _card.category,
          'base_value', _card.base_value,
          'passive_income', _card.passive_income,
          'bought_at_price', _price,
          'acquired_age', _game.age
        ))
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;

create function public.game_sell_asset(_game_id uuid, _instance_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _game public.games;
  _assets jsonb;
  _found jsonb := null;
  _new_assets jsonb := '[]'::jsonb;
  _elem jsonb;
  _multiplier numeric;
  _sell_price bigint;
begin
  select * into _game from public.games where id = _game_id for update;
  if _game.id is null then
    raise exception 'game_not_found';
  end if;
  if _game.status <> 'active' or _game.phase <> 1 then
    raise exception 'not_investment_phase';
  end if;

  select assets into _assets
    from public.game_players where game_id = _game_id and profile_id = _uid;
  if _assets is null then
    raise exception 'not_in_game';
  end if;

  for _elem in select * from jsonb_array_elements(_assets) loop
    if (_elem ->> 'instance_id')::uuid = _instance_id and _found is null then
      _found := _elem;
    else
      _new_assets := _new_assets || jsonb_build_array(_elem);
    end if;
  end loop;

  if _found is null then
    raise exception 'asset_not_owned';
  end if;

  _multiplier := coalesce((_game.market ->> (_found ->> 'category'))::numeric, 1.0);
  _sell_price := round((_found ->> 'base_value')::bigint * _multiplier * 0.90);

  update public.game_players
    set cash = cash + _sell_price,
        assets = _new_assets
    where game_id = _game_id and profile_id = _uid;

  perform private.recompute_player(_game_id, _uid);
end;
$$;

revoke all on function public.game_buy_card(uuid, text) from public;
revoke all on function public.game_sell_asset(uuid, uuid) from public;
grant execute on function public.game_buy_card(uuid, text) to authenticated;
grant execute on function public.game_sell_asset(uuid, uuid) to authenticated;
