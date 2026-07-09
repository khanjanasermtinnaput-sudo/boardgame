-- Private helper functions shared by the game RPCs below.

-- Recompute and persist net_worth and passive_income for one player from
-- their current cash/assets/debts. Called after every mutation so the
-- stored columns are always authoritative (never trust a client-supplied
-- net worth).
create function private.recompute_player(_game_id uuid, _profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _cash bigint;
  _assets jsonb;
  _debts jsonb;
  _asset_value bigint;
  _passive bigint;
  _debt_total bigint;
begin
  select cash, assets, debts into _cash, _assets, _debts
    from public.game_players where game_id = _game_id and profile_id = _profile_id;

  select coalesce(sum((a->>'base_value')::bigint), 0), coalesce(sum((a->>'passive_income')::bigint), 0)
    into _asset_value, _passive
    from jsonb_array_elements(_assets) a;

  select coalesce(sum((d->>'outstanding')::bigint), 0) into _debt_total
    from jsonb_array_elements(_debts) d;

  update public.game_players
    set net_worth = _cash + _asset_value - _debt_total,
        passive_income = _passive
    where game_id = _game_id and profile_id = _profile_id;
end;
$$;

-- Apply a global event's category multiplier deltas to the running market
-- multipliers, clamped to [0.2, 3.0] so no single event (or accumulation of
-- events) can drive a category to zero or unbounded.
create function private.apply_market_effects(_market jsonb, _effects jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  _key text;
  _delta numeric;
  _current numeric;
  _result jsonb := _market;
begin
  for _key in select jsonb_object_keys(_effects) loop
    _current := coalesce((_market ->> _key)::numeric, 1.0);
    _delta := (_effects ->> _key)::numeric;
    _result := jsonb_set(_result, array[_key], to_jsonb(greatest(0.2, least(3.0, _current * _delta))));
  end loop;

  return _result;
end;
$$;

-- Draw `_need` cards into a player's hand from their personal deck,
-- reshuffling (fresh random order, cursor reset to 0) only once the
-- remaining deck is insufficient to cover the draw.
create function private.draw_cards(_game_id uuid, _profile_id uuid, _need integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _deck jsonb;
  _cursor integer;
  _hand jsonb;
  _available integer;
  _take integer;
  _card_id text;
  _card record;
begin
  if _need <= 0 then
    return;
  end if;

  select deck, deck_cursor, hand into _deck, _cursor, _hand
    from public.game_players where game_id = _game_id and profile_id = _profile_id;

  while _need > 0 loop
    _available := jsonb_array_length(_deck) - _cursor;

    if _available <= 0 then
      select jsonb_agg(id order by random()) into _deck from public.card_catalog;
      _cursor := 0;
      _available := jsonb_array_length(_deck);
    end if;

    _take := least(_need, _available);

    for i in 0.._take - 1 loop
      _card_id := _deck ->> (_cursor + i);
      select id, name, category, purchase_price, base_value, passive_income, description
        into _card from public.card_catalog where id = _card_id;

      _hand := _hand || jsonb_build_array(jsonb_build_object(
        'card_id', _card.id,
        'name', _card.name,
        'category', _card.category,
        'purchase_price', _card.purchase_price,
        'base_value', _card.base_value,
        'passive_income', _card.passive_income,
        'description', _card.description
      ));
    end loop;

    _cursor := _cursor + _take;
    _need := _need - _take;
  end loop;

  update public.game_players
    set deck = _deck, deck_cursor = _cursor, hand = _hand
    where game_id = _game_id and profile_id = _profile_id;
end;
$$;

revoke all on function private.apply_market_effects(jsonb, jsonb) from public;
grant execute on function private.apply_market_effects(jsonb, jsonb) to authenticated;
