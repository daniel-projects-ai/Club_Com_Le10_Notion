export default function SlideOpportunities({ data }) {
  const opportunities = data.opportunities || []

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-16 py-20">
      {/* En-tête */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="h-px w-16 bg-gold/60" />
          <p className="text-gold text-lg font-medium tracking-[0.32em] uppercase">
            Appels d'offres en cours
          </p>
          <span className="h-px w-16 bg-gold/60" />
        </div>
        <h2 className="font-serif text-7xl font-semibold text-cream">Opportunités</h2>
      </div>

      {/* Grille d'opportunités */}
      <div className={`grid gap-8 w-full max-w-6xl ${opportunities.length > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-3xl'}`}>
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-petrol-light rounded-2xl p-8 border-l-4 border-gold shadow-2xl shadow-black/30 flex flex-col justify-between"
          >
            {/* Statut */}
            <div className="flex items-start justify-between mb-5">
              <span className="text-4xl">{opp.icon}</span>
              <span className="bg-gold/15 text-gold border border-gold/45 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest">
                ● {opp.status}
              </span>
            </div>

            {/* Titre */}
            <h3 className="font-serif text-3xl font-semibold text-cream mb-6 leading-tight text-balance">
              {opp.name}
            </h3>

            {/* Détails */}
            <div className="flex flex-wrap gap-x-10 gap-y-4 mb-6 flex-grow">
              <div>
                <p className="text-2xs text-cream/55 uppercase tracking-widest mb-1">Client</p>
                <p className="text-xl text-cream font-medium">{opp.client}</p>
              </div>
              {opp.budget && opp.budget !== 'À définir' && (
                <div>
                  <p className="text-2xs text-cream/55 uppercase tracking-widest mb-1">Budget</p>
                  <p className="text-xl text-gold font-semibold tabular-nums">{opp.budget}</p>
                </div>
              )}
              {opp.deadline && opp.deadline !== 'N/A' && (
                <div>
                  <p className="text-2xs text-cream/55 uppercase tracking-widest mb-1">Échéance</p>
                  <p className="text-xl text-cream font-medium tabular-nums">{opp.deadline}</p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-cream/10">
              <p className="text-gold font-bold text-base tracking-wide">
                Voir l'annonce →
              </p>
            </div>
          </div>
        ))}
      </div>

      {opportunities.length === 0 && (
        <p className="text-cream/50 text-2xl">Aucune opportunité à afficher pour le moment</p>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-cream/45 text-base tracking-wide">
        Mise à jour automatique depuis Notion
      </div>
    </div>
  )
}
