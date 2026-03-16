import type { SheetRow, ParsedPlugin, ImportPreview } from '@/types'

// ─── Parser plugins ────────────────────────────────────────────────────────
// Format attendu : "Elementor|49|2025-03-01, Complianz|29|2025-06-01"
export function parsePlugins(raw: string): { plugins: ParsedPlugin[]; errors: string[] } {
  const plugins: ParsedPlugin[] = []
  const errors: string[] = []

  if (!raw || raw.trim() === '') return { plugins, errors }

  const items = raw.split(',').map(s => s.trim()).filter(Boolean)

  for (const item of items) {
    const parts = item.split('|').map(s => s.trim())

    if (parts.length < 2) {
      errors.push(`Plugin mal formaté : "${item}" (attendu: Nom|Prix|Date)`)
      continue
    }

    const [nom, coutRaw, dateRaw] = parts
    const cout = parseFloat(coutRaw.replace('€', '').replace(',', '.'))

    if (isNaN(cout)) {
      errors.push(`Prix invalide pour "${nom}" : "${coutRaw}"`)
      continue
    }

    plugins.push({
      nom,
      cout,
      date_renouvellement: dateRaw ?? '',
    })
  }

  return { plugins, errors }
}

// ─── Parser une ligne du Sheet ─────────────────────────────────────────────
export function parseSheetRow(row: SheetRow, existingDomains: string[]): ImportPreview {
  const errors: string[] = []
  const { plugins, errors: pluginErrors } = parsePlugins(row.plugins_raw)

  errors.push(...pluginErrors)

  if (!row.nom_projet) errors.push('Nom du projet manquant')
  if (!row.nom_domaine) errors.push('Nom de domaine manquant')
  if (!row.contact_mail) errors.push('Email de contact manquant')

  const isDuplicate = existingDomains.includes(row.nom_domaine?.trim())
  if (isDuplicate) errors.push(`Domaine "${row.nom_domaine}" déjà importé`)

  return {
    row,
    parsed: {
      client: {
        nom_projet: row.nom_projet?.trim() ?? '',
        contact_mail: row.contact_mail?.trim() ?? '',
        contact_tel: row.contact_tel?.trim() ?? '',
        repertoire_wp: row.repertoire_wp?.trim() || 'wp-admin',
      },
      site: {
        nom_domaine: row.nom_domaine?.trim() ?? '',
        hebergeur: row.hebergeur?.trim() ?? '',
        nbr_adresses_mail: parseInt(row.nbr_adresses_mail) || 0,
        date_renouvellement_prestation: row.date_renouvellement_prestation?.trim() ?? '',
        cout_mensuel: 0, // à saisir manuellement si absent du Sheet
      },
      plugins,
    },
    errors,
    isDuplicate,
  }
}

// ─── Parser toutes les lignes ──────────────────────────────────────────────
export function parseAllRows(rows: SheetRow[]): ImportPreview[] {
  const seenDomains: string[] = []
  return rows.map(row => {
    const preview = parseSheetRow(row, seenDomains)
    if (!preview.isDuplicate && row.nom_domaine) {
      seenDomains.push(row.nom_domaine.trim())
    }
    return preview
  })
}

// ─── Mapping colonnes Google Sheets → SheetRow ─────────────────────────────
// Clés = en-têtes exacts de ton Google Sheet (à ajuster si besoin)
export const SHEETS_COLUMN_MAP: Record<keyof SheetRow, string[]> = {
  nom_projet:                       ['Nom du projet', 'nom_projet', 'Projet'],
  nom_domaine:                      ['Nom de domaine', 'nom_domaine', 'Domaine'],
  hebergeur:                        ['Hébergeur', 'hebergeur', 'Hosting'],
  nbr_adresses_mail:                ['Nbr d\'adresse mails', 'Nbr adresses mails', 'nb_mails'],
  plugins_raw:                      ['Plugins', 'plugins', 'Licences'],
  date_renouvellement_prestation:   ['Date de renouvellement de la prestation', 'Date renouvellement', 'date_renouvellement'],
  historique_raw:                   ['Historique des renouvellements', 'Historique', 'historique'],
  repertoire_wp:                    ['Répertoire de connexion Wordpress', 'Répertoire WP', 'repertoire_wp'],
  contact_mail:                     ['Contact mail', 'Email', 'contact_mail'],
  contact_tel:                      ['Contact tel', 'Téléphone', 'contact_tel'],
}

export function mapSheetHeaders(
  headers: string[],
  data: string[][]
): SheetRow[] {
  const columnIndex: Partial<Record<keyof SheetRow, number>> = {}

  // Trouver l'index de chaque colonne connue
  for (const [field, aliases] of Object.entries(SHEETS_COLUMN_MAP)) {
    const idx = headers.findIndex(h =>
      aliases.some(alias => alias.toLowerCase() === h.toLowerCase().trim())
    )
    if (idx !== -1) {
      columnIndex[field as keyof SheetRow] = idx
    }
  }

  return data.map(row => {
    const get = (field: keyof SheetRow): string => {
      const idx = columnIndex[field]
      return idx !== undefined ? (row[idx] ?? '') : ''
    }

    return {
      nom_projet:                      get('nom_projet'),
      nom_domaine:                     get('nom_domaine'),
      hebergeur:                       get('hebergeur'),
      nbr_adresses_mail:               get('nbr_adresses_mail'),
      plugins_raw:                     get('plugins_raw'),
      date_renouvellement_prestation:  get('date_renouvellement_prestation'),
      historique_raw:                  get('historique_raw'),
      repertoire_wp:                   get('repertoire_wp'),
      contact_mail:                    get('contact_mail'),
      contact_tel:                     get('contact_tel'),
    }
  })
}
