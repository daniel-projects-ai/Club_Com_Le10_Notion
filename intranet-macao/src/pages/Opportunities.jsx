import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { useAuth } from '../context/AuthContext'
import StatutPastille from '../components/StatutPastille'
import BarreActions from '../components/BarreActions'
import PipelineBars from '../components/dash/PipelineBars'
import { formaterBudget, formaterDate, ouTiret } from '../lib/format'

// Même liste fermée que côté serveur (STATUTS_OPPORTUNITE). Le front s'en
// sert seulement pour peupler le menu : c'est le serveur qui valide.
const STATUTS = [
  'À analyser',
  'GO / NO GO à décider',
  'GO',
  'NO GO',
  'Transmis au Club',
  'En réponse',
  'Déposé',
  'Gagné',
  'Perdu',
  'Archivé'
]

function Champ({ label, valeur }) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-neutral-400">{label}</div>
      <div className="mt-0.5 break-words text-sm text-macao-ink">{valeur}</div>
    </div>
  )
}

// Bouton « Ça m'intéresse » / « Vous êtes positionné ».
// L'état remonte au parent, qui met à jour la carte sans recharger la page.
function BoutonInteret({ opp, onChange }) {
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)

  const basculer = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      if (opp.estPositionne) {
        await api.retirerPositionnement(opp.id)
        onChange({ estPositionne: false, positionnementId: null })
      } else {
        const { data } = await api.sePositionner(opp.id)
        onChange({ estPositionne: true, positionnementId: data?.id || null })
      }
    } catch (e) {
      setErreur(e.message)
    } finally {
      setEnCours(false)
    }
  }

  const libelle = enCours
    ? (opp.estPositionne ? 'Retrait…' : 'Enregistrement…')
    : (opp.estPositionne ? '✓ Vous êtes positionné' : 'Ça m’intéresse')

  return (
    <div>
      <button
        type="button"
        onClick={basculer}
        disabled={enCours}
        title={opp.estPositionne ? 'Cliquez pour retirer votre positionnement' : undefined}
        className={[
          'inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50',
          opp.estPositionne
            ? 'border border-macao-teal bg-cream-soft text-macao-teal hover:border-macao-terra hover:text-macao-terra'
            : 'bg-macao-terra text-white hover:opacity-90'
        ].join(' ')}
      >
        {libelle}
      </button>
      {opp.estPositionne && !enCours && (
        <span className="ml-2 text-2xs text-neutral-400">Cliquez à nouveau pour retirer</span>
      )}
      {erreur && <p className="mt-1 text-2xs text-macao-terra">Échec : {erreur}</p>}
    </div>
  )
}

// Rattachement CRM — réservé à Macao. L'absence de rattachement n'est pas un
// détail décoratif : sans elle rien ne signale que le projet sortira de
// l'historique du client, et le CRM se vide en silence.
function LienOrganisation({ opp }) {
  const [premiere] = Array.isArray(opp.organisationIds) ? opp.organisationIds : []

  if (!premiere) {
    return (
      <span className="self-center text-xs italic text-neutral-500">
        Aucun client rattaché
      </span>
    )
  }

  return (
    <Link
      to={`/organisations/${premiere}`}
      className="inline-flex min-h-[44px] items-center rounded-full border border-macao-teal px-4 py-2 text-sm font-semibold text-macao-teal transition hover:border-macao-terra hover:text-macao-terra"
    >
      Voir le client
    </Link>
  )
}

// Un devis ne se justifie qu'une fois la décision de répondre prise : inutile
// de proposer la création sur un projet encore à analyser ou abandonné.
const STATUTS_AVEC_DOSSIER = ['GO', 'Transmis au Club', 'En réponse']

