import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { useAuth } from '../context/AuthContext'
import BarreActions from '../components/BarreActions'
import { formaterDate, ouTiret } from '../lib/format'

export default function Dossiers() {
  const { user } = useAuth()
  const { donnees, chargement, erreur } = useRequete(api.dossiers)

  if (chargement) return <div className="px-4 py-6 sm:px-8 sm:py-10 text-macao-ink/60">Chargement…</div>
  if (erreur) return <div className="px-4 py-6 sm:px-8 sm:py-10 text-macao-terra">Impossible de charger les devis : {erreur}</div>

  // useRequete déballe déjà l'enveloppe { data } de l'API : `donnees` est le tableau.
  const dossiers = donnees || []
  const estMacao = user?.role === 'Macao'

  return (
    <div className="px-4 py-6 sm:p-10 max-w-6xl">
      <BarreActions
        titre={estMacao ? 'Devis' : 'Mes devis'}
        sousTitre={estMacao
          ? `${dossiers.length} devis`
          : 'Les devis sur lesquels vous êtes mobilisé'}
      />

      <div className="space-y-4">
        {dossiers.map(d => (
          <Link
            key={d.id}
            to={`/dossiers/${d.id}`}
            // Sans aria-label, le lien englobant ferait lire tout le contenu de la
            // carte comme nom accessible : illisible en navigation par liens.
            aria-label={`Devis ${d.nom}${d.bloque ? ' — à traiter' : ''}`}
            className={`block bg-white rounded-xl p-4 sm:p-6 border-l-4 hover:shadow-md transition-shadow ${
              d.bloque ? 'border-macao-terra' : 'border-macao-teal'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <h2 className="min-w-0 break-words font-serif text-xl text-macao-ink">{d.nom}</h2>
              {d.bloque && (
                <span className="text-xs px-3 py-1 rounded-full bg-macao-terra text-white shrink-0">
                  À traiter
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm sm:gap-x-8">
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
              ? 'Aucun devis. Créez-en un depuis un projet passé en GO.'
              : 'Vous n’êtes mobilisé sur aucun devis pour le moment.'}
          </p>
        )}
      </div>
    </div>
  )
}
