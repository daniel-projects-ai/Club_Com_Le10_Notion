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

  const fmt = (n) => `${n.toLocaleString('fr-FR')}€`

  const stats = [
    { label: 'Opportunités actives', value: opps.length, icon: '📈', color: 'from-purple-600 to-pink-600' },
    { label: 'Portefeuille total', value: fmt(totalBudget), icon: '💰', color: 'from-green-600 to-emerald-600' },
    { label: 'Budget moyen', value: fmt(avgBudget), icon: '🎯', color: 'from-blue-600 to-cyan-600' },
    { label: 'Clients / structures', value: distinctClients, icon: '🏛️', color: 'from-orange-600 to-red-600' }
  ]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Titre */}
      <div className="mb-12 text-center">
        <h2 className="text-6xl font-bold text-white mb-2">📊 TABLEAU DE BORD</h2>
        <p className="text-2xl text-blue-300">Indicateurs clés en temps réel</p>
      </div>

      {/* Grille de stats */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${stat.color} rounded-3xl p-10 shadow-2xl hover:scale-105 transition-transform duration-300`}
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-xl text-white/80 font-semibold mb-2">{stat.label}</p>
                <p className="text-5xl font-black text-white">
                  {stat.value}
                </p>
              </div>
              <span className="text-5xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-slate-400 text-lg">
        Données synchronisées en temps réel avec Notion
      </div>
    </div>
  )
}
