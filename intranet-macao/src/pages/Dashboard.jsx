import { useState } from 'react'
import { api } from '../lib/api'
import { useRequete } from '../lib/useRequete'
import StatBand from '../components/dash/StatBand'
import BlocATraiter from '../components/dash/BlocATraiter'
import StatutPastille from '../components/StatutPastille'

// « Aujourd'hui » : trois blocs, dans l'ordre où l'on s'en sert.
// 1. Ce qu'il faut traiter, 2. les projets à regarder, 3. les chiffres.
// Le pipeline par statut a quitté cette page : il relève du suivi des projets,
// pas de la journée en cours, et rejoindra la page Projets.
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

  if (chargement) return <p className="px-4 py-6 sm:px-8 sm:py-10 text-sm text-neutral-500">Chargement…</p>
  // `useRequete` réutilise le même `erreur` pour le chargement initial et pour
  // un rechargement : sans `!donnees`, l'échec du rechargement qui suit un clic
  // effacerait toute la page alors que la relance a bien été marquée faite.
  // `donnees` n'est nul qu'avant le premier succès, il distingue les deux cas.
  if (erreur && !donnees) return <p className="px-4 py-6 sm:px-8 sm:py-10 text-sm text-macao-terra">Impossible de charger le tableau de bord : {erreur}</p>
  if (!donnees) return null

  const estMacao = donnees.role === 'Macao'
  const prioritaires = Array.isArray(donnees.prioritaires) ? donnees.prioritaires : []
  const opportunites = Array.isArray(donnees.opportunites) ? donnees.opportunites : []

  // Quatre repères, pas davantage : au-delà, on ne lit plus, on balaye.
  // Les compteurs facultatifs passent par `|| null` pour afficher « — » plutôt qu'un zéro trompeur.
  const stats = estMacao
    ? [
        { label: 'Projets en cours', valeur: donnees.totalOpportunites, couleur: 'terra' },
        { label: 'À trier', valeur: donnees.aAnalyser, couleur: 'gold' },
        { label: 'Devis en cours', valeur: donnees.dossiersEnCours || null, couleur: 'teal' },
        // Indicateur d'hygiène : zéro est l'état visé, `??` le laisse passer.
        { label: 'Projets sans client', valeur: donnees.sansOrganisation ?? null, couleur: 'ink' }
      ]
    : [
        { label: 'Projets ouverts', valeur: donnees.totalOpportunites, couleur: 'terra' },
        { label: 'Échéances sous 30 j', valeur: donnees.echeancesProches || null, couleur: 'teal' }
      ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-8">
        <h1 className="font-serif text-2xl text-macao-ink sm:text-3xl">Aujourd'hui</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {estMacao ? "Ce qui attend l'agence ce matin" : "Les projets du Club Com' Le 10"}
        </p>
      </header>

      {/* Réservé au rôle Macao : le backend ne renvoie relances ni devis à un
          Coworker, qui n'y verrait qu'un bloc vide. */}
      {estMacao && (
        <section className="mb-10">
          <h2 className="font-serif text-xl text-macao-ink">À traiter</h2>
          <div className="mt-4">
            <BlocATraiter
              donnees={donnees}
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

      <section className="mb-10">
        <h2 className="font-serif text-xl text-macao-ink">
          {estMacao ? 'Nouveaux projets à trier' : 'Projets ouverts'}
        </h2>
        {estMacao && <p className="mt-1 text-sm text-neutral-500">Classés par score de pertinence</p>}
        <div className="mt-4 space-y-3">
          {estMacao ? (
            prioritaires.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucun nouveau projet à trier pour le moment.</p>
            ) : (
              prioritaires.map((opp) => (
                <article key={opp.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm sm:gap-5 sm:p-5">
                  <div className="w-10 shrink-0 text-center font-serif text-2xl tabular-nums text-macao-terra sm:w-12">
                    {opp.score ?? '—'}
                  </div>
                  {/* min-w-40 : la pastille ne rétrécit pas, et un statut long
                      (« GO / NO GO à décider ») réduisait le nom du projet à
                      « Refonte d… ». Ce plancher force la pastille à passer à la
                      ligne plutôt que d'écraser l'information principale. */}
                  <div className="min-w-40 flex-1">
                    <div className="truncate font-medium text-macao-ink">{opp.name}</div>
                    <div className="truncate text-sm text-macao-teal">{opp.client || '—'}</div>
                  </div>
                  <StatutPastille statut={opp.status} />
                </article>
              ))
            )
          ) : opportunites.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucun projet à afficher.</p>
          ) : (
            opportunites.map((opp) => (
              <article key={opp.id} className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
                <div className="break-words font-medium text-macao-ink">{opp.name}</div>
                <div className="break-words text-sm text-macao-teal">{opp.client || '—'}</div>
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-xl text-macao-ink">En bref</h2>
        <StatBand stats={stats} />
      </section>
    </div>
  )
}
