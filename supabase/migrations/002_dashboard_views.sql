-- ─────────────────────────────────────────────────────────────────────────
-- Migration 002 : Vues pour les graphiques du dashboard
-- ─────────────────────────────────────────────────────────────────────────

-- ── Vue 1 : Répartition des hébergeurs ────────────────────────────────────
-- Retourne le nombre de sites par hébergeur, trié par count DESC
create or replace view hebergeurs_stats as
  select
    coalesce(nullif(trim(hebergeur), ''), 'Non renseigné') as hebergeur,
    count(*)::int                                           as nb_sites,
    round(
      count(*) * 100.0 / nullif(sum(count(*)) over (), 0),
      1
    )::float                                               as pct
  from sites
  group by hebergeur
  order by nb_sites desc;

-- ── Vue 2 : MRR mensuel sur 12 mois glissants ─────────────────────────────
-- Somme des prestations par mois (depuis historique_renouvellements)
-- On exclut les plugins pour ne garder que les revenus de prestation
create or replace view mrr_mensuel as
  select
    to_char(date_renouvellement, 'YYYY-MM')  as mois,
    to_char(date_renouvellement, 'Mon', 'NLS_DATE_LANGUAGE=FRENCH') as mois_label,
    sum(montant)::float                       as total,
    count(*)::int                             as nb_renouvellements
  from historique_renouvellements
  where
    type = 'prestation'
    and date_renouvellement >= current_date - interval '12 months'
  group by
    to_char(date_renouvellement, 'YYYY-MM'),
    to_char(date_renouvellement, 'Mon', 'NLS_DATE_LANGUAGE=FRENCH')
  order by mois asc;

-- ── Vue 2 bis : MRR calculé depuis sites (sans historique) ───────────────
-- Fallback si l'historique est vide — somme des coûts mensuels actuels
create or replace view mrr_actuel as
  select
    sum(cout_mensuel)::float as mrr,
    count(*)::int            as nb_sites
  from sites
  where cout_mensuel > 0;

-- ── Vue 3 : Coût annuel des licences ─────────────────────────────────────
create or replace view licences_stats as
  select
    sum(cout)::float           as cout_annuel_total,
    count(*)::int              as nb_licences,
    count(distinct site_id)::int as nb_sites_avec_licences
  from plugins;
