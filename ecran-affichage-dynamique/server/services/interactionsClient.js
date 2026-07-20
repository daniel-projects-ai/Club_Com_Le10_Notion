// Client Airtable du journal des échanges : interactions (faits passés) et
// tâches (relances à venir). Les règles métier pures vivent dans
// interactions.js ; ici, uniquement l'I/O.

const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
const TABLE_INTERACTIONS = process.env.AIRTABLE_TABLE_INTERACTIONS || 'tbl5xBf9xHwML8w8G'
const TABLE_TACHES = process.env.AIRTABLE_TABLE_TACHES || 'tbla7KkVgkEKbaZYv'
const TABLE_ORGANISATIONS = process.env.AIRTABLE_TABLE_ORGANISATIONS || 'tblMONv5vnC3Bn0ii'

async function airtableRequest(chemin, options = {}) {
  // Sans token, l'appel échouerait en 401 avec un message Airtable opaque :
  // on préfère une erreur explicite, que l'appelant isole (cf. tableau de bord).
  if (!TOKEN) throw new Error('AIRTABLE_TOKEN manquant — impossible de lire le journal')

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

function mapInteraction(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    reference: f['Référence'] || 'Échange',
    canal: f['Canal'] || null,
    sens: f['Sens'] || null,
    date: f['Date'] || null,
    compteRendu: f['Compte rendu'] || null,
    auteur: f['Auteur'] || null,
    // Case à cocher : Airtable omet le champ quand elle est décochée.
    assisteeIA: f['Assistée par IA'] === true,
    organisationIds: f['Organisation'] || [],
    interlocuteurIds: f['Interlocuteur'] || [],
    opportuniteIds: f['Opportunité'] || []
  }
}

function mapTache(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    intitule: f['Intitulé'] || 'Sans titre',
    echeance: f['Échéance'] || null,
    responsable: f['Responsable'] || null,
    statut: f['Statut'] || 'À faire',
    notes: f['Notes'] || null,
    organisationIds: f['Organisation'] || [],
    interlocuteurIds: f['Interlocuteur'] || [],
    opportuniteIds: f['Opportunité'] || [],
    interactionIds: f['Interaction d\'origine'] || []
  }
}

export async function listInteractions() {
  return (await listerTout(TABLE_INTERACTIONS)).map(mapInteraction)
}

export async function listTaches() {
  return (await listerTout(TABLE_TACHES)).map(mapTache)
}

// Écriture par NOM de champ, comme les autres clients du projet : ces tables
// viennent d'être créées, leurs identifiants de colonnes ne sont pas figés
// dans le code. Choix assumé.
export async function creerInteraction(champs) {
  const data = await airtableRequest(TABLE_INTERACTIONS, {
    method: 'POST',
    body: JSON.stringify({ fields: champs, typecast: true })
  })
  return mapInteraction(data)
}

export async function creerTache(champs) {
  const data = await airtableRequest(TABLE_TACHES, {
    method: 'POST',
    body: JSON.stringify({ fields: champs, typecast: true })
  })
  return mapTache(data)
}

export async function majTache(id, champs) {
  const data = await airtableRequest(`${TABLE_TACHES}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: champs, typecast: true })
  })
  return mapTache(data)
}

// Avance la date du dernier échange d'une organisation — sans jamais la faire
// reculer. Saisir aujourd'hui un échange d'il y a six mois ne doit pas effacer
// la trace d'un contact plus récent : on lit avant d'écrire, et on s'abstient
// si la valeur en place est déjà postérieure ou identique.
// Renvoie la date effectivement portée par l'organisation.
export async function majDernierEchange(organisationId, dateISO) {
  if (!organisationId || !dateISO) return null

  const actuel = await airtableRequest(`${TABLE_ORGANISATIONS}/${organisationId}`)
  const existante = actuel?.fields?.['Dernier échange'] || null

  // Comparaison de chaînes ISO « AAAA-MM-JJ » : lexicographique = chronologique
  // à format constant, donc pas de Date à construire ni de fuseau à arbitrer.
  // Le cas « aucune date » passe ici : on écrit.
  if (existante && existante >= dateISO) return existante

  const maj = await airtableRequest(`${TABLE_ORGANISATIONS}/${organisationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { 'Dernier échange': dateISO }, typecast: true })
  })
  return maj?.fields?.['Dernier échange'] || dateISO
}

export default {
  listInteractions,
  listTaches,
  creerInteraction,
  creerTache,
  majTache,
  majDernierEchange
}
