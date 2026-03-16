-- ─────────────────────────────────────────────────────────────
-- WP Maintenance Manager — Schéma Supabase
-- Migration: 001_initial_schema
-- ─────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── Clients ──────────────────────────────────────────────────
create table clients (
  id            uuid primary key default uuid_generate_v4(),
  nom_projet    text not null,
  contact_mail  text,
  contact_tel   text,
  repertoire_wp text default 'wp-admin',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Sites ────────────────────────────────────────────────────
create table sites (
  id                              uuid primary key default uuid_generate_v4(),
  client_id                       uuid references clients(id) on delete cascade,
  nom_domaine                     text not null unique,
  hebergeur                       text,
  nbr_adresses_mail               int default 0,
  date_renouvellement_prestation  date,
  cout_mensuel                    numeric(10,2) default 0,
  created_at                      timestamptz default now(),
  updated_at                      timestamptz default now()
);

-- ─── Plugins ──────────────────────────────────────────────────
create table plugins (
  id                   uuid primary key default uuid_generate_v4(),
  site_id              uuid references sites(id) on delete cascade,
  nom                  text not null,
  cout                 numeric(10,2) default 0,
  date_renouvellement  date,
  fournisseur          text,
  created_at           timestamptz default now()
);

-- ─── Historique renouvellements ───────────────────────────────
create type type_renouvellement as enum ('prestation', 'plugin', 'domaine', 'hebergement');

create table historique_renouvellements (
  id                   uuid primary key default uuid_generate_v4(),
  site_id              uuid references sites(id) on delete cascade,
  date_renouvellement  date not null,
  type                 type_renouvellement not null,
  montant              numeric(10,2) default 0,
  notes                text,
  created_at           timestamptz default now()
);

-- ─── Vue : échéances à venir (J-15) ──────────────────────────
create or replace view echeances_a_venir as
  -- Prestations
  select
    s.id as site_id,
    c.nom_projet,
    s.nom_domaine,
    'prestation'::text as type,
    null as nom_item,
    s.date_renouvellement_prestation as date_echeance,
    s.date_renouvellement_prestation - current_date as jours_restants,
    s.cout_mensuel as montant
  from sites s
  join clients c on c.id = s.client_id
  where s.date_renouvellement_prestation is not null
    and s.date_renouvellement_prestation - current_date between 0 and 15

  union all

  -- Plugins
  select
    s.id as site_id,
    c.nom_projet,
    s.nom_domaine,
    'plugin'::text as type,
    p.nom as nom_item,
    p.date_renouvellement as date_echeance,
    p.date_renouvellement - current_date as jours_restants,
    p.cout as montant
  from plugins p
  join sites s on s.id = p.site_id
  join clients c on c.id = s.client_id
  where p.date_renouvellement is not null
    and p.date_renouvellement - current_date between 0 and 15

  order by jours_restants asc;

-- ─── Triggers updated_at ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger sites_updated_at before update on sites
  for each row execute function update_updated_at();

-- ─── RLS (Row Level Security) ─────────────────────────────────
-- Usage solo : on désactive RLS pour l'instant
-- À activer si multi-utilisateurs à l'avenir
alter table clients disable row level security;
alter table sites disable row level security;
alter table plugins disable row level security;
alter table historique_renouvellements disable row level security;
