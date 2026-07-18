// Client Airtable — source unique des opportunités affichées sur l'Écran TV.
// Remplace l'ancien notionClient : la plateforme coworkers vit désormais sur Airtable.
// Utilise le fetch natif de Node (pas de SDK).

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appdJ309q39i4Gr8t'
const TABLE_OPPORTUNITES = process.env.AIRTABLE_TABLE_OPPORTUNITES || 'tbl3jvmo4VjUDTkmD'

// Statuts qu'on n'affiche jamais sur l'écran public
const STATUTS_EXCLUS = ['Perdu', 'Archivé', 'NO GO']

async function airtableFetch(tableId, params = {}, retries = 2) {
  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))

  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.error?.type || `HTTP ${res.status}`)
      }
      return data
    } catch (err) {
      lastErr = err
      if (attempt < retries) await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
  }
  throw lastErr
}

// Récupère toutes les lignes d'une table (gère la pagination Airtable)
async function fetchAllRecords(tableId) {
  let records = []
  let offset

  do {
    const params = { pageSize: 100 }
    if (offset) params.offset = offset
    const data = await airtableFetch(tableId, params)
    records = records.concat(data.records || [])
    offset = data.offset
  } while (offset)

  return records
}

function mapOpportunite(record) {
  const f = record.fields || {}
  return {
    id: record.id,
    name: f['Nom'] || 'Sans titre',
    client: f['Acheteur / client'] || null,
    // Le résumé IA est plus lisible sur un écran que l'objet brut ; on retombe sur l'objet sinon.
    objet: f['Résumé IA'] || f['Objet'] || null,
    deadline: f['Date limite'] || null, // ISO ou null
    budget: typeof f['Budget estimé'] === 'number' ? f['Budget estimé'] : null,
    status: f['Statut'] || null,
    territoire: f['Territoire'] || null,
    score: typeof f['Score pertinence'] === 'number' ? f['Score pertinence'] : null,
    link: f['Lien annonce'] || null,
    visible: f['Visible sur écran'] === true,
    icon: '🎯'
  }
}

// Une opportunité s'affiche si elle est cochée « Visible sur écran »,
// qu'elle a un acheteur identifié, et que son statut n'est pas exclu.
function estAffichable(o) {
  if (!o.visible) return false
  if (!o.client) return false
  if (STATUTS_EXCLUS.includes(o.status)) return false
  return true
}

// Toutes les opportunités, sans le filtre d'affichage : c'est ce dont le
// pilotage a besoin (une opportunité « À analyser » n'est pas encore cochée
// « Visible sur écran », elle doit pourtant remonter au tableau de bord).
export async function getAllOpportunities() {
  try {
    if (!AIRTABLE_TOKEN) {
      console.error('❌ AIRTABLE_TOKEN manquant — impossible de lire Airtable')
      return []
    }

    const records = await fetchAllRecords(TABLE_OPPORTUNITES)
    return records.map(mapOpportunite)
  } catch (err) {
    console.error('❌ Erreur Airtable (Opportunités):', err.message)
    return []
  }
}

// Vue publique (Écran TV) : uniquement les opportunités affichables.
export async function getOpportunities() {
  const toutes = await getAllOpportunities()
  const affichables = toutes.filter(estAffichable)

  console.log(`📊 Airtable : ${toutes.length} opportunités → ${affichables.length} affichables`)
  return affichables
}

// Stats calculées sur les opportunités affichables
export async function getStats() {
  try {
    const opportunities = await getOpportunities()
    const avecBudget = opportunities.filter(o => typeof o.budget === 'number')
    const totalBudget = avecBudget.reduce((sum, o) => sum + o.budget, 0)

    return {
      activeOpportunities: opportunities.length,
      totalBudget,
      averageBudget: avecBudget.length ? Math.round(totalBudget / avecBudget.length) : 0,
      distinctClients: new Set(opportunities.map(o => o.client).filter(Boolean)).size
    }
  } catch (err) {
    console.error('❌ Erreur calcul stats:', err.message)
    return null
  }
}

export default { getOpportunities, getAllOpportunities, getStats }
