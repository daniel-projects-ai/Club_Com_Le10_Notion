// Client Airtable pour la table « Dossiers de réponse » : le chantier de
// production d'une réponse à un appel d'offres (pièces, mémoire, offre, dépôt).
// Les règles métier pures vivent dans dossiers.js ; ici, uniquement l'I/O.

const TOKEN = process.env.AIRTABLE_TOKEN
const BASE = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
const TABLE_DOSSIERS = process.env.AIRTABLE_TABLE_DOSSIERS || 'tblp59OuT0dDNFuc1'

async function airtableRequest(chemin, options = {}) {
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

function mapDossier(r) {
  const f = r.fields || {}
  return {
    id: r.id,
    nom: f['Nom du dossier'] || 'Sans titre',
    statut: f['Statut dossier'] || null,
    responsable: f['Responsable'] || null,
    modeReponse: f['Mode de réponse'] || null,
    niveauRisque: f['Niveau de risque'] || null,
    piecesDemandees: f['Pièces demandées'] || [],
    piecesFournies: f['Pièces fournies'] || [],
    memoire: f['Mémoire technique'] || 'Non commencé',
    offre: f['Offre financière'] || 'Non commencée',
    montantPropose: typeof f['Montant proposé'] === 'number' ? f['Montant proposé'] : null,
    dateLimite: f['Date limite'] || null,
    depot: f['Dépôt'] || 'Non préparé',
    dateDepot: f['Date de dépôt'] || null,
    drive: f['Dossier Drive'] || null,
    checklist: f['Check-list finale'] || null,
    questions: f['Questions à poser'] || null,
    reponsesRecues: f['Réponses reçues'] || null,
    retoursAcheteur: f['Retours acheteur'] || null,
    elementsAReutiliser: f['Éléments à réutiliser'] || null,
    referencesUtilisees: f['Références utilisées'] || null,
    notesInternes: f['Notes internes'] || null,
    resultat: f['Résultat'] || null,
    opportuniteIds: f['Opportunité liée'] || [],
    equipeIds: f['Équipe mobilisée'] || []
  }
}

export async function listDossiers() {
  let records = []
  let offset
  do {
    const params = new URLSearchParams({ pageSize: '100' })
    if (offset) params.append('offset', offset)
    const data = await airtableRequest(`${TABLE_DOSSIERS}?${params}`)
    records = records.concat(data.records || [])
    offset = data.offset
  } while (offset)
  return records.map(mapDossier)
}

export async function getDossier(id) {
  return mapDossier(await airtableRequest(`${TABLE_DOSSIERS}/${id}`))
}

// Écriture par NOM de champ : la table vient d'être créée, ses identifiants de
// colonnes ne sont pas figés dans le code comme ailleurs. Choix assumé.
export async function creerDossier(champs) {
  const data = await airtableRequest(TABLE_DOSSIERS, {
    method: 'POST',
    body: JSON.stringify({ fields: champs, typecast: true })
  })
  return mapDossier(data)
}

export async function majDossier(id, champs) {
  const data = await airtableRequest(`${TABLE_DOSSIERS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: champs, typecast: true })
  })
  return mapDossier(data)
}

export default { listDossiers, getDossier, creerDossier, majDossier }
