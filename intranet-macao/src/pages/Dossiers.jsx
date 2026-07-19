import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { useAuth } from '../context/AuthContext'
import { formaterDate, ouTiret } from '../lib/format'

export default function Dossiers() {
  const { user } = useAuth()
  const { donnees, chargement, erreur } = useRequete(api.dossiers)

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (erreur) return <div className="p-10 text-macao-terra">Impossible de charger les dossiers : {erreur}</div>

  // useRequete déballe déjà l'enveloppe { data } de l'API : `donnees` est le tableau.
  const dossiers = donnees || []
  const estMacao = user?.role === 'Macao'

  return (
    <div className="p-10 max-w-6xl">
      <h1 className="font-serif text-3xl text-macao-ink mb-1">
        {estMacao ? 'Dossiers de réponse' : 'Mes dossiers'}
      </h1>
      <p className="text-macao-ink/60 mb-8">
        {estMacao
          ? `${dossiers.length} dossier${dossiers.length > 1 ? 's' : ''}`
          : 'Les dossiers sur lesquels vous êtes mobilisé'}
      </p>

      <div className="space-y-4">
        {dossiers.map(d => (
          <Link
            key={d.id}
            to={`/dossiers/${d.id}`}
            // Sans aria-label, le lien englobant ferait lire tout le contenu de la
            // carte comme nom accessible : illisible en navigation par liens.
            aria-label={`Dossier ${d.nom}${d.bloque ? ' — à traiter' : ''}`}
            className={`block bg-white rounded-xl p-6 border-l-4 hover:shadow-md transition-shadow ${
              d.bloque ? 'border-macao-terra' : 'border-macao-teal'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="font-serif text-xl text-macao-ink">{d.nom}</h2>
              {d.bloque && (
                <span className="text-xs px-3 py-1 rounded-full bg-macao-terra text-white shrink-0">
                  À traiter
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span><span className="text-macao-ink/50">Statut </span><b>{d.statut || '—'}</b></span>
              <span><span className="text-macao-ink/50">Acheteur </span><b>{ouTiret(d.acheteur)}</b></span>
              <span><span className="text-macao-ink/50">Échéance </span><b>{formaterDate(d.dateLimite)}</b></span>
              <span>
                <span className="text-macao-ink/50">Pièces </span>
                <b className={d.piecesManquantes?.length ? 'text-macao-terra' : ''}>
                  {d.piecesManquantes?.length
                    ? `${d.piecesManquantes.length} manquante${d.piecesManquantes.length > 1 ? 's' : ''}`
                    : 'complètes'}
                </b>
              </span>
              <span><span className="text-macao-ink/50">Mémoire </span><b>{d.memoire || '—'}</b></span>
              <span><span className="text-macao-ink/50">Offre </span><b>{d.offre || '—'}</b></span>
            </div>
          </Link>
        ))}

        {!dossiers.length && (
          <p className="text-macao-ink/50">
            {estMacao
              ? 'Aucun dossier. Créez-en un depuis une opportunité passée en GO.'
              : 'Vous n’êtes mobilisé sur aucun dossier pour le moment.'}
          </p>
        )}
      </div>
    </div>
  )
}
