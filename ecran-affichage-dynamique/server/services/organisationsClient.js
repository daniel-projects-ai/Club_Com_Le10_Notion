// Client Airtable du CRM : organisations (collectivités, entreprises,
// associations) et leurs interlocuteurs. Les règles métier pures vivent dans
// organisations.js ; ici, uniquement l'I/O.

const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
const TABLE_ORGANISATIONS = process.env.AIRTABLE_TABLE_ORGANISATIONS || 'tblMONv5vnC3Bn0ii'
const TABLE_INTERLOCUTEURS = process.env.AIRTABLE_TABLE_INTERLOCUTEURS || 'tblwmhpkzc3lFVeRI'

async function airtableRequest(chemin, options = {}) {
  // Sans token, l'appel échouerait en 401 avec un message Airtable opaque :
  // on préfère une erreur explicite, que l'appelant isole (cf. tableau de bord).
  if (!TOKEN) throw new Error('AIRTABLE_TOKEN manquant — impossible de lire le CRM')

  const res = await fetch(`https://api.airtable.com/v0/${BASE}/${chemin}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message || data?.error?.type || `HTTP ${res.status}`)
  return data
}

async function listerTout(table) {
  let records = []
  let offset
  do {
    const params = new URLSearchParams({ pageSize: '100' })
    if (offset) params.append('offset', offset)
    const data = await airtableRequest(`${table}?${params}`)
    records = records.concat(data.records || [])
    offset = data.offset
  } while (offset)
  return records
}

function mapOrganisation(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom'] || 'Sans nom',
    nature: f['Nature'] || null,
    type: f['Type'] || null,
    commune: f['Commune'] || null,
    codePostal: f['Code postal'] || null,
    territoire: f['Territoire'] || null,
    siret: f['SIRET'] || null,
    siteWeb: f['Site web'] || null,
    niveauRelation: f['Niveau de relation'] || null,
    origine: f['Origine'] || null,
    referent: f['Référent Macao'] || null,
    dernierEchange: f['Dernier échange'] || null,
    plateforme: f['Plateforme de publication'] || null,
    particularites: f['Particularités administratives'] || null,
    notes: f['Notes'] || null,
    opportuniteIds: f['Opportunités'] || [],
    interlocuteurIds: f['Interlocuteurs'] || []
  }
}

function mapInterlocuteur(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom complet'] || 'Sans nom',
    fonction: f['Fonction'] || null,
    email: f['Email'] || null,
    telephone: f['Téléphone'] || null,
    // Case à cocher : Airtable omet le champ quand elle est décochée.
    opposition: f['Opposition à la prospection'] === true,
    notes: f['Notes'] || null,
    organisationIds: f['Organisation'] || []
  }
}

export async function listOrganisations() {
  return (await listerTout(TABLE_ORGANISATIONS)).map(mapOrganisation)
}

export async function getOrganisation(id) {
  return mapOrganisation(await airtableRequest(`${TABLE_ORGANISATIONS}/${id}`))
}

export async function listInterlocuteurs() {
  return (await listerTout(TABLE_INTERLOCUTEURS)).map(mapInterlocuteur)
}

export default { listOrganisations, getOrganisation, listInterlocuteurs }
