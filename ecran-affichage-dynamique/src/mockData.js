// Données de secours si l'API Notion est injoignable.
// Même format que l'API : budget = nombre, deadline = date ISO.
export const mockData = {
  opportunities: [
    {
      id: 'mock-1',
      name: 'Campagne de communication jeunesse',
      client: 'Ville de Montauban',
      objet: 'Conception et déploiement d\'une campagne de communication à destination des 15-25 ans.',
      deadline: '2026-06-28',
      budget: 22000,
      status: 'À analyser',
      territoire: 'Occitanie',
      type: 'Appel d\'offres',
      icon: '🎯'
    },
    {
      id: 'mock-2',
      name: 'Installation signalétique et kit de communication',
      client: 'Communauté d\'agglomération du Val d\'Oise',
      objet: 'Conception et pose de la signalétique intérieure et extérieure, avec kit de communication associé.',
      deadline: '2026-07-01',
      budget: 48000,
      status: 'GO',
      territoire: 'National',
      type: 'Marché public',
      icon: '🎯'
    },
    {
      id: 'mock-3',
      name: 'Création site pour association culturelle',
      client: 'Association Les Scènes Nomades',
      objet: 'Création d\'un site vitrine responsive avec billetterie et agenda des spectacles.',
      deadline: '2026-06-25',
      budget: 12000,
      status: 'Transmis au Club',
      territoire: 'Agen',
      type: 'Demande de devis',
      icon: '🎯'
    }
  ],
  clubComInfo: {
    description: 'REJOIGNEZ LE CLUB COM\' LE 10',
    members: '10+ professionnels',
    focus: 'Compétences complémentaires',
    benefits: 'Opportunités régulières',
    contact: 'contact@agence-macao.com'
  }
}
