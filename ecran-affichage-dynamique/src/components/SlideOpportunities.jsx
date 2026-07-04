export default function SlideOpportunities({ data }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Titre */}
      <div className="mb-12 text-center">
        <h2 className="text-6xl font-bold text-white mb-2">📌 OPPORTUNITÉS</h2>
        <p className="text-2xl text-blue-300">Nouveaux appels d'offres disponibles</p>
      </div>

      {/* Grille d'opportunités */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-6xl">
        {data.opportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-8 border-2 border-blue-400 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-400/20 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Icône + Statut */}
            <div className="flex items-start justify-between mb-4">
              <span className="text-5xl">{opp.icon}</span>
              <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                {opp.status}
              </span>
            </div>

            {/* Titre */}
            <h3 className="text-2xl font-bold text-white mb-3 leading-tight">
              {opp.name}
            </h3>

            {/* Détails */}
            <div className="space-y-3 mb-6 flex-grow">
              <p className="text-lg text-slate-300">
                <span className="font-semibold text-blue-300">Client:</span> {opp.client}
              </p>
              <p className="text-lg text-slate-300">
                <span className="font-semibold text-blue-300">Budget:</span>{' '}
                <span className="text-2xl font-bold text-green-400">{opp.budget}</span>
              </p>
              <p className="text-lg text-slate-300">
                <span className="font-semibold text-blue-300">Deadline:</span> {opp.deadline}
              </p>
              <p className="text-sm text-slate-400 italic">
                Mode: {opp.type}
              </p>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-slate-600">
              <p className="text-blue-300 font-bold text-sm">
                ➜ Voir sur le portail AWsolutions
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-slate-400 text-lg">
        Mise à jour automatique toutes les 30 minutes
      </div>
    </div>
  )
}
