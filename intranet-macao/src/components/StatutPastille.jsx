// Pastille de statut, partagée par le tableau de bord et la liste des opportunités.
export default function StatutPastille({ statut }) {
  if (!statut) return null
  return (
    <span className="shrink-0 rounded-full bg-cream-soft px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-macao-ink">
      {statut}
    </span>
  )
}
