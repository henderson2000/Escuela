-- =====================================================================
--  Electrónica 3D · ranking online
--  Pegá TODO este archivo en Supabase → SQL Editor → Run.
--  Antes de ejecutarlo, cambiá el PIN docente de la línea marcada abajo.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tablas

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 60),
  curso       text not null check (char_length(curso) between 1 and 20),
  name_key    text generated always as (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) stored,
  curso_key   text generated always as (lower(regexp_replace(curso, '\s', '', 'g'))) stored,
  created_at  timestamptz not null default now(),
  unique (name_key, curso_key)
);

create table if not exists attempts (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references players(id) on delete cascade,
  game         text not null,
  level        text not null default '',
  points       int,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);
create index if not exists attempts_player_idx on attempts (player_id, game, level);

-- configuración privada (nadie la puede leer desde la página)
create table if not exists settings (
  key   text primary key,
  value text not null
);

insert into settings (key, value) values
  ('max_attempts', '2'),
  ('teacher_pin',  'CAMBIAME-1234')   -- <<< CAMBIÁ ESTE PIN ANTES DE EJECUTAR
on conflict (key) do nothing;

-- ---------------------------------------------------------------- seguridad
-- La página sólo puede LEER jugadores e intentos. Todo lo que escribe pasa por las
-- funciones de abajo, que validan el límite de intentos y el puntaje máximo.

alter table players  enable row level security;
alter table attempts enable row level security;
alter table settings enable row level security;

drop policy if exists "lectura publica" on players;
create policy "lectura publica" on players for select using (true);
drop policy if exists "lectura publica" on attempts;
create policy "lectura publica" on attempts for select using (true);
-- settings: sin políticas = sin acceso

revoke insert, update, delete on players, attempts from anon, authenticated;
revoke all on settings from anon, authenticated;

-- ---------------------------------------------------------------- funciones

-- Entrar con nombre y curso: si el alumno no existe, se crea.
create or replace function login(p_name text, p_curso text)
returns players
language plpgsql security definer set search_path = public as $$
declare r players;
begin
  if char_length(btrim(p_name)) < 3 or position(' ' in btrim(p_name)) = 0 then
    raise exception 'NOMBRE_INVALIDO: Escribí tu nombre y apellido.';
  end if;
  insert into players (name, curso)
    values (regexp_replace(btrim(p_name), '\s+', ' ', 'g'), btrim(p_curso))
  on conflict (name_key, curso_key) do update set name = players.name
  returning * into r;
  return r;
end $$;

-- Puntaje máximo de cada juego
create or replace function max_points(p_game text)
returns int language sql immutable as $$
  select case p_game
    when 'protoboard' then 100
    when 'plano'      then 100
    when 'partes'     then 200
    when 'colores'    then 1500
    when 'logo-programa'   then 100
    when 'logo-compuertas' then 200
    when 'logo-tiempos'    then 200
    when 'compu-desafios'  then 100
    else null end
$$;

-- Empezar un intento por puntos (falla si ya usó todos los intentos de ese nivel)
create or replace function start_attempt(p_player uuid, p_game text, p_level text)
returns attempts
language plpgsql security definer set search_path = public as $$
declare
  r attempts;
  usados int;
  maximo int := (select value::int from settings where key = 'max_attempts');
begin
  if max_points(p_game) is null then
    raise exception 'JUEGO_INVALIDO: Juego desconocido.';
  end if;
  if not exists (select 1 from players where id = p_player) then
    raise exception 'SIN_SESION: Volvé a ingresar con tu nombre.';
  end if;
  -- bloquea al jugador para que dos pestañas no puedan empezar a la vez
  perform 1 from players where id = p_player for update;
  select count(*) into usados from attempts
    where player_id = p_player and game = p_game and level = coalesce(p_level, '');
  if usados >= maximo then
    raise exception 'LIMITE_INTENTOS: Ya usaste tus % intentos en este nivel.', maximo;
  end if;
  insert into attempts (player_id, game, level) values (p_player, p_game, coalesce(p_level, ''))
  returning * into r;
  return r;
end $$;

-- Guardar el puntaje de un intento (una sola vez, dentro de las 3 horas)
create or replace function finish_attempt(p_attempt uuid, p_points int)
returns attempts
language plpgsql security definer set search_path = public as $$
declare r attempts;
begin
  update attempts
     set points = least(greatest(p_points, 0), max_points(game)),
         finished_at = now()
   where id = p_attempt
     and points is null
     and started_at > now() - interval '3 hours'
  returning * into r;
  if r.id is null then
    raise exception 'INTENTO_CERRADO: Este intento ya estaba cerrado.';
  end if;
  return r;
end $$;

-- ---------------------------------------------------------------- ranking
-- Una fila por alumno y juego: suma del mejor intento de cada nivel.

create or replace view ranking as
select p.id, p.name, p.curso, b.game,
       coalesce(sum(b.best), 0)::int  as points,
       coalesce(sum(b.plays), 0)::int as plays
  from players p
  left join (
    select player_id, game, level, max(coalesce(points, 0)) as best, count(*) as plays
      from attempts
     group by player_id, game, level
  ) b on b.player_id = p.id
 group by p.id, p.name, p.curso, b.game;

-- ---------------------------------------------------------------- zona docente

create or replace function admin_check_pin(p_pin text)
returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from settings where key = 'teacher_pin' and value = p_pin)
$$;

create or replace function admin_delete_player(p_pin text, p_player uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not admin_check_pin(p_pin) then raise exception 'PIN_INCORRECTO: El PIN docente no es correcto.'; end if;
  delete from players where id = p_player;
end $$;

-- p_game null = todos los juegos
create or replace function admin_reset_attempts(p_pin text, p_player uuid, p_game text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not admin_check_pin(p_pin) then raise exception 'PIN_INCORRECTO: El PIN docente no es correcto.'; end if;
  delete from attempts where player_id = p_player and (p_game is null or game = p_game);
end $$;

-- ---------------------------------------------------------------- permisos

grant usage on schema public to anon, authenticated;
grant select on players, attempts, ranking to anon, authenticated;
grant execute on function login(text, text), start_attempt(uuid, text, text), finish_attempt(uuid, int),
  admin_check_pin(text), admin_delete_player(text, uuid), admin_reset_attempts(text, uuid, text)
  to anon, authenticated;
