import { z } from 'zod'

// ─── Plugin ────────────────────────────────────────────────────────────────
export const pluginSchema = z.object({
  id:                  z.string().optional(),
  nom:                 z.string().min(1, 'Nom du plugin requis'),
  cout:                z.coerce.number().min(0, 'Prix invalide'),
  date_renouvellement: z.string().min(1, 'Date requise'),
  fournisseur:         z.string().optional(),
})

export type PluginFormData = z.infer<typeof pluginSchema>

// ─── Formulaire client complet ─────────────────────────────────────────────
export const clientFormSchema = z.object({
  // Client
  nom_projet:    z.string().min(1, 'Nom du projet requis'),
  contact_mail:  z.string().email('Format email invalide'),
  contact_tel:   z.string().optional(),
  repertoire_wp: z.string().default('wp-admin'),

  // Site
  nom_domaine:                    z.string().min(1, 'Nom de domaine requis'),
  hebergeur:                      z.string().optional(),
  nbr_adresses_mail:              z.coerce.number().min(0).default(0),
  cout_mensuel:                   z.coerce.number().min(0, 'Coût mensuel requis'),
  date_renouvellement_prestation: z.string().optional(),

  // Plugins
  plugins: z.array(pluginSchema).default([]),
})

export type ClientFormData = z.infer<typeof clientFormSchema>

// Valeurs par défaut pour un nouveau client
export const defaultClientForm: ClientFormData = {
  nom_projet:                     '',
  contact_mail:                   '',
  contact_tel:                    '',
  repertoire_wp:                  'wp-admin',
  nom_domaine:                    '',
  hebergeur:                      '',
  nbr_adresses_mail:              0,
  cout_mensuel:                   0,
  date_renouvellement_prestation: '',
  plugins:                        [],
}
