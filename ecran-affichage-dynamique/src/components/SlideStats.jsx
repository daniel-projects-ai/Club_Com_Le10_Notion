export default function SlideStats({ data }) {
  const opps = data.opportunities || []

  // Indicateurs calculés sur les vraies opportunités Notion
  const avecBudget = opps.filter(o => typeof o.budget === 'number')
  const totalBudget = avecBudget.reduce((s, o) => s + o.budget, 0)
  const clients = new Set(opps.map(o => o.client).filter(Boolean)).size
  const territoires = new Set(opps.map(o => o.territoire).filter(Boolean)).size

  // Prochaine échéance à venir
  const aujourdhui = new Date().setHours(0, 0, 0, 0)
  const prochaine = opps
    .map(o => o.deadline)
    .filter(Boolean)
    .map(d => new Date(d))
    .filter(d => !Number.isNaN(d.getTime()) && d.getTime() >= aujourdhui)
    .sort((a, b) => a - b)[0]

  const euros = (n) => `${n.toLocaleString('fr-FR')} €`
  // "—" est plus honnête que "0 €" quand la donnée n'est pas renseignée dans Notion
  const RIEN = '—'

  const stats = [
    {
      label: 'Opportunités actives',
      value: opps.length,
      accent: '#efad29',
    },
    {
      label: 'Clients / structures',
      value: clients || RIEN,
      accent: '#0e424b',
    },
    {
      label: 'Portefeuille total',
      value: avecBudget.length ? euros(totalBudget) : RIEN,
      note: avecBudget.length ? `sur ${avecBudget.length} opportunité${avecBudget.length > 1 ? 's' : ''} chiffrée${avecBudget.length > 1 ? 's' : ''}` : 'budgets non renseignés',
      accent: '#6b7a2f',
    },
    {
      label: 'Prochaine échéance',
      value: prochaine
        ? prochaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        : RIEN,
      note: prochaine ? null : 'aucune date renseignée',
      accent: '#b5432a',
    },
  ]

  return (
    <div className="w-full h-full flex flex-col px-16 pt-16 pb-24 overflow-hidden">
      {/* En-tête */}
      <div className="shrink-0 text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="h-px w-16 bg-gold/60" />
          <p className="text-gold text-base font-medium tracking-[0.32em] uppercase">
            Indicateurs clés
          </p>
          <span className="h-px w-16 bg-gold/60" />
        </div>
        <h2 className="font-serif text-6xl font-semibold text-cream">Tableau de bord</h2>
      </div>

      {/* Grille — remplit l'espace restant */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-petrol-light rounded-3xl px-10 py-8 shadow-2xl shadow-black/30 border-t-4 flex flex-col justify-center"
            style={{ borderTopColor: stat.accent }}
          >
            <p className="text-lg text-cream/70 font-medium tracking-wide mb-3">{stat.label}</p>
            <p className="font-serif text-7xl font-semibold text-cream tabular-nums leading-none">
              {stat.value}
            </p>
            {stat.note && (
              <p className="text-sm text-cream/45 mt-3">{stat.note}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 text-center text-cream/45 text-base tracking-wide mt-8">
        Données synchronisées en temps réel avec Notion
      </div>
    </div>
  )
}
