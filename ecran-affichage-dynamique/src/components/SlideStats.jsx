export default function SlideStats({ data }) {
  const stats = [
    { label: 'Portefeuille total', value: data.stats.portfolio, icon: '💰', color: 'from-green-600 to-emerald-600' },
    { label: 'Taux de réussite', value: data.stats.successRate, icon: '🎯', color: 'from-blue-600 to-cyan-600' },
    { label: 'Opportunités actives', value: data.stats.activeOpportunities, icon: '📈', color: 'from-purple-600 to-pink-600' },
    { label: 'Freelances mobilisés', value: data.stats.freelancesEngaged, icon: '👥', color: 'from-orange-600 to-red-600' }
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

      {/* Statistiques supplémentaires */}
      <div className="mt-12 w-full max-w-5xl bg-slate-700/50 rounded-2xl p-8 border border-slate-600">
        <h3 className="text-2xl font-bold text-white mb-6">📈 Tendances du mois</h3>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-400">+8</p>
            <p className="text-slate-300 text-lg">Opportunités reçues</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">+5</p>
            <p className="text-slate-300 text-lg">Réponses émises</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-400">+2</p>
            <p className="text-slate-300 text-lg">Marchés gagnés</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-slate-400 text-lg">
        Données synchronisées en temps réel avec Notion
      </div>
    </div>
  )
}
