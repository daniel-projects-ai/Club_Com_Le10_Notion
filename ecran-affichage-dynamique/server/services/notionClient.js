import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY || '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'
})

const DATABASES = {
  opportunities: process.env.NOTION_DB_OPPORTUNITIES || '380eb37e55598044b885dde5eb3ca5a7',
  dossiers: process.env.NOTION_DB_DOSSIERS || '380eb37e555980d486a3ed5c3fe5b950'
}

// Helpers robustes pour extraire une propriété quel que soit son type
function extractText(prop) {
  if (!prop) return null
  if (prop.title?.length) return prop.title.map(t => t.plain_text).join('')
  if (prop.rich_text?.length) return prop.rich_text.map(t => t.plain_text).join('')
  if (prop.select?.name) return prop.select.name
  if (prop.multi_select?.length) return prop.multi_select.map(s => s.name).join(', ')
  if (prop.date?.start) return prop.date.start
  if (typeof prop.number === 'number') return String(prop.number)
  if (prop.url) return prop.url
  if (prop.formula?.string) return prop.formula.string
  if (prop.formula?.number != null) return String(prop.formula.number)
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
    const response = await notion.databases.query({
      database_id: DATABASES.opportunities
    })

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
    const response = await notion.databases.query({
      database_id: DATABASES.dossiers,
      filter: {
        property: 'Statut',
        select: {
          equals: 'En préparation'
        }
      }
    })

    return response.results.map(page => ({
      id: page.id,
      name: page.properties['Nom du dossier']?.title?.[0]?.plain_text || 'Sans titre',
      opportunity: page.properties['Opportunité liée']?.relation?.[0]?.id || null,
      status: page.properties['Statut']?.select?.name || 'Inconnu'
    }))
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
