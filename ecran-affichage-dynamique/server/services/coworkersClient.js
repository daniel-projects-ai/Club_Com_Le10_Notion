const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
const TABLE_COWORKERS = 'tbl89xazn0oY4A18o'

async function airtableGet(tableId, params = {}) {
  const url = new URL(`https://api.airtable.com/v0/${BASE}/${tableId}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)
  return data
}

function mapCoworker(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom affiché'] || f['Nom complet'] || 'Sans nom',
    email: (f['Email'] || '').toLowerCase(),
    role: f['Rôle'] || null,
    statut: f['Statut'] || null,
    bio: f['Bio'] || null,
    portfolio: f['Portfolio / site'] || null,
    disponibilite: f['Disponibilité'] || null,
    metiers: f['Métiers déclarés'] || [],
    photo: (f['Photo'] || [])[0]?.url || null
  }
}

// Recherche par email. Renvoie null si absent ou inactif : dans les deux cas
// la réponse HTTP sera identique, pour ne pas révéler l'existence d'un compte.
export async function findCoworkerByEmail(email) {
  const propre = String(email || '').trim().toLowerCase()
  if (!propre) return null

  const data = await airtableGet(TABLE_COWORKERS, {
    filterByFormula: `LOWER({Email}) = "${propre.replace(/"/g, '')}"`,
    maxRecords: 1
  })
  const rec = (data.records || [])[0]
  if (!rec) return null

  const cw = mapCoworker(rec)
  if (cw.statut === 'Inactif') return null
  if (!cw.role) return null
  return cw
}

export async function listActiveCoworkers() {
  const data = await airtableGet(TABLE_COWORKERS, {
    filterByFormula: `{Statut} = "Actif"`,
    pageSize: 100
  })
  return (data.records || []).map(mapCoworker)
}

export async function getCoworkerById(id) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE_COWORKERS}/${id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
  if (!res.ok) return null
  return mapCoworker(await res.json())
}
