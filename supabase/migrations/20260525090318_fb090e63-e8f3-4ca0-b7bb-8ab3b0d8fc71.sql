
create type public.order_status as enum ('pending','confirmed','shipped','delivered','cancelled');
create type public.payment_method as enum ('cod','esewa','khalti');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  product_title text not null,
  product_image text,
  unit_price integer not null,
  quantity integer not null default 1,
  total integer not null,
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  notes text,
  payment_method public.payment_method not null default 'cod',
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users view own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Users create own orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Users update own orders" on public.orders
  for update using (auth.uid() = user_id);

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
before update on public.orders
for each row execute function public.update_updated_at_column();

create index orders_user_id_idx on public.orders(user_id);
