import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

const CANAUX = [
  'Email', 'Appel', 'SMS', 'WhatsApp', 'Visioconférence',
  'Rendez-vous', 'LinkedIn', 'Courrier', 'Formulaire du site', 'Autre'
]

// La date par défaut se construit en heure locale : `toISOString()` renverrait
// la journée UTC, et un échange saisi le soir à Paris serait daté du lendemain.
function aujourdHuiLocal() {
  const d = new Date()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mois}-${jour}`
}

export default function FormulaireEchange({ organisation, onEnregistre, onAnnuler }) {
  const interlocuteurs = Array.isArray(organisation?.interlocuteurs) ? organisation.interlocuteurs : []

  const [canal, setCanal] = useState('Appel')
  const [sens, setSens] = useState('Sortant')
  const [date, setDate] = useState(aujourdHuiLocal)
  const [compteRendu, setCompteRendu] = useState('')
  const [interlocuteurId, setInterlocuteurId] = useState('')
  const [assisteeIA, setAssisteeIA] = useState(false)
  const [prevoirRelance, setPrevoirRelance] = useState(false)
  const [intituleRelance, setIntituleRelance] = useState('')
  const [echeanceRelance, setEcheanceRelance] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [avertissements, setAvertissements] = useState([])

  const champCompteRendu = useRef(null)

  // Le compte rendu est le champ principal : on y entre directement, sans clic.
  useEffect(() => { champCompteRendu.current?.focus() }, [])

  const interlocuteur = interlocuteurs.find((i) => i.id === interlocuteurId) || null
  const canauxDeconseilles = Array.isArray(interlocuteur?.canauxDeconseilles)
    ? interlocuteur.canauxDeconseilles
    : []
  // Règle juridique calculée côté serveur : on se contente de la lire.
  const canalDeconseille = canauxDeconseilles.includes(canal)
  const oppose = Boolean(interlocuteur?.opposition)

  async function envoyer(e) {
    e.preventDefault()
    // Garde-fou contre le double clic : un deuxième envoi créerait une
    // seconde interaction identique, invisible tant qu'on ne relit pas le journal.
    if (enCours) return
    setEnCours(true)
    setErreur(null)
    setAvertissements([])
    try {
      const corps = {
        organisationId: organisation?.id,
        canal,
        sens,
        date,
        compteRendu,
        assisteeIA
      }
      if (interlocuteurId) corps.interlocuteurId = interlocuteurId
      if (prevoirRelance) {
        corps.relance = { intitule: intituleRelance, echeance: echeanceRelance }
      }
      const { data } = await api.journaliserEchange(corps)
      // Le serveur peut avertir même quand l'enregistrement a réussi (relance
      // sans date, auteur non résolu) : on les affiche ici au cas où le parent
      // garde le formulaire monté, et on les lui transmet dans tous les cas.
      setAvertissements(Array.isArray(data?.avertissements) ? data.avertissements : [])
      onEnregistre?.(data)
    } catch (err) {
      // On n'efface aucun champ : perdre un compte rendu déjà tapé est la
      // raison principale pour laquelle un journal cesse d'être rempli.
      setErreur(err.message || 'Erreur')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="bg-white rounded-xl p-5 space-y-4 border border-macao-ink/10">
      <p className="font-serif text-lg text-macao-ink">
        Journaliser un échange{organisation?.nom ? ` — ${organisation.nom}` : ''}
      </p>

      <div>
        <p className="text-xs text-macao-ink/60 mb-2">Canal</p>
        <div className="flex flex-wrap gap-2">
          {CANAUX.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCanal(c)}
              aria-pressed={canal === c}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                canal === c
                  ? 'bg-macao-teal border-macao-teal text-white'
                  : 'bg-white border-macao-ink/15 text-macao-ink'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-macao-ink/60 mb-2">Sens</p>
        <div className="flex gap-2">
          {['Sortant', 'Entrant'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSens(s)}
              aria-pressed={sens === s}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                sens === s
                  ? 'bg-macao-ink border-macao-ink text-white'
                  : 'bg-white border-macao-ink/15 text-macao-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="echange-date" className="block text-xs text-macao-ink/60 mb-2">Date</label>
        <input
          id="echange-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-macao-ink/15 rounded-lg px-3 py-2 text-macao-ink"
        />
      </div>

      <div>
        <label htmlFor="echange-compte-rendu" className="block text-xs text-macao-ink/60 mb-2">
          Compte rendu
        </label>
        <textarea
          id="echange-compte-rendu"
          ref={champCompteRendu}
          rows={4}
          value={compteRendu}
          onChange={(e) => setCompteRendu(e.target.value)}
          placeholder="Ce qui s'est dit…"
          className="w-full border border-macao-ink/15 rounded-lg px-3 py-2 text-macao-ink"
        />
      </div>

      <div>
        <label htmlFor="echange-interlocuteur" className="block text-xs text-macao-ink/60 mb-2">
          Interlocuteur <span className="text-macao-ink/40">(facultatif)</span>
        </label>
        <select
          id="echange-interlocuteur"
          value={interlocuteurId}
          onChange={(e) => setInterlocuteurId(e.target.value)}
          className="w-full border border-macao-ink/15 rounded-lg px-3 py-2 text-macao-ink bg-white"
        >
          <option value="">—</option>
          {interlocuteurs.map((i) => (
            <option key={i.id} value={i.id}>
              {i.fonction ? `${i.nom} — ${i.fonction}` : i.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Ces bandeaux informent et ne bloquent jamais l'enregistrement : on
          journalise aussi ce qui a déjà eu lieu, y compris un appel reçu. */}
      {oppose && (
        <p className="rounded-lg border border-macao-terra bg-macao-terra/10 px-3 py-2 text-sm text-macao-terra">
          Cette personne s'est opposée à la prospection. Aucun démarchage ne doit lui être adressé.
        </p>
      )}
      {!oppose && canalDeconseille && (
        <p className="rounded-lg border border-macao-gold bg-macao-gold/15 px-3 py-2 text-sm text-macao-ink">
          Canal déconseillé pour cet interlocuteur : SMS et WhatsApp exigent un accord préalable,
          LinkedIn interdit l'automatisation.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-macao-ink/70">
        <input
          type="checkbox"
          checked={assisteeIA}
          onChange={(e) => setAssisteeIA(e.target.checked)}
        />
        Rédaction assistée par IA
      </label>

      <div className="rounded-lg border border-macao-teal/30 bg-macao-teal/5 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-macao-ink">
          <input
            type="checkbox"
            checked={prevoirRelance}
            onChange={(e) => setPrevoirRelance(e.target.checked)}
          />
          Prévoir une relance
        </label>
        {prevoirRelance && (
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="relance-intitule" className="block text-xs text-macao-ink/60 mb-1">
                Intitulé
              </label>
              <input
                id="relance-intitule"
                type="text"
                value={intituleRelance}
                onChange={(e) => setIntituleRelance(e.target.value)}
                placeholder="Rappeler pour…"
                className="w-full border border-macao-ink/15 rounded-lg px-3 py-2 text-macao-ink"
              />
            </div>
            <div>
              <label htmlFor="relance-echeance" className="block text-xs text-macao-ink/60 mb-1">
                Échéance
              </label>
              <input
                id="relance-echeance"
                type="date"
                value={echeanceRelance}
                onChange={(e) => setEcheanceRelance(e.target.value)}
                className="border border-macao-ink/15 rounded-lg px-3 py-2 text-macao-ink"
              />
            </div>
          </div>
        )}
      </div>

      {avertissements.length > 0 && (
        <ul className="rounded-lg border border-macao-gold bg-macao-gold/15 px-3 py-2 text-sm text-macao-ink space-y-1">
          {avertissements.map((a) => <li key={a}>{a}</li>)}
        </ul>
      )}

      {erreur && (
        <p className="rounded-lg border border-macao-terra bg-macao-terra/10 px-3 py-2 text-sm text-macao-terra">
          {erreur}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="px-4 py-2 rounded-lg bg-macao-terra text-white text-sm disabled:opacity-50"
        >
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {onAnnuler && (
          <button
            type="button"
            onClick={onAnnuler}
            disabled={enCours}
            className="px-4 py-2 rounded-lg border border-macao-ink/15 text-sm text-macao-ink disabled:opacity-50"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
