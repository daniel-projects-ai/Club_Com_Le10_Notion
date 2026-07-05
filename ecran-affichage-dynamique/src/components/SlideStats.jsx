export default function SlideStats({ data }) {
  const opps = data.opportunities || []

  // Calculer les indicateurs à partir des vraies opportunités Notion
  const parseBudget = (b) => parseInt(String(b).replace(/[^0-9]/g, ''), 10) || 0
  const totalBudget = opps.reduce((sum, o) => sum + parseBudget(o.budget), 0)
  const withBudget = opps.filter(o => parseBudget(o.budget) > 0)
  const avgBudget = withBudget.length ? Math.round(totalBudget / withBudget.length) : 0
  const distinctClients = new Set(
    opps.map(o => o.client).filter(c => c && c !== 'Non spécifié')
  ).size

  const fmt = (n) => `${n.toLocaleString('fr-FR')} €`

  const stats = [
    { label: 'Opportunités actives', value: opps.length, accent: '#efad29' },
    { label: 'Portefeuille total', value: fmt(totalBudget), accent: '#6b7a2f' },
    { label: 'Budget moyen', value: fmt(avgBudget), accent: '#b5432a' },
    { label: 'Clients / structures', value: distinctClients, accent: '#0e424b' }
  ]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-20">
      {/* En-tête */}
      <div className="mb-14 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="h-px w-16 bg-gold/60" />
          <p className="text-gold text-lg font-medium tracking-[0.32em] uppercase">
            Indicateurs clés
          </p>
          <span className="h-px w-16 bg-gold/60" />
        </div>
        <h2 className="font-serif text-7xl font-semibold text-cream">Tableau de bord</h2>
      </div>

      {/* Grille de stats */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-petrol-light rounded-3xl p-10 shadow-2xl shadow-black/30 border-t-4"
            style={{ borderTopColor: stat.accent }}
          >
            <p className="text-lg text-cream/70 font-medium mb-4 tracking-wide">{stat.label}</p>
            <p className="font-serif text-6xl font-semibold text-cream tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-14 text-center text-cream/45 text-base tracking-wide">
        Données synchronisées en temps réel avec Notion
      </div>
    </div>
  )
}
