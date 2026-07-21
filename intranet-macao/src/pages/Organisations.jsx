import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import BarreActions from '../components/BarreActions'
import { ouTiret } from '../lib/format'

// Les deux seules valeurs de `niveauRelation` (champ Airtable, non modifié ici)
// qui désignent une relation commerciale établie. Tout le reste — « Jamais
// contacté », « Contact pris », « En discussion », une valeur ajoutée demain
// dans Airtable, ou l'absence de valeur — relève de la prospection.
// La liste fermée est donc du côté « clients » : une valeur inattendue tombe
// dans les prospects, jamais l'inverse. Afficher par erreur un client comme
// prospect ferait perdre du temps ; démarcher un client comme un inconnu, la face.
const NIVEAUX_CLIENT = ['Déjà client', 'Client récurrent']

function CarteOrganisation({ o }) {
  return (
    <Link
      to={`/organisations/${o.id}`}
      // Sans aria-label, le lien englobant ferait lire tout le contenu de la
      // carte comme nom accessible : illisible en navigation par liens.
      aria-label={`Organisation ${o.nom}`}
      className="block bg-white rounded-xl p-6 border-l-4 border-macao-teal hover:shadow-md transition-shadow"
    >
      <h3 className="font-serif text-xl text-macao-ink mb-2">{o.nom}</h3>

      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <span><span className="text-macao-ink/50">Nature </span><b>{ouTiret(o.nature)}</b></span>
        <span><span className="text-macao-ink/50">Type </span><b>{ouTiret(o.type)}</b></span>
        <span><span className="text-macao-ink/50">Territoire </span><b>{ouTiret(o.territoire)}</b></span>
        <span><span className="text-macao-ink/50">Relation </span><b>{ouTiret(o.niveauRelation)}</b></span>
        <span>
          <span className="text-macao-ink/50">Projets </span>
          <b>{ouTiret(o.historique?.nbOpportunites)}</b>
        </span>
      </div>
    </Link>
  )
}

// Un groupe vide ne s'annonce pas : un titre « Clients (0) » suivi de rien
// n'apprend rien et allonge la page.
function Groupe({ titre, organisations }) {
  if (organisations.length === 0) return null

  return (
    <section className="mb-10 last:mb-0">
      <h2 className="font-serif text-xl text-macao-ink mb-1">{titre}</h2>
      <p className="text-macao-ink/55 text-sm mb-4">{organisations.length}</p>
      <div className="space-y-4">
        {organisations.map(o => <CarteOrganisation key={o.id} o={o} />)}
      </div>
    </section>
  )
}

export default function Organisations() {
  const { donnees, chargement, erreur } = useRequete(api.organisations)

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (erreur) {
    return (
      <div className="p-10 text-macao-terra">
        Impossible de charger les clients et prospects : {erreur}
      </div>
    )
  }

  // useRequete déballe déjà l'enveloppe { data } de l'API : `donnees` est le tableau.
  const organisations = Array.isArray(donnees) ? donnees : []

  // Un prospect n'est pas un client : les mélanger dans une liste unique
  // obligeait à lire la colonne « Relation » ligne à ligne pour savoir à qui
  // on a affaire. Les clients d'abord — ce sont eux qui font le chiffre.
  const clients = organisations.filter(o => NIVEAUX_CLIENT.includes(o.niveauRelation))
  const prospects = organisations.filter(o => !NIVEAUX_CLIENT.includes(o.niveauRelation))

  return (
    <div className="p-5 sm:p-10 max-w-6xl">
      <BarreActions
        titre="Clients & prospects"
        sousTitre={`${clients.length} client${clients.length > 1 ? 's' : ''} · ${prospects.length} prospect${prospects.length > 1 ? 's' : ''} & contact${prospects.length > 1 ? 's' : ''}`}
      />

      <Groupe titre="Clients" organisations={clients} />
      <Groupe titre="Prospects & contacts" organisations={prospects} />

      {!organisations.length && (
        <p className="text-macao-ink/50">Aucun client ni prospect enregistré.</p>
      )}
    </div>
  )
}
