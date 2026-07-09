-- Server-side content catalogs. These are the source of truth for pricing
-- and effects — RPCs always re-fetch from here by id rather than trusting
-- any client-supplied price/value, so a tampered client can't buy a card
-- below market or forge a favorable event.

create table public.card_catalog (
  id text primary key,
  name text not null,
  category text not null check (category in (
    'house', 'business', 'growth_stock', 'dividend_stock', 'gold',
    'car', 'land', 'commercial_building', 'crypto', 'special_asset'
  )),
  purchase_price bigint not null check (purchase_price > 0),
  base_value bigint not null check (base_value > 0),
  passive_income bigint not null default 0,
  description text not null
);

create table public.global_event_catalog (
  id text primary key,
  name text not null,
  type text not null check (type in ('positive_market', 'economic_slowdown', 'black_event')),
  description text not null,
  -- multiplicative deltas applied to the running per-category market
  -- multiplier, e.g. {"gold": 1.20, "crypto": 0.55}. Categories not present
  -- are unaffected by this event.
  effects jsonb not null default '{}'::jsonb
);

create table public.personal_event_catalog (
  id text primary key,
  name text not null,
  description text not null,
  effect_kind text not null check (effect_kind in ('cash', 'cash_pct_net_worth', 'salary', 'grant_card')),
  -- 'cash': amount = flat cash delta (bigint, can be negative)
  -- 'cash_pct_net_worth': pct = signed fraction of current net worth (e.g. 0.05, -0.04)
  -- 'salary': amount = flat delta to per-round salary (floored at 0 total)
  -- 'grant_card': no params — grants one random catalog card free into assets
  amount bigint,
  pct numeric
);

alter table public.card_catalog enable row level security;
alter table public.global_event_catalog enable row level security;
alter table public.personal_event_catalog enable row level security;

create policy "card_catalog_select_all" on public.card_catalog for select using (true);
create policy "global_event_catalog_select_all" on public.global_event_catalog for select using (true);
create policy "personal_event_catalog_select_all" on public.personal_event_catalog for select using (true);
