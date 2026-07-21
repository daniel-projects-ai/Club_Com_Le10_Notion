import { useState } from 'react'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import StatBand from '../components/dash/StatBand'
import BlocRelances from '../components/dash/BlocRelances'
import PipelineBars from '../components/dash/PipelineBars'
import StatutPastille from '../components/StatutPastille'

export default function Dashboard() {
  const { donnees, chargement, erreur, recharger } = useRequete(api.tableauDeBord)
  const [relanceEnCours, setRelanceEnCours] = useState(false)
  const [erreurRelance, setErreurRelance] = useState(null)

  async function marquerFaite(idTache) {
    // Garde-fou contre le double clic : deux appels rapprochés enverraient
    // deux fois le même changement de statut avant le premier rechargement.
    if (relanceEnCours) return
    setRelanceEnCours(true)
    setErreurRelance(null)
    try {
      await api.changerStatutTache(idTache, 'Faite')
      // On attend le rechargement : relâcher « en cours » plus tôt réafficherait
      // brièvement la relance qu'on vient de clore.
      await recharger()
    } catch (e) {
      setErreurRelance(e.message || 'Erreur')
    } finally {
      setRelanceEnCours(false)
    }
  }

  if (chargement) return <p className="p-10 text-sm text-neutral-500">Chargement…</p>
  // `useRequete` réutilise le même `erreur` pour le chargement initial et pour
  // un rechargement : sans `!donnees`, l'échec du rechargement qui suit un clic
  // effacerait toute la page alors que la relance a bien été marquée faite.
  // `donnees` n'est nul qu'avant le premier succès, il distingue les deux cas.
  if (erreur && !donnees) return <p className="p-10 text-sm text-macao-terra">Impossible de charger le tableau de bord : {erreur}</p>
  if (!donnees) return null

  const estMacao = donnees.role === 'Macao'

  // Les compteurs facultatifs passent par `|| null` pour afficher « — » plutôt qu'un zéro trompeur.
  const stats = estMacao
    ? [
        { label: 'Opportunités actives', valeur: donnees.totalOpportunites, couleur: 'terra' },
        { label: 'À analyser', valeur: donnees.aAnalyser, couleur: 'gold' },
        { label: 'Échéances sous 30 j', valeur: donnees.echeancesProches || null, couleur: 'teal' },
        { label: 'Opportunités notées', valeur: donnees.prioritaires?.length || null, couleur: 'ink' },
        // Seule dérogation à la convention « — plutôt que 0 » : ici zéro n'est pas
        // une absence de données mais l'état visé (toutes les opportunités sont
        // rattachées). `??` le laisse passer et ne réserve « — » qu'à l'indicateur absent.
        { label: 'Sans organisation', valeur: donnees.sansOrganisation ?? null, couleur: 'gold' },
        // Même raisonnement que ci-dessus : ce sont des indicateurs d'hygiène
        // dont zéro est la bonne nouvelle, pas une donnée manquante.
        { label: 'Relances en retard', valeur: donnees.relancesEnRetard ?? null, couleur: 'terra' },
        { label: 'Relances cette semaine', valeur: donnees.relancesCetteSemaine ?? null, couleur: 'gold' }
      ]
    : [
        { label: 'Opportunités ouvertes', valeur: donnees.totalOpportunites, couleur: 'terra' },
        { label: 'Échéances sous 30 j', valeur: donnees.echeancesProches || null, couleur: 'teal' }
      ]

  // StatBand attend un nom de couleur (terra/gold/teal/ink), pas un code hexadécimal.
  // `|| null` sur les trois : la convention du bandeau veut « — » et jamais « 0 ».
  const statsDossiers = [
    { label: 'Dossiers en cours', valeur: donnees.dossiersEnCours || null, couleur: 'teal' },
    { label: 'À déposer sous 7 j', valeur: donnees.aDeposer || null, couleur: 'gold' },
    { label: 'Dossiers bloqués', valeur: donnees.dossiersBloques || null, couleur: 'terra' }
  ]

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-macao-ink">Tableau de bord</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {estMacao ? "Vue pilotage de l'agence" : "Les opportunités du Club Com' Le 10"}
        </p>
      </header>

      {/* En tête de page, avant les indicateurs : une relance qu'on ne revoit
          jamais n'existe pas. Réservé au rôle Macao — le backend ne renvoie
          `relances` qu'à lui, un Coworker n'y verrait qu'un bloc indisponible. */}
      {estMacao && (
        <section className="mb-10">
          <h2 className="font-serif text-xl text-macao-ink">Relances</h2>
          <div className="mt-4">
            <BlocRelances
              relances={donnees.relances ?? null}
              onMarquerFaite={marquerFaite}
              enCours={relanceEnCours}
            />
            {erreurRelance && (
              <p className="mt-2 text-sm text-macao-terra">
                Impossible de marquer la relance faite : {erreurRelance}
              </p>
            )}
            {/* Le changement de statut a réussi mais l'actualisation a échoué :
                les relances affichées datent d'avant le clic. */}
            {erreur && !erreurRelance && (
              <p className="mt-2 text-sm text-macao-terra">
                Relances non actualisées ({erreur}) : les données ci-dessus peuvent être obsolètes.
              </p>
            )}
          </div>
        </section>
      )}

      <StatBand stats={stats} />

      {estMacao && (
        <section className="mt-10">
          <h2 className="font-serif text-xl text-macao-ink">Dossiers de réponse</h2>
          <div className="mt-4">
            <StatBand stats={statsDossiers} />
          </div>
        </section>
      )}

      {estMacao ? (
        <>
          <section className="mt-10">
            <h2 className="font-serif text-xl text-macao-ink">Pipeline par statut</h2>
            <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
              <PipelineBars parStatut={donnees.parStatut || {}} />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-xl text-macao-ink">À traiter en priorité</h2>
            <p className="mt-1 text-sm text-neutral-500">Classées par score de pertinence</p>
            <div className="mt-4 space-y-3">
              {(donnees.prioritaires || []).length === 0 ? (
                <p className="text-sm text-neutral-500">Aucune opportunité prioritaire pour le moment.</p>
              ) : (
                donnees.prioritaires.map((opp) => (
                  <article key={opp.id} className="flex items-center gap-5 rounded-xl bg-white p-5 shadow-sm">
                    <div className="w-12 shrink-0 text-center font-serif text-2xl tabular-nums text-macao-terra">
                      {opp.score ?? '—'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-macao-ink">{opp.name}</div>
                      <div className="truncate text-sm text-macao-teal">{opp.client || '—'}</div>
                    </div>
                    <StatutPastille statut={opp.status} />
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-10">
          <h2 className="font-serif text-xl text-macao-ink">Opportunités en cours</h2>
          <div className="mt-4 space-y-3">
            {(donnees.opportunites || []).length === 0 ? (
              <p className="text-sm text-neutral-500">Aucune opportunité à afficher.</p>
            ) : (
              donnees.opportunites.map((opp) => (
                <article key={opp.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="font-medium text-macao-ink">{opp.name}</div>
                  <div className="text-sm text-macao-teal">{opp.client || '—'}</div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}
