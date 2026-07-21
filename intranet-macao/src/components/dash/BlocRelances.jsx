import { formaterDate, ouTiret } from '../../lib/format'

function Ligne({ tache, onMarquerFaite, enCours, accent }) {
  return (
    <li className="flex min-h-[44px] flex-wrap items-center justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className={`break-words text-sm ${accent ? 'text-macao-terra font-semibold' : 'text-macao-ink'}`}>
          {ouTiret(tache.intitule)}
        </p>
        <p className="break-words text-xs text-macao-ink/60">
          {ouTiret(tache.organisation)} · {formaterDate(tache.echeance)} · {ouTiret(tache.responsable)}
        </p>
      </div>
      {/* min-h-[44px] : « Fait » se tape au doigt en sortant d'un rendez-vous. */}
      <button
        type="button"
        onClick={() => onMarquerFaite?.(tache.id)}
        disabled={enCours || !onMarquerFaite}
        className="min-h-[44px] shrink-0 rounded-lg border border-macao-teal px-4 py-2 text-xs text-macao-teal disabled:opacity-50"
      >
        Fait
      </button>
    </li>
  )
}

function Groupe({ titre, taches, onMarquerFaite, enCours, accent }) {
  if (!taches.length) return null
  return (
    <div>
      <p
        className={`text-2xs font-semibold uppercase tracking-[0.18em] mb-1 ${
          accent ? 'text-macao-terra' : 'text-neutral-500'
        }`}
      >
        {titre}
      </p>
      <ul className="divide-y divide-macao-ink/10">
        {taches.map((t) => (
          <Ligne key={t.id} tache={t} onMarquerFaite={onMarquerFaite} enCours={enCours} accent={accent} />
        ))}
      </ul>
    </div>
  )
}

export default function BlocRelances({ relances, onMarquerFaite, enCours = false }) {
  // `null` signale une indisponibilité (droits, erreur de chargement) et ne
  // doit pas être confondu avec « aucune relance », qui est une bonne nouvelle.
  if (!relances) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm sm:p-5">
        <p className="text-sm text-macao-ink/50">Relances indisponibles.</p>
      </div>
    )
  }

  const enRetard = Array.isArray(relances.enRetard) ? relances.enRetard : []
  const cetteSemaine = Array.isArray(relances.cetteSemaine) ? relances.cetteSemaine : []
  const plusTard = Array.isArray(relances.plusTard) ? relances.plusTard : []

  if (!enRetard.length && !cetteSemaine.length && !plusTard.length) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm sm:p-5">
        <p className="text-sm text-macao-teal">Aucune relance en attente. Tout est à jour.</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm space-y-4 sm:p-5 ${enCours ? 'opacity-50' : ''}`}>
      <Groupe
        titre="En retard"
        taches={enRetard}
        onMarquerFaite={onMarquerFaite}
        enCours={enCours}
        accent
      />
      <Groupe
        titre="Cette semaine"
        taches={cetteSemaine}
        onMarquerFaite={onMarquerFaite}
        enCours={enCours}
      />
      {plusTard.length > 0 && (
        <p className="text-xs text-macao-ink/60">
          Plus tard : {plusTard.length} relance{plusTard.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
