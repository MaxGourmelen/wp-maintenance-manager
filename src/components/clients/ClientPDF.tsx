import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'
import { format, differenceInDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Client, Site, Plugin, HistoriqueRenouvellement } from '@/types'

// ─── Types ─────────────────────────────────────────────────────────────────
interface ClientPDFProps {
  client: Client & {
    sites: (Site & {
      plugins: Plugin[]
      historique_renouvellements: HistoriqueRenouvellement[]
    })[]
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return format(parseISO(d), 'd MMM yyyy', { locale: fr })
}
function fmtEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function getDays(d: string) {
  return differenceInDays(parseISO(d), new Date())
}
function urgencyLabel(days: number) {
  if (days < 0)   return { text: 'Expiré',    color: '#A32D2D', bg: '#FCEBEB' }
  if (days <= 15) return { text: `${days}j`,  color: '#854F0B', bg: '#FAEEDA' }
  return             { text: 'OK',            color: '#3B6D11', bg: '#EAF3DE' }
}
function typeLabel(t: string) {
  return ({ prestation: 'Prestation', plugin: 'Plugin', domaine: 'Domaine', hebergement: 'Hébergement' })[t] ?? t
}

// ─── Styles ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#2C2C2A',
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#185FA5',
    marginBottom: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  logoText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2C2C2A', marginLeft: 6 },
  clientName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2C2C2A', marginBottom: 2 },
  clientDomain: { fontSize: 10, color: '#888780', fontFamily: 'Courier' },
  metaBlock: { alignItems: 'flex-end' },
  metaTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2C2C2A', marginBottom: 3 },
  metaText: { fontSize: 9, color: '#888780' },
  // Section
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 8, fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase', letterSpacing: 0.8,
    color: '#888780', marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#F1EFE8',
  },
  // Field row
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5, borderBottomColor: '#F8F7F4',
  },
  fieldKey: { color: '#73726c', fontSize: 9.5 },
  fieldVal: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#2C2C2A', textAlign: 'right' },
  // Plugin row
  pluginRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5, borderBottomColor: '#F8F7F4',
  },
  pluginName: { fontSize: 9.5, color: '#2C2C2A', flex: 1 },
  pluginRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pluginDate: { fontSize: 9, color: '#73726c', marginRight: 6 },
  pluginCost: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: '#2C2C2A', width: 36, textAlign: 'right' },
  badge: {
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 10, marginRight: 6,
  },
  badgeText: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Historique row
  histRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5, borderBottomColor: '#F8F7F4',
  },
  histDate:  { fontSize: 9, color: '#73726c', width: 80 },
  histLabel: { fontSize: 9, color: '#2C2C2A', flex: 1 },
  histType:  { fontSize: 9, color: '#888780', width: 60, textAlign: 'center' },
  histAmt:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#2C2C2A', width: 40, textAlign: 'right' },
  // Footer
  footer: {
    position: 'absolute', bottom: 24, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 0.5, borderTopColor: '#F1EFE8',
  },
  footerText: { fontSize: 8, color: '#9c9a92' },
})

// ─── Composant Document PDF ────────────────────────────────────────────────
export default function ClientPDF({ client }: ClientPDFProps) {
  const site = client.sites[0]
  const plugins = site?.plugins ?? []
  const historique = [...(site?.historique_renouvellements ?? [])]
    .sort((a, b) => b.date_renouvellement.localeCompare(a.date_renouvellement))
    .slice(0, 10) // max 10 entrées dans le PDF

  const today = format(new Date(), 'd MMMM yyyy', { locale: fr })

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View>
            <View style={S.logoRow}>
              <Text style={S.logoText}>WP Maintenance Manager</Text>
            </View>
            <Text style={S.clientName}>{client.nom_projet}</Text>
            {site && <Text style={S.clientDomain}>{site.nom_domaine}</Text>}
          </View>
          <View style={S.metaBlock}>
            <Text style={S.metaTitle}>Fiche client</Text>
            <Text style={S.metaText}>Généré le {today}</Text>
          </View>
        </View>

        {/* ── Hébergement & site ── */}
        {site && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>Hébergement & site</Text>
            <View style={S.fieldRow}><Text style={S.fieldKey}>Hébergeur</Text><Text style={S.fieldVal}>{site.hebergeur || '—'}</Text></View>
            <View style={S.fieldRow}><Text style={S.fieldKey}>Adresses mail</Text><Text style={S.fieldVal}>{site.nbr_adresses_mail} adresse{site.nbr_adresses_mail > 1 ? 's' : ''}</Text></View>
            <View style={S.fieldRow}><Text style={S.fieldKey}>Répertoire WP</Text><Text style={S.fieldVal}>{client.repertoire_wp}</Text></View>
            {site.date_renouvellement_prestation && (() => {
              const days = getDays(site.date_renouvellement_prestation)
              const u = urgencyLabel(days)
              return (
                <View style={S.fieldRow}>
                  <Text style={S.fieldKey}>Renouvellement prestation</Text>
                  <Text style={[S.fieldVal, { color: u.color }]}>
                    {fmtDate(site.date_renouvellement_prestation)} — {u.text}
                  </Text>
                </View>
              )
            })()}
            <View style={S.fieldRow}><Text style={S.fieldKey}>Coût mensuel</Text><Text style={S.fieldVal}>{fmtEuro(site.cout_mensuel)}</Text></View>
          </View>
        )}

        {/* ── Contact ── */}
        <View style={S.section}>
          <Text style={S.sectionLabel}>Contact</Text>
          <View style={S.fieldRow}><Text style={S.fieldKey}>Email</Text><Text style={S.fieldVal}>{client.contact_mail}</Text></View>
          {client.contact_tel && (
            <View style={S.fieldRow}><Text style={S.fieldKey}>Téléphone</Text><Text style={S.fieldVal}>{client.contact_tel}</Text></View>
          )}
        </View>

        {/* ── Plugins ── */}
        {plugins.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>Plugins & licences ({plugins.length})</Text>
            {plugins.map(p => {
              const days = getDays(p.date_renouvellement)
              const u = urgencyLabel(days)
              return (
                <View key={p.id} style={S.pluginRow}>
                  <Text style={S.pluginName}>{p.nom}</Text>
                  <View style={S.pluginRight}>
                    <Text style={S.pluginDate}>{fmtDate(p.date_renouvellement)}</Text>
                    <View style={[S.badge, { backgroundColor: u.bg }]}>
                      <Text style={[S.badgeText, { color: u.color }]}>{u.text}</Text>
                    </View>
                    <Text style={S.pluginCost}>{fmtEuro(p.cout)}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* ── Historique ── */}
        {historique.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionLabel}>Historique des renouvellements</Text>
            {historique.map(h => (
              <View key={h.id} style={S.histRow}>
                <Text style={S.histDate}>{fmtDate(h.date_renouvellement)}</Text>
                <Text style={S.histLabel}>{h.notes ?? typeLabel(h.type)}</Text>
                <Text style={S.histType}>{typeLabel(h.type)}</Text>
                <Text style={S.histAmt}>{h.montant ? fmtEuro(h.montant) : '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>WP Maintenance Manager</Text>
          <Text style={S.footerText}>{site?.nom_domaine ?? client.nom_projet} · confidentiel</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
