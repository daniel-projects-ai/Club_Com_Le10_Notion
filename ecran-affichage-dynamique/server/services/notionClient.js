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

// Trouver la 1ère propriété correspondant à un des noms (insensible à la casse/accents)
function findProp(properties, candidates) {
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const keys = Object.keys(properties)
  for (const cand of candidates) {
    const match = keys.find(k => norm(k).includes(norm(cand)))
    if (match) return properties[match]
  }
  return null
}

// Récupérer les opportunités
export async function getOpportunities() {
  try {
    const response = await queryDatabase(DATABASES.opportunities)

    return response.results.map(page => {
      const p = page.properties
      return {
        id: page.id,
        name: extractText(findProp(p, ['nom de l', 'nom', 'titre', 'opportunit'])) || 'Sans titre',
        client: extractText(findProp(p, ['acheteur', 'client'])) || 'Non spécifié',
        deadline: extractText(findProp(p, ['date limite', 'deadline', 'date de detection', 'date'])) || 'N/A',
        budget: (() => {
          const b = extractText(findProp(p, ['budget']))
          if (!b) return 'À définir'
          return b.includes('€') ? b : `${b}€`
        })(),
        status: extractText(findProp(p, ['statut', 'status', 'etat'])) || 'Ouvert',
        source: extractText(findProp(p, ['source'])) || '',
        link: extractText(findProp(p, ['lien', 'annonce', 'url'])) || '',
        type: extractText(findProp(p, ['mode de reponse', 'mode', 'type'])) || 'Standard',
        icon: '🎯'
      }
    })
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

// Obtenir les stats
export async function getStats() {
  try {
    const opportunities = await getOpportunities()
    const totalBudget = opportunities.reduce((sum, opp) => {
      const num = parseInt(opp.budget) || 0
      return sum + num
    }, 0)

    return {
      portfolio: `${totalBudget.toLocaleString('fr-FR')}€`,
      successRate: '68%',
      activeOpportunities: opportunities.length,
      freelancesEngaged: 8,
      monthlyTarget: 300000
    }
  } catch (err) {
    console.error('❌ Erreur calcul stats:', err.message)
    return null
  }
}

export default { getOpportunities, getDossiers, getStats }
