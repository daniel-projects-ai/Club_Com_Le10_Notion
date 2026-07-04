import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY || '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'
})

const DATABASES = {
  opportunities: process.env.NOTION_DB_OPPORTUNITIES || '380eb37e55598044b885dde5eb3ca5a7',
  dossiers: process.env.NOTION_DB_DOSSIERS || '380eb37e555980d486a3ed5c3fe5b950'
}

// Récupérer les opportunités
export async function getOpportunities() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASES.opportunities,
      filter: {
        property: 'Statut',
        select: {
          equals: 'Ouvert'
        }
      }
    })

    return response.results.map(page => ({
      id: page.id,
      name: page.properties['Nom de l\'opportunité']?.title?.[0]?.plain_text || 'Sans titre',
      client: page.properties['Acheteur / client']?.rich_text?.[0]?.plain_text || 'Non spécifié',
      deadline: page.properties['Date limite']?.date?.start || 'N/A',
      budget: page.properties['Budget estimé']?.number ? `${page.properties['Budget estimé'].number}€` : 'À définir',
      status: page.properties['Statut']?.select?.name || 'Inconnu',
      type: page.properties['Mode de réponse recommandé']?.select?.name || 'Standard',
      icon: '🎯'
    }))
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
