import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import { useAuth } from '../context/AuthContext'
import StatutPastille from '../components/StatutPastille'
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
      <div className="mt-0.5 text-sm text-macao-ink">{valeur}</div>
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
          'rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50',
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
    <div className="flex flex-col items-end gap-1">
      <select
        value={opp.status || ''}
        disabled={etat === 'envoi'}
        onChange={(e) => changer(e.target.value)}
        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-macao-ink disabled:opacity-50"
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

  if (chargement) return <p className="p-10 text-sm text-neutral-500">Chargement…</p>
  if (erreur) return <p className="p-10 text-sm text-macao-terra">Impossible de charger les opportunités : {erreur}</p>

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
                {estMacao
                  ? <SelecteurStatut opp={opp} onChange={(c) => majOpportunite(opp.id, c)} />
                  : <StatutPastille statut={opp.status} />}
              </div>
              <div className="mt-1 text-sm font-medium text-macao-teal">{ouTiret(opp.client)}</div>
              {opp.objet && <p className="mt-3 text-sm leading-relaxed text-neutral-600">{opp.objet}</p>}
              <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-4 sm:grid-cols-3">
                <Champ label="Budget" valeur={formaterBudget(opp.budget)} />
                <Champ label="Échéance" valeur={formaterDate(opp.deadline)} />
                <Champ label="Territoire" valeur={ouTiret(opp.territoire)} />
              </div>

              <div className="mt-5">
                <BoutonInteret opp={opp} onChange={(c) => majOpportunite(opp.id, c)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
