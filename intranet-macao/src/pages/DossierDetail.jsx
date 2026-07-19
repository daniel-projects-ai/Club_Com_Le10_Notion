import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { formaterDate, formaterBudget, ouTiret } from '../lib/format'
import ChantierCarte from '../components/ChantierCarte'
import PiecesChecklist from '../components/PiecesChecklist'

const ETATS_MEMOIRE = ['Non commencé', 'Plan créé', 'V1 rédigée', 'En relecture', 'Finalisé', 'Non demandé']
const ETATS_OFFRE = ['Non commencée', 'En cours', 'À valider', 'Validée', 'Non demandée']
const ETATS_DEPOT = ['Non préparé', 'Plateforme identifiée', 'Compte à vérifier', 'En cours', 'Déposé', 'Accusé reçu']

// Le Drive est saisi dans Airtable : ce n'est pas forcément une URL exploitable.
function Drive({ url }) {
  if (!url) return <span className="text-macao-ink">—</span>
  if (!/^https?:\/\//i.test(url)) return <span className="text-macao-ink">{url}</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-macao-teal underline break-all"
    >
      Ouvrir le dossier Drive
    </a>
  )
}

export default function DossierDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [d, setD] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [erreurChargement, setErreurChargement] = useState(null)

  const estMacao = user?.role === 'Macao'

  useEffect(() => {
    let annule = false
    setChargement(true)
    setErreurChargement(null)
    api.dossier(id)
      .then(({ data }) => { if (!annule) setD(data) })
      .catch((e) => {
        // On distingue l'échec réseau/403 d'un dossier vide : sinon un refus
        // d'accès et une panne s'affichent à l'identique et n'orientent pas
        // l'utilisateur vers la bonne action.
        if (!annule) { setD(null); setErreurChargement(e.message) }
      })
      .finally(() => { if (!annule) setChargement(false) })
    return () => { annule = true }
  }, [id])

  const modifier = async (champs) => {
    setEnCours(true)
    setErreur(null)
    try {
      const { data } = await api.majDossier(id, champs)
      setD(data)
    } catch {
      setErreur('La modification n’a pas pu être enregistrée.')
    } finally {
      setEnCours(false)
    }
  }

  const basculerPiece = (piece) => {
    // La case à cocher n'est pas désactivée pendant l'envoi : sans ce garde,
    // deux clics rapides partiraient tous deux depuis l'ancienne liste et le
    // second écraserait le premier.
    if (enCours) return
    const actuelles = d.piecesFournies || []
    const nouvelles = actuelles.includes(piece)
      ? actuelles.filter(p => p !== piece)
      : [...actuelles, piece]
    modifier({ piecesFournies: nouvelles })
  }

  if (chargement) return <div className="p-10 text-macao-ink/60">Chargement…</div>
  if (!d) {
    return (
      <div className="p-10">
        <Link to="/dossiers" className="text-sm text-macao-teal mb-4 inline-block">← Tous les dossiers</Link>
        <p className="text-macao-terra">
          {erreurChargement
            ? `Impossible d’afficher ce dossier : ${erreurChargement}`
            : 'Dossier indisponible.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-10 max-w-5xl">
      <Link to="/dossiers" className="text-sm text-macao-teal mb-4 inline-block">← Tous les dossiers</Link>

      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-3xl text-macao-ink">{d.nom}</h1>
        {d.bloque && (
          <span className="text-xs px-3 py-1 rounded-full bg-macao-terra text-white shrink-0">
            À traiter
          </span>
        )}
      </div>
      <p className="text-macao-ink/60 mb-8">
        Échéance {formaterDate(d.dateLimite)} · Statut {ouTiret(d.statut)}
      </p>

      {erreur && <p className="text-macao-terra text-sm mb-4">{erreur}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ChantierCarte
          titre="Mémoire technique" valeur={d.memoire} options={ETATS_MEMOIRE}
          couleur="#c0562f" enCours={enCours}
          onChanger={estMacao ? (v) => modifier({ memoire: v }) : null}
        />
        <ChantierCarte
          titre="Offre financière" valeur={d.offre} options={ETATS_OFFRE}
          couleur="#e9a94e" enCours={enCours}
          onChanger={estMacao ? (v) => modifier({ offre: v }) : null}
        />
        <ChantierCarte
          titre="Dépôt" valeur={d.depot} options={ETATS_DEPOT}
          couleur="#206b73" enCours={enCours}
          onChanger={estMacao ? (v) => modifier({ depot: v }) : null}
        />
      </div>

      <section className="bg-white rounded-xl p-6 mb-6">
        <h2 className="font-serif text-xl text-macao-ink mb-1">Pièces administratives</h2>
        <p className="text-sm text-macao-ink/55 mb-4">
          {d.piecesManquantes?.length
            ? `${d.piecesManquantes.length} pièce(s) manquante(s)`
            : 'Toutes les pièces demandées sont fournies'}
        </p>
        <PiecesChecklist
          demandees={d.piecesDemandees}
          fournies={d.piecesFournies}
          onBasculer={estMacao ? basculerPiece : null}
          enCours={enCours}
        />
      </section>

      <section className="bg-white rounded-xl p-6">
        <h2 className="font-serif text-xl text-macao-ink mb-4">Informations</h2>
        <div className="space-y-3">
          {[
            ['Responsable', ouTiret(d.responsable)],
            ['Mode de réponse', ouTiret(d.modeReponse)],
            ['Date de dépôt', formaterDate(d.dateDepot)],
            ['Dossier Drive', <Drive url={d.drive} />],
            ...(estMacao ? [
              ['Montant proposé', formaterBudget(d.montantPropose)],
              ['Niveau de risque', ouTiret(d.niveauRisque)],
              ['Retours acheteur', ouTiret(d.retoursAcheteur)],
              ['Notes internes', ouTiret(d.notesInternes)]
            ] : [])
          ].map(([label, valeur]) => (
            <div key={label} className="flex border-b border-macao-ink/10 pb-3 last:border-0">
              <span className="w-44 text-macao-ink/55 text-sm shrink-0">{label}</span>
              <span className="text-macao-ink">{valeur}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-macao-ink/50 mt-4">
          Les textes longs (questions, éléments à réutiliser) se saisissent dans Airtable.
        </p>
      </section>
    </div>
  )
}
