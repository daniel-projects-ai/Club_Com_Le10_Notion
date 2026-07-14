import { useState, useEffect } from 'react'

const PAR_PAGE = 4
const DUREE_PAGE = 10000 // 10 s par page

// Couleur de pastille selon le vrai statut Notion
const COULEUR_STATUT = {
  'GO': 'bg-green-500/15 text-green-300 border-green-400/50',
  'Gagné': 'bg-green-500/15 text-green-300 border-green-400/50',
  'En réponse': 'bg-blue-400/15 text-blue-200 border-blue-300/50',
  'Déposé': 'bg-blue-400/15 text-blue-200 border-blue-300/50',
  'Transmis au Club': 'bg-purple-400/15 text-purple-200 border-purple-300/50',
  'GO / NO GO à décider': 'bg-terra/20 text-orange-200 border-terra/60',
}
const STATUT_DEFAUT = 'bg-gold/15 text-gold border-gold/45'

const formatBudget = (n) =>
  typeof n === 'number' ? `${n.toLocaleString('fr-FR')} €` : null

const formatDate = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SlideOpportunities({ data }) {
  const opportunities = data.opportunities || []
  const [page, setPage] = useState(0)

  const nbPages = Math.max(1, Math.ceil(opportunities.length / PAR_PAGE))

  // Faire défiler les pages tant qu'il y en a plusieurs
  useEffect(() => {
    setPage(0)
    if (nbPages <= 1) return
    const t = setInterval(() => setPage((p) => (p + 1) % nbPages), DUREE_PAGE)
    return () => clearInterval(t)
  }, [nbPages])

  const visibles = opportunities.slice(page * PAR_PAGE, page * PAR_PAGE + PAR_PAGE)

  return (
    <div className="w-full h-full flex flex-col px-16 pt-16 pb-24 overflow-hidden">
      {/* En-tête — ne bouge jamais */}
      <div className="shrink-0 text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="h-px w-16 bg-gold/60" />
          <p className="text-gold text-base font-medium tracking-[0.32em] uppercase">
            Appels d'offres en cours
          </p>
          <span className="h-px w-16 bg-gold/60" />
        </div>
        <div className="flex items-baseline justify-center gap-5">
          <h2 className="font-serif text-6xl font-semibold text-cream">Opportunités</h2>
          <span className="font-serif text-4xl font-semibold text-gold tabular-nums">
            {opportunities.length}
          </span>
        </div>
      </div>

      {/* Grille — occupe tout l'espace restant */}
      {opportunities.length > 0 ? (
        <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-6">
          {visibles.map((opp) => (
            <article
              key={opp.id}
              className="bg-petrol-light rounded-2xl p-7 border-l-4 border-gold shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
            >
              {/* Statut + territoire */}
              <div className="shrink-0 flex items-center justify-between mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                    COULEUR_STATUT[opp.status] || STATUT_DEFAUT
                  }`}
                >
                  {opp.status || 'À analyser'}
                </span>
                {opp.territoire && (
                  <span className="text-xs text-cream/50 uppercase tracking-widest">
                    {opp.territoire}
                  </span>
                )}
              </div>

              {/* Nom */}
              <h3 className="shrink-0 font-serif text-2xl font-semibold text-cream leading-snug mb-2">
                {opp.name}
              </h3>

              {/* Client */}
              {opp.client && (
                <p className="shrink-0 text-lg text-gold/90 font-medium mb-3">{opp.client}</p>
              )}

              {/* Objet — remplit l'espace disponible */}
              {opp.objet && (
                <p
                  className="flex-1 min-h-0 text-base text-cream/65 leading-relaxed overflow-hidden"
                  style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                >
                  {opp.objet}
                </p>
              )}

              {/* Budget / échéance */}
              <div className="shrink-0 flex flex-wrap gap-x-8 gap-y-2 mt-4 pt-4 border-t border-cream/10">
                {formatBudget(opp.budget) && (
                  <div>
                    <p className="text-2xs text-cream/50 uppercase tracking-widest">Budget</p>
                    <p className="text-lg text-gold font-semibold tabular-nums">
                      {formatBudget(opp.budget)}
                    </p>
                  </div>
                )}
                {formatDate(opp.deadline) && (
                  <div>
                    <p className="text-2xs text-cream/50 uppercase tracking-widest">Échéance</p>
                    <p className="text-lg text-cream font-semibold tabular-nums">
                      {formatDate(opp.deadline)}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-cream/50 text-2xl">Aucune opportunité à afficher pour le moment</p>
        </div>
      )}

      {/* Pagination */}
      {nbPages > 1 && (
        <div className="shrink-0 flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: nbPages }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === page ? 'w-10 bg-gold' : 'w-4 bg-cream/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
