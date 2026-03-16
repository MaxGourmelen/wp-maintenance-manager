# WP Maintenance Manager

SaaS solo pour gérer la maintenance de 100+ sites WordPress clients.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Auth)
- **Resend** (emails transactionnels)
- **Google Sheets API v4** (import initial)
- **Vercel** (déploiement)

---

## Installation

```bash
# 1. Cloner et installer
git clone ...
cd wp-maintenance-manager
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# → Remplir les valeurs dans .env.local

# 3. Initialiser Supabase
npx supabase init
npx supabase db push  # applique le schéma SQL

# 4. Lancer en développement
npm run dev
```

---

## Structure du projet

```
src/
├── app/
│   ├── dashboard/          # Vue globale + KPIs + échéances
│   ├── clients/            # Liste des clients
│   │   └── [id]/           # Fiche client détaillée
│   ├── import/             # Import Google Sheets
│   ├── alerts/             # Gestion des alertes email
│   └── settings/           # Config app (email, intégrations)
│
├── components/
│   ├── ui/                 # Composants de base (Button, Badge, Card...)
│   ├── dashboard/          # Widgets dashboard (EcheanceCard, StatsBar...)
│   ├── clients/            # ClientTable, ClientForm, PluginList...
│   ├── import/             # ImportStepper, PreviewTable, MappingForm...
│   └── shared/             # Header, Sidebar, Layout...
│
├── lib/
│   ├── supabase/           # Client Supabase + helpers DB
│   ├── google-sheets/      # OAuth + parser colonnes
│   ├── email/              # Templates Resend + envoi alertes
│   └── utils/              # Fonctions utilitaires (dates, formatage...)
│
├── hooks/                  # React hooks custom (useClients, useAlerts...)
├── types/                  # TypeScript types globaux
│
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

---

## Roadmap V1

- [x] Structure projet + types TypeScript
- [x] Schéma SQL Supabase
- [x] Parser Google Sheets (plugins format `Nom|Prix|Date`)
- [ ] Page import : connexion OAuth Google → aperçu → import
- [ ] Dashboard : KPIs + liste échéances J-15
- [ ] Fiche client complète
- [ ] Cron job alertes email (Vercel Cron + Resend)
- [ ] Export CSV facturation

---

## Format Google Sheets attendu

| Colonne | Exemple |
|---|---|
| Nom du projet | Boulangerie Martin |
| Nom de domaine | boulangerie-martin.fr |
| Hébergeur | O2switch personnel |
| Nbr d'adresse mails | 3 |
| Plugins | `Elementor\|49\|2025-03-01, Complianz\|29\|2025-06-01` |
| Date de renouvellement de la prestation | 2025-04-15 |
| Historique des renouvellements | ... |
| Répertoire de connexion Wordpress | wp-admin |
| Contact mail | contact@boulangerie-martin.fr |
| Contact tel | 06 12 34 56 78 |
