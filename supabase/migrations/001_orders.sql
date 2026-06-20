create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  square_order_id text not null unique,
  square_payment_id text,
  customer_email text,
  status text not null default 'pending',
  amount_cents integer not null default 0,
  tracking_number text,
  carrier text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

revoke all on public.orders from anon, authenticated;
