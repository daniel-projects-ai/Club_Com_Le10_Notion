import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import StatutPastille from '../components/StatutPastille'
import { formaterBudget, formaterDate, ouTiret } from '../lib/format'

function Champ({ label, valeur }) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{label}</div>
      <div className="mt-0.5 text-sm text-macao-ink">{valeur}</div>
    </div>
  )
}

export default function Opportunities() {
  const { donnees, chargement, erreur } = useRequete(api.opportunites)

  if (chargement) return <p className="p-10 text-sm text-neutral-500">Chargement…</p>
  if (erreur) return <p className="p-10 text-sm text-macao-terra">Impossible de charger les opportunités : {erreur}</p>

  const opportunites = donnees || []

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-macao-ink">Opportunités</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {opportunites.length} opportunité{opportunites.length > 1 ? 's' : ''} visible{opportunites.length > 1 ? 's' : ''}
        </p>
      </header>

      {opportunites.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucune opportunité à afficher pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {opportunites.map((opp) => (
            <article key={opp.id} className="rounded-xl border-l-4 border-macao-terra bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-serif text-xl text-macao-ink">{opp.name}</h2>
                <StatutPastille statut={opp.status} />
              </div>
              <div className="mt-1 text-sm font-medium text-macao-teal">{ouTiret(opp.client)}</div>
              {opp.objet && <p className="mt-3 text-sm leading-relaxed text-neutral-600">{opp.objet}</p>}
              <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-3">
                <Champ label="Budget" valeur={formaterBudget(opp.budget)} />
                <Champ label="Échéance" valeur={formaterDate(opp.deadline)} />
                <Champ label="Territoire" valeur={ouTiret(opp.territoire)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
