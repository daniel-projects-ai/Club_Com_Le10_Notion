import { Link } from 'react-router-dom'
import { formaterDate, ouTiret } from '../../lib/format'

// Premier bloc de la journée : il ne compte pas, il dit quoi faire.
// Chaque ligne porte donc soit une action directe (« Fait »), soit un lien
// vers l'endroit où l'on traite le sujet.

// Terra = c'est déjà en retard, gold = ça arrive. Pas d'autre code couleur :
// une alerte qui n'est ni urgente ni imminente n'a rien à faire ici.
function Pastille({ ton }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
        ton === 'retard' ? 'bg-macao-terra' : 'bg-macao-gold'
      }`}
    />
  )
}

function LigneRelance({ tache, ton, onMarquerFaite, enCours }) {
  return (
    <li className="flex min-h-[44px] flex-wrap items-start justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-1 gap-3">
        <Pastille ton={ton} />
        <div className="min-w-0">
          <p className={`text-sm ${ton === 'retard' ? 'font-semibold text-macao-terra' : 'text-macao-ink'}`}>
            {ouTiret(tache.intitule)}
          </p>
          <p className="text-xs text-macao-ink/60">
            {ouTiret(tache.organisation)} · {formaterDate(tache.echeance)}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onMarquerFaite?.(tache.id)}
        disabled={enCours || !onMarquerFaite}
        className="min-h-[44px] shrink-0 rounded-lg border border-macao-teal px-4 py-2 text-xs text-macao-teal transition hover:bg-macao-teal/10 disabled:opacity-50"
      >
        Fait
      </button>
    </li>
  )
}

function LigneLien({ ton, libelle, precision, to }) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-[44px] items-start gap-3 py-3 transition hover:opacity-70"
      >
        <Pastille ton={ton} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${ton === 'retard' ? 'font-semibold text-macao-terra' : 'text-macao-ink'}`}>
            {libelle}
          </p>
          <p className="text-xs text-macao-ink/60">{precision}</p>
        </div>
        <span aria-hidden="true" className="shrink-0 text-sm text-macao-teal">→</span>
      </Link>
    </li>
  )
}

export default function BlocATraiter({ donnees, onMarquerFaite, enCours = false }) {
  // `relances` peut valoir `null` (droits, erreur amont) : c'est une
  // indisponibilité, pas « aucune relance ». On le signale sans pour autant
  // masquer les alertes devis, qui viennent d'ailleurs.
  const relances = donnees?.relances ?? null
  const relancesIndisponibles = relances === null || relances === undefined

  const enRetard = Array.isArray(relances?.enRetard) ? relances.enRetard : []
  const cetteSemaine = Array.isArray(relances?.cetteSemaine) ? relances.cetteSemaine : []

  const dossiersBloques = Number(donnees?.dossiersBloques) || 0
  const aDeposer = Number(donnees?.aDeposer) || 0

  const rienEnAttente =
    !enRetard.length && !cetteSemaine.length && !dossiersBloques && !aDeposer

  if (rienEnAttente && !relancesIndisponibles) {
    // Une bonne nouvelle mérite une phrase, pas un cadre vide.
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-macao-teal">Rien d'urgent aujourd'hui.</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm ${enCours ? 'opacity-50' : ''}`}>
      {relancesIndisponibles && (
        <p className="mb-3 text-sm text-macao-ink/50">
          Relances indisponibles : cette liste peut être incomplète.
        </p>
      )}

      {rienEnAttente && relancesIndisponibles ? (
        <p className="text-sm text-macao-ink/60">Aucune autre alerte à traiter.</p>
      ) : (
        <ul className="divide-y divide-macao-ink/10">
          {/* Le retard d'abord : c'est ce qui coûte si on l'oublie encore un jour. */}
          {enRetard.map((tache) => (
            <LigneRelance
              key={tache.id}
              tache={tache}
              ton="retard"
              onMarquerFaite={onMarquerFaite}
              enCours={enCours}
            />
          ))}

          {dossiersBloques > 0 && (
            <LigneLien
              ton="retard"
              libelle={`${dossiersBloques} devis bloqué${dossiersBloques > 1 ? 's' : ''}`}
              precision="Une pièce manque ou une validation attend."
              to="/dossiers"
            />
          )}

          {aDeposer > 0 && (
            <LigneLien
              ton="approche"
              libelle={`${aDeposer} devis à rendre sous 7 jours`}
              precision="À finaliser avant échéance."
              to="/dossiers"
            />
          )}

          {cetteSemaine.map((tache) => (
            <LigneRelance
              key={tache.id}
              tache={tache}
              ton="approche"
              onMarquerFaite={onMarquerFaite}
              enCours={enCours}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
