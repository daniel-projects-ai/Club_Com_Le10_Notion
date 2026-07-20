import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { ouTiret } from '../lib/format'

export default function Organisations() {
  const { donnees, chargement, erreur } = useRequete(api.organisations)

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (erreur) {
    return (
      <div className="p-10 text-macao-terra">
        Impossible de charger les organisations : {erreur}
      </div>
    )
  }

  // useRequete déballe déjà l'enveloppe { data } de l'API : `donnees` est le tableau.
  const organisations = Array.isArray(donnees) ? donnees : []

  return (
    <div className="p-10 max-w-6xl">
      <h1 className="font-serif text-3xl text-macao-ink mb-1">Organisations</h1>
      <p className="text-macao-ink/60 mb-8">
        {organisations.length} organisation{organisations.length > 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {organisations.map(o => (
          <Link
            key={o.id}
            to={`/organisations/${o.id}`}
            // Sans aria-label, le lien englobant ferait lire tout le contenu de la
            // carte comme nom accessible : illisible en navigation par liens.
            aria-label={`Organisation ${o.nom}`}
            className="block bg-white rounded-xl p-6 border-l-4 border-macao-teal hover:shadow-md transition-shadow"
          >
            <h2 className="font-serif text-xl text-macao-ink mb-2">{o.nom}</h2>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <span><span className="text-macao-ink/50">Nature </span><b>{ouTiret(o.nature)}</b></span>
              <span><span className="text-macao-ink/50">Type </span><b>{ouTiret(o.type)}</b></span>
              <span><span className="text-macao-ink/50">Territoire </span><b>{ouTiret(o.territoire)}</b></span>
              <span><span className="text-macao-ink/50">Relation </span><b>{ouTiret(o.niveauRelation)}</b></span>
              <span>
                <span className="text-macao-ink/50">Opportunités </span>
                <b>{ouTiret(o.historique?.nbOpportunites)}</b>
              </span>
            </div>
          </Link>
        ))}

        {!organisations.length && (
          <p className="text-macao-ink/50">Aucune organisation enregistrée.</p>
        )}
      </div>
    </div>
  )
}