// Création du devis — réservée à Macao (le serveur renvoie 403 aux autres).
// L'état vit dans le composant, donc par carte : une erreur sur le projet A
// ne peut pas s'afficher sous le projet B.
function BoutonCreerDossier({ opp, onCree }) {
  const navigate = useNavigate()
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)

  const creer = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      const { data } = await api.creerDossier(opp.id)
      // On enregistre la correspondance avant de partir : au retour arrière,
      // la carte affiche le lien vers le dossier et non le bouton de création.
      onCree?.(data.id)
      navigate(`/dossiers/${data.id}`)
    } catch (e) {
      // `appel` ne remonte pas le code HTTP : on distingue le 409 par le
      // message renvoyé par le serveur (« Un dossier existe déjà »).
      setErreur(
        /dossier existe d[ée]j[àa]/i.test(e.message || '')
          ? 'Un devis existe déjà pour ce projet'
          : 'La création a échoué'
      )
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={creer}
        disabled={enCours}
        className="inline-flex min-h-[44px] items-center rounded-full border border-macao-teal px-4 py-2 text-sm font-semibold text-macao-teal transition hover:border-macao-terra hover:text-macao-terra disabled:opacity-50"
      >
        {enCours ? 'Création…' : 'Créer le devis'}
      </button>
      {erreur && <p className="mt-1 text-2xs text-macao-terra">{erreur}</p>}
    </div>
  )
}

