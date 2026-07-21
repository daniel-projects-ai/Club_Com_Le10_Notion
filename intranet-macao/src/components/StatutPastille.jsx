// Pastille de statut, partagée par le tableau de bord et la liste des projets.
export default function StatutPastille({ statut }) {
  if (!statut) return null
  return (
    // max-w-full : `shrink-0` fige la pastille à la largeur de son texte, et un
    // statut long (« GO / NO GO à décider ») déborderait sur un écran étroit.
    <span className="max-w-full shrink-0 rounded-full bg-cream-soft px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-macao-ink">
      {statut}
    </span>
  )
}
