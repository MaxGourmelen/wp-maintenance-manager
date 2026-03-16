// ─── Client ───────────────────────────────────────────────────────────────────
export interface Client {
  id: string
  nom_projet: string
  contact_mail: string
  contact_tel: string
  repertoire_wp: string // ex: "wp-admin"
  created_at: string
  updated_at: string
}

// ─── Site ─────────────────────────────────────────────────────────────────────
export interface Site {
  id: string
  client_id: string
  nom_domaine: string
  hebergeur: string
  nbr_adresses_mail: number
  date_renouvellement_prestation: string // ISO date
  cout_mensuel: number
  created_at: string
  updated_at: string
  // Relations
  client?: Client
  plugins?: Plugin[]
  historique?: HistoriqueRenouvellement[]
}

// ─── Plugin ───────────────────────────────────────────────────────────────────
export interface Plugin {
  id: string
  site_id: string
  nom: string
  cout: number
  date_renouvellement: string // ISO date
  fournisseur?: string
  created_at: string
}

// ─── Historique ───────────────────────────────────────────────────────────────
export type TypeRenouvellement = 'prestation' | 'plugin' | 'domaine' | 'hebergement'

export interface HistoriqueRenouvellement {
  id: string
  site_id: string
  date_renouvellement: string
  type: TypeRenouvellement
  montant: number
  notes?: string
  created_at: string
}

// ─── Import ───────────────────────────────────────────────────────────────────
export interface SheetRow {
  nom_projet: string
  nom_domaine: string
  hebergeur: string
  nbr_adresses_mail: string
  plugins_raw: string // "Elementor|49|2025-03-01, Complianz|29|2025-06-01"
  date_renouvellement_prestation: string
  historique_raw: string
  repertoire_wp: string
  contact_mail: string
  contact_tel: string
}

export interface ParsedPlugin {
  nom: string
  cout: number
  date_renouvellement: string
}

export interface ImportPreview {
  row: SheetRow
  parsed: {
    client: Omit<Client, 'id' | 'created_at' | 'updated_at'>
    site: Omit<Site, 'id' | 'client_id' | 'created_at' | 'updated_at'>
    plugins: ParsedPlugin[]
  }
  errors: string[]
  isDuplicate: boolean
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface EcheanceAlert {
  site_id: string
  nom_projet: string
  nom_domaine: string
  type: TypeRenouvellement | 'plugin'
  nom_item?: string // nom du plugin si type === 'plugin'
  date_echeance: string
  jours_restants: number
  montant?: number
}

export interface DashboardStats {
  total_clients: number
  mrr: number // Monthly Recurring Revenue
  echeances_15j: number
  cout_licences_annuel: number
}
