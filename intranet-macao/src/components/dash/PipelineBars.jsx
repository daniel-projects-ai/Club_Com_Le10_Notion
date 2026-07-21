// Répartition du pipeline par statut.
// Barres horizontales plutôt qu'un camembert : l'œil compare
// bien mieux des longueurs que des angles.
export default function PipelineBars({ parStatut = {} }) {
  const entrees = Object.entries(parStatut)

  if (entrees.length === 0) {
    return <p className="text-sm text-neutral-500">Aucun projet à afficher.</p>
  }

  const maximum = Math.max(...entrees.map(([, nombre]) => nombre), 1)

  return (
    <div className="space-y-3">
      {entrees.map(([statut, nombre]) => (
        <div key={statut} className="flex items-center gap-3 sm:gap-4">
          {/* Le libellé cède de la place à la barre sur petit écran : à 375 px,
              160 px de statut ne laissaient qu'un moignon de barre à comparer. */}
          <div className="w-24 shrink-0 truncate text-sm text-neutral-700 sm:w-40" title={statut}>{statut}</div>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-macao-teal"
              style={{ width: `${(nombre / maximum) * 100}%` }}
            />
          </div>
          <div className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-macao-ink">
            {nombre}
          </div>
        </div>
      ))}
    </div>
  )
}
