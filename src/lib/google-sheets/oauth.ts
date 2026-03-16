import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// ─── Étape 1 : Générer l'URL d'autorisation Google ────────────────────────
export function getGoogleAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    prompt: 'consent',
  })
}

// ─── Étape 2 : Échanger le code contre un token ───────────────────────────
export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  return tokens
}

// ─── Étape 3 : Lire les données brutes du Sheet ───────────────────────────
export async function fetchSheetData(
  spreadsheetId: string,
  accessToken: string
): Promise<{ headers: string[]; rows: string[][] }> {
  oauth2Client.setCredentials({ access_token: accessToken })
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1:Z1000', // large plage, on filtre ensuite les lignes vides
  })

  const values = response.data.values ?? []
  if (values.length === 0) return { headers: [], rows: [] }

  const headers = values[0].map(h => String(h).trim())
  const rows = values.slice(1).filter(row => row.some(cell => cell !== ''))

  return { headers, rows }
}

// ─── Extraire l'ID depuis une URL Google Sheets ───────────────────────────
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}