// Menu de statut — affiché uniquement pour Macao. La protection réelle est
// côté serveur (requireRole('Macao') sur PATCH /opportunities/:id/status).
function SelecteurStatut({ opp, onChange }) {
  const [etat, setEtat] = useState('repos') // repos | envoi | ok | erreur
  const [erreur, setErreur] = useState(null)

  const changer = async (statut) => {
    if (statut === opp.status) return
    setEtat('envoi')
    setErreur(null)
    try {
      await api.changerStatut(opp.id, statut)
      onChange({ status: statut })
      setEtat('ok')
    } catch (e) {
      setErreur(e.message)
      setEtat('erreur')
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-1 sm:w-auto sm:items-end">
      <select
        value={opp.status || ''}
        disabled={etat === 'envoi'}
        onChange={(e) => changer(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-macao-ink disabled:opacity-50 sm:w-auto"
      >
        {!opp.status && <option value="">Sans statut</option>}
        {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {etat === 'envoi' && <span className="text-2xs text-neutral-400">Mise à jour…</span>}
      {etat === 'ok' && <span className="text-2xs text-macao-teal">Statut enregistré</span>}
      {etat === 'erreur' && <span className="text-2xs text-macao-terra">Échec : {erreur}</span>}
    </div>
  )
}

// Liste dépliable des coworkers positionnés — réservée à Macao.
// Le chargement est paresseux : on n'interroge Airtable qu'à l'ouverture.
function BlocPositionnements({ opportuniteId }) {
  const [ouvert, setOuvert] = useState(false)
  const [liste, setListe] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState(null)

  const basculer = async () => {
    const prochain = !ouvert
    setOuvert(prochain)
    if (!prochain || liste) return

    setChargement(true)
    setErreur(null)
    try {
      const { data } = await api.positionnements(opportuniteId)
      setListe(data || [])
    } catch (e) {
      setErreur(e.message)
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="mt-4 border-t border-neutral-100 pt-3">
      <button
        type="button"
        onClick={basculer}
        className="inline-flex min-h-[44px] items-center text-xs font-semibold text-macao-teal hover:text-macao-terra"
      >
        {ouvert ? '▾' : '▸'} Positionnements
        {liste !== null && ` (${liste.length})`}
      </button>

      {ouvert && (
        <div className="mt-2">
          {chargement && <p className="text-xs text-neutral-500">Chargement…</p>}
          {erreur && <p className="text-xs text-macao-terra">Impossible de charger : {erreur}</p>}
          {liste && liste.length === 0 && (
            <p className="text-xs text-neutral-500">Aucun positionnement pour l’instant.</p>
          )}
          {liste && liste.length > 0 && (
            <ul className="space-y-2">
              {liste.map((p) => (
                <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
                  <span>
                    <span className="font-semibold text-macao-ink">{p.nom}</span>
                    {p.metiers?.length > 0 && (
                      <span className="text-neutral-500"> — {p.metiers.join(', ')}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-neutral-400">{formaterDate(p.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function Opportunities() {
  const { user } = useAuth()
  const { donnees, chargement, erreur } = useRequete(api.opportunites)
  const estMacao = user?.role === 'Macao'

  // Copie locale : les interactions (positionnement, statut) modifient une
  // seule carte, sans repasser par un rechargement complet de la liste.
  const [opportunites, setOpportunites] = useState([])
  useEffect(() => { setOpportunites(donnees || []) }, [donnees])

  const majOpportunite = (id, champs) => {
    setOpportunites((liste) => liste.map(o => (o.id === id ? { ...o, ...champs } : o)))
  }

  // Répartition par statut, calculée sur les projets déjà chargés — aucun appel
  // réseau supplémentaire. Même règle que le serveur (« Sans statut » pour un
  // statut vide, comptage sur la même liste que celle rendue par /opportunities),
  // donc le même résultat qu'au tableau de bord ; à ceci près qu'un changement
  // de statut fait ici se répercute aussitôt, là où la valeur du serveur
  // attendait un rechargement.
  const parStatut = useMemo(() => {
    const compte = {}
    for (const opp of opportunites) {
      const statut = opp.status || 'Sans statut'
      compte[statut] = (compte[statut] || 0) + 1
    }
    return compte
  }, [opportunites])

  // Correspondance projet → devis existant, pour ne pas proposer une création
  // qui échouerait en 409. Seul Macao voit ces boutons : inutile de faire porter
  // l'appel aux autres rôles.
  const [dossiersParOpportunite, setDossiersParOpportunite] = useState({})
  useEffect(() => {
    if (!estMacao) return
    let annule = false
    api.dossiers()
      .then(({ data }) => {
        if (annule) return
        const correspondance = {}
        for (const dossier of data || []) {
          for (const oppId of dossier.opportuniteIds || []) correspondance[oppId] = dossier.id
        }
        setDossiersParOpportunite(correspondance)
      })
      // Un incident sur les dossiers ne doit pas rendre la page inutilisable :
      // on retombe silencieusement sur le bouton de création partout.
      .catch(() => {})
    return () => { annule = true }
  }, [estMacao])

  if (chargement) return <p className="px-4 py-6 sm:px-8 sm:py-10 text-sm text-neutral-500">Chargement…</p>
  if (erreur) return <p className="px-4 py-6 sm:px-8 sm:py-10 text-sm text-macao-terra">Impossible de charger les projets : {erreur}</p>

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <BarreActions
        titre="Projets"
        sousTitre={`${opportunites.length} projet${opportunites.length > 1 ? 's' : ''} visible${opportunites.length > 1 ? 's' : ''}`}
      />

      {/* Pilotage réservé à Macao : un coworker ne voit qu'une partie des
          projets, un pipeline calculé sur cette part lui donnerait une vue
          fausse de l'activité de l'agence. */}
      {estMacao && opportunites.length > 0 && (
        <section className="mb-10 rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 font-serif text-xl text-macao-ink">Pipeline par statut</h2>
          <PipelineBars parStatut={parStatut} />
        </section>
      )}

      {opportunites.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucun projet à afficher pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {opportunites.map((opp) => (
            <article key={opp.id} className="rounded-xl border-l-4 border-macao-terra bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 break-words font-serif text-xl text-macao-ink">{opp.name}</h2>
                {estMacao
                  ? <SelecteurStatut opp={opp} onChange={(c) => majOpportunite(opp.id, c)} />
                  : <StatutPastille statut={opp.status} />}
              </div>
              <div className="mt-1 break-words text-sm font-medium text-macao-teal">{ouTiret(opp.client)}</div>
              {opp.objet && <p className="mt-3 break-words text-sm leading-relaxed text-neutral-600">{opp.objet}</p>}
              <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-3">
                <Champ label="Budget" valeur={formaterBudget(opp.budget)} />
                <Champ label="Échéance" valeur={formaterDate(opp.deadline)} />
                <Champ label="Territoire" valeur={ouTiret(opp.territoire)} />
              </div>

              <div className="mt-5 flex flex-wrap items-start gap-3">
                <BoutonInteret opp={opp} onChange={(c) => majOpportunite(opp.id, c)} />
                {estMacao && STATUTS_AVEC_DOSSIER.includes(opp.status) && (
                  dossiersParOpportunite[opp.id]
                    ? (
                      <Link
                        to={`/dossiers/${dossiersParOpportunite[opp.id]}`}
                        className="inline-flex min-h-[44px] items-center rounded-full border border-macao-teal px-4 py-2 text-sm font-semibold text-macao-teal transition hover:border-macao-terra hover:text-macao-terra"
                      >
                        Voir le devis
                      </Link>
                    )
                    : (
                      <BoutonCreerDossier
                        opp={opp}
                        onCree={(dossierId) =>
                          setDossiersParOpportunite((c) => ({ ...c, [opp.id]: dossierId }))}
                      />
                    )
                )}
                {estMacao && <LienOrganisation opp={opp} />}
              </div>

              {estMacao && <BlocPositionnements opportuniteId={opp.id} />}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
