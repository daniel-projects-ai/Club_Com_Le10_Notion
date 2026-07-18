// Bandeau de chiffres clés.
// Règle : une valeur absente s'affiche « — » et jamais « 0 »,
// car un zéro faux induirait en erreur sur le pilotage.
const BORDURES = {
  terra: 'border-t-macao-terra',
  gold: 'border-t-macao-gold',
  teal: 'border-t-macao-teal',
  ink: 'border-t-macao-ink'
}

export default function StatBand({ stats = [] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border-t-4 bg-white p-5 shadow-sm ${BORDURES[stat.couleur] || BORDURES.ink}`}
        >
          <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {stat.label}
          </div>
          <div className="mt-2 font-serif text-3xl tabular-nums text-macao-ink">
            {stat.valeur === null || stat.valeur === undefined ? '—' : stat.valeur}
          </div>
          {stat.note && <div className="mt-1 text-xs text-neutral-500">{stat.note}</div>}
        </div>
      ))}
    </div>
  )
}
