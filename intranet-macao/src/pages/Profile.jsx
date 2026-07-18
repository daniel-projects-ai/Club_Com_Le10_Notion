import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { useAuth } from '../context/AuthContext'
import { ouTiret } from '../lib/format'

function Ligne({ label, valeur }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 px-6 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="w-44 shrink-0 text-2xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </div>
      <div className="text-sm text-macao-ink">{valeur}</div>
    </div>
  )
}

export default function Profile() {
  const { donnees, chargement, erreur } = useRequete(api.profil)
  const { user } = useAuth()

  if (chargement) return <p className="p-10 text-sm text-neutral-500">Chargement…</p>
  if (erreur) return <p className="p-10 text-sm text-macao-terra">Impossible de charger votre profil : {erreur}</p>

  const profil = donnees || {}
  const metiers = (profil.metiers || []).join(', ')

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-macao-ink">Mon profil</h1>
        <p className="mt-1 text-sm text-neutral-500">Vos informations telles qu'elles apparaissent dans l'annuaire</p>
      </header>

      <div className="rounded-xl bg-white shadow-sm">
        <Ligne label="Nom" valeur={ouTiret(profil.nom)} />
        <Ligne label="Email" valeur={ouTiret(profil.email || user?.email)} />
        <Ligne label="Rôle" valeur={ouTiret(profil.role || user?.role)} />
        <Ligne label="Statut" valeur={ouTiret(profil.statut)} />
        <Ligne label="Disponibilité" valeur={ouTiret(profil.disponibilite)} />
        <Ligne label="Métiers" valeur={ouTiret(metiers)} />
        <Ligne
          label="Portfolio"
          valeur={
            profil.portfolio ? (
              <a href={profil.portfolio} target="_blank" rel="noreferrer" className="text-macao-terra hover:underline">
                {profil.portfolio}
              </a>
            ) : (
              '—'
            )
          }
        />
      </div>

      <p className="mt-6 text-sm text-neutral-500">
        Pour modifier ces informations, contactez l'équipe Macao.
      </p>
    </div>
  )
}
