-- ============================================================
-- FAF — Family App Finances
-- Schema completo: tablas, RLS y trigger de categorías por defecto
-- Pegar completo en Supabase → SQL Editor → Run
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null default '',
  savings_goal_percent integer not null default 25,
  created_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuario ve su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuario actualiza su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuario inserta su propio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Usuario ve sus categorías"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Usuario inserta sus categorías"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Usuario actualiza sus categorías"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Usuario elimina sus categorías"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 3. SUBCATEGORIES
-- ============================================================
create table if not exists public.subcategories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.subcategories enable row level security;

create policy "Usuario ve sus subcategorías"
  on public.subcategories for select
  using (auth.uid() = user_id);

create policy "Usuario inserta sus subcategorías"
  on public.subcategories for insert
  with check (auth.uid() = user_id);

create policy "Usuario actualiza sus subcategorías"
  on public.subcategories for update
  using (auth.uid() = user_id);

create policy "Usuario elimina sus subcategorías"
  on public.subcategories for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================
create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,
  amount         integer not null, -- en CLP, sin decimales
  description    text not null default '',
  merchant       text not null default '',
  subcategory_id uuid references public.subcategories(id) on delete set null,
  is_fixed       boolean not null default false,
  origin         text not null default 'manual'
                 check (origin in ('manual','receipt','screenshot','transfer','recurring','installment')),
  type           text not null default 'expense'
                 check (type in ('expense','transfer','card_payment')),
  created_at     timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Usuario ve sus transacciones"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Usuario inserta sus transacciones"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Usuario actualiza sus transacciones"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Usuario elimina sus transacciones"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- índice para consultas por mes
create index if not exists transactions_user_date_idx
  on public.transactions(user_id, date);

-- ============================================================
-- 5. TRIGGER: perfil + categorías por defecto al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  cat_casa        uuid;
  cat_comida      uuid;
  cat_alcohol     uuid;
  cat_transporte  uuid;
  cat_salud       uuid;
  cat_vestuario   uuid;
  cat_ocio        uuid;
  cat_tecnologia  uuid;
  cat_regalos     uuid;
  cat_otros       uuid;
begin
  -- Perfil
  insert into public.profiles(id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  -- Categorías
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Casa',       1) returning id into cat_casa;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Comida',     2) returning id into cat_comida;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Alcohol',    3) returning id into cat_alcohol;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Transporte', 4) returning id into cat_transporte;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Salud',      5) returning id into cat_salud;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Vestuario',  6) returning id into cat_vestuario;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Ocio',       7) returning id into cat_ocio;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Tecnología', 8) returning id into cat_tecnologia;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Regalos',    9) returning id into cat_regalos;
  insert into public.categories(user_id, name, sort_order) values (new.id, 'Otros',     10) returning id into cat_otros;

  -- Subcategorías: Casa
  insert into public.subcategories(user_id, category_id, name, sort_order) values
    (new.id, cat_casa, 'Arriendo',         1),
    (new.id, cat_casa, 'Luz',              2),
    (new.id, cat_casa, 'Agua',             3),
    (new.id, cat_casa, 'Gas',              4),
    (new.id, cat_casa, 'Internet/WiFi',    5),
    (new.id, cat_casa, 'Jardinero',        6),
    (new.id, cat_casa, 'Nana',             7),
    (new.id, cat_casa, 'Aseo y limpieza',  8);

  -- Subcategorías: Comida
  insert into public.subcategories(user_id, category_id, name, sort_order) values
    (new.id, cat_comida, 'Abarrotes',              1),
    (new.id, cat_comida, 'Proteínas',              2),
    (new.id, cat_comida, 'Frutas y verduras',      3),
    (new.id, cat_comida, 'Comida fuera',           4),
    (new.id, cat_comida, 'Delivery',               5),
    (new.id, cat_comida, 'Gasto hormiga',          6);

  -- Subcategorías: Transporte
  insert into public.subcategories(user_id, category_id, name, sort_order) values
    (new.id, cat_transporte, 'Bencina', 1),
    (new.id, cat_transporte, 'Uber',    2),
    (new.id, cat_transporte, 'TAG',     3),
    (new.id, cat_transporte, 'Bip!',   4),
    (new.id, cat_transporte, 'Turno',  5);

  -- Subcategorías: Salud
  insert into public.subcategories(user_id, category_id, name, sort_order) values
    (new.id, cat_salud, 'Remedios',          1),
    (new.id, cat_salud, 'Higiene personal',  2),
    (new.id, cat_salud, 'Accidentes',        3);

  -- Subcategorías: Ocio
  insert into public.subcategories(user_id, category_id, name, sort_order) values
    (new.id, cat_ocio, 'Disco',                      1),
    (new.id, cat_ocio, 'Cigarros y encendedor',      2),
    (new.id, cat_ocio, 'Salidas',                    3),
    (new.id, cat_ocio, 'Paseos',                     4),
    (new.id, cat_ocio, 'Streaming y suscripciones',  5);

  -- Subcategorías: Tecnología
  insert into public.subcategories(user_id, category_id, name, sort_order) values
    (new.id, cat_tecnologia, 'IA',                      1),
    (new.id, cat_tecnologia, 'Implementos tecnológicos', 2);

  return new;
end;
$$;

-- Conectar trigger a auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
