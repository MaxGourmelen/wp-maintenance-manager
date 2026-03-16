import SettingsClient from '@/components/settings/SettingsClient'

export default function SettingsPage() {
  // Les valeurs proviennent des variables d'environnement (côté serveur)
  // On expose uniquement ce qui est nécessaire au client (jamais les secrets)
  const config = {
    fromEmail:    process.env.RESEND_FROM_EMAIL   ?? '',
    appUrl:       process.env.NEXT_PUBLIC_APP_URL  ?? '',
    supabaseUrl:  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    cronSchedule: '0 8 * * *',
    alertDays:    15,
  }

  return <SettingsClient config={config} />
}
