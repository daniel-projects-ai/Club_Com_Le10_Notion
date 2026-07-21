import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import BarreActions from '../components/BarreActions'

export default function Directory() {
  const { donnees, chargement, erreur } = useRequete(api.annuaire)

  if (chargement) return <p className="p-10 text-sm text-neutral-500">Chargement…</p>
  if (erreur) return <p className="p-10 text-sm text-macao-terra">Impossible de charger la communauté : {erreur}</p>

  const membres = donnees || []

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <BarreActions titre="Communauté" sousTitre="Les coworkers du Club Com' Le 10" />

      {membres.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucun membre à afficher pour le moment.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {membres.map((membre) => (
            <article key={membre.id} className="rounded-xl bg-white p-6 shadow-sm">
              {membre.photo ? (
                <img
                  src={membre.photo}
                  alt={membre.nom}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-soft font-serif text-xl text-macao-ink">
                  {(membre.nom || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="mt-4 font-serif text-lg text-macao-ink">{membre.nom}</h2>
              {membre.disponibilite && (
                <div className="mt-1 text-2xs font-semibold uppercase tracking-[0.18em] text-macao-teal">
                  {membre.disponibilite}
                </div>
              )}
              {(membre.metiers || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {membre.metiers.map((metier) => (
                    <span key={metier} className="rounded-full bg-cream-soft px-3 py-1 text-2xs font-medium text-macao-ink">
                      {metier}
                    </span>
                  ))}
                </div>
              )}
              {membre.bio && <p className="mt-4 text-sm leading-relaxed text-neutral-600">{membre.bio}</p>}
              {membre.portfolio && (
                <a
                  href={membre.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-medium text-macao-terra hover:underline"
                >
                  Voir le portfolio
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
