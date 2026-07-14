// Client Notion utilisant le fetch natif de Node (pas de SDK)
// Évite les problèmes de compatibilité SDK/Node (ERR_STREAM_PREMATURE_CLOSE)

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_VERSION = '2022-06-28'

// Nettoyer un ID Notion : extraire les 32 caractères hexadécimaux
// (supprime les ?v=..., slugs, tirets, etc. collés depuis une URL)
export function cleanNotionId(raw) {
  if (!raw) return raw
  const withoutQuery = raw.split('?')[0]
  const match = withoutQuery.replace(/-/g, '').match(/[0-9a-fA-F]{32}/g)
  return match ? match[match.length - 1] : withoutQuery
}

const DATABASES = {
  opportunities: cleanNotionId(process.env.NOTION_DB_OPPORTUNITIES || '380eb37e55598044b885dde5eb3ca5a7'),
  dossiers: cleanNotionId(process.env.NOTION_DB_DOSSIERS || '380eb37e555980d486a3ed5c3fe5b950')
}

// Requête directe à l'API Notion via fetch natif, avec retry
export async function queryDatabase(databaseId, body = {}, retries = 2) {
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`)
      }
      return data
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

// Helpers robustes pour extraire une propriété quel que soit son type
function extractText(prop) {
  if (!prop) return null
  if (prop.title?.length) return prop.title.map(t => t.plain_text).join('')
  if (prop.rich_text?.length) return prop.rich_text.map(t => t.plain_text).join('')
  if (prop.select?.name) return prop.select.name
  if (prop.multi_select?.length) return prop.multi_select.map(s => s.name).join(', ')
  if (prop.status?.name) return prop.status.name
  if (prop.date?.start) return prop.date.start
  if (typeof prop.number === 'number') return String(prop.number)
  if (prop.url) return prop.url
  if (prop.formula?.string) return prop.formula.string
  if (prop.formula?.number != null) return String(prop.formula.number)
  if (prop.rollup?.array?.length) return prop.rollup.array.map(extractText).filter(Boolean).join(', ')
  return null
}

// Normalise : minuscules, sans accents, apostrophes courbes -> droites
function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .trim()
}

// Trouver une propriete par nom.
// Correspondance EXACTE d'abord : indispensable car plusieurs colonnes se
// chevauchent ("Statut" vs "Statut du dossier de reponse",
// "Type d'acheteur" vs "Type d'opportunite").
function findProp(properties, candidates) {
  const keys = Object.keys(properties)
  for (const cand of candidates) {
    const exact = keys.find(k => norm(k) === norm(cand))
    if (exact) return properties[exact]
  }
  for (const cand of candidates) {
    const partial = keys.find(k => norm(k).includes(norm(cand)))
    if (partial) return properties[partial]
  }
  return null
}

// Statuts à ne jamais afficher sur l'écran public
const STATUTS_EXCLUS = ['Perdu', 'Archivé', 'NO GO']

// La base contient des lignes d'alerte email brutes ("Alerte France Marchés - ...")
// qui ne sont pas de vraies opportunités : pas d'acheteur, pas d'objet.
// Une vraie opportunité a un acheteur/client renseigné.
function estVraieOpportunite(o) {
  if (/^alerte\b/i.test(o.name)) return false
  if (!o.client) return false
  if (STATUTS_EXCLUS.includes(o.status)) return false
  return true
}

// Récupérer les opportunités (seulement les vraies, exploitables)
export async function getOpportunities() {
  try {
    const response = await queryDatabase(DATABASES.opportunities)

    const toutes = response.results.map(page => {
      const p = page.properties
      const budgetBrut = findProp(p, ['budget estime', 'budget'])
      const budget = typeof budgetBrut?.number === 'number' ? budgetBrut.number : null

      return {
        id: page.id,
        name: extractText(findProp(p, ["nom de l'opportunite", 'nom de l', 'nom'])) || 'Sans titre',
        client: extractText(findProp(p, ['acheteur / client', 'acheteur', 'client'])) || null,
        objet: extractText(findProp(p, ['objet'])) || null,
        deadline: findProp(p, ['date limite'])?.date?.start || null, // ISO ou null
        budget, // nombre ou null — le formatage se fait côté affichage
        status: extractText(findProp(p, ['statut'])) || null, // vrai statut Notion, pas de valeur inventée
        territoire: extractText(findProp(p, ['territoire'])) || null,
        source: extractText(findProp(p, ['source'])) || null,
        link: findProp(p, ['lien annonce'])?.url || null,
        type: extractText(findProp(p, ["type d'opportunite"])) || null,
        icon: '🎯'
      }
    })

    const vraies = toutes.filter(estVraieOpportunite)
    console.log(`📊 Notion : ${toutes.length} lignes → ${vraies.length} vraies opportunités`)
    return vraies
  } catch (err) {
    console.error('❌ Erreur Notion (Opportunités):', err.message)
    return []
  }
}

// Récupérer les dossiers de réponse
export async function getDossiers() {
  try {
    const response = await queryDatabase(DATABASES.dossiers)

    return response.results.map(page => {
      const p = page.properties
      return {
        id: page.id,
        name: extractText(findProp(p, ['nom du dossier', 'nom', 'titre'])) || 'Sans titre',
        status: extractText(findProp(p, ['statut', 'status', 'etat'])) || 'Inconnu'
      }
    })
  } catch (err) {
    console.error('❌ Erreur Notion (Dossiers):', err.message)
    return []
  }
}

// Obtenir les stats (calculées sur les vraies opportunités)
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

export default { getOpportunities, getDossiers, getStats }
