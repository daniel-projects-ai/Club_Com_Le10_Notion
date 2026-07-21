// Section repliable, bâtie sur <details>/<summary> natifs : le clavier, le
// lecteur d'écran et la recherche du navigateur les gèrent déjà, aucun état
// React ni aria-expanded à tenir à jour.
//
// Le compteur s'affiche entre parenthèses dans le titre : on doit savoir ce que
// contient une section repliée sans avoir à l'ouvrir. `null` (ou l'absence de
// compteur) laisse le titre nu — un zéro reste affiché, c'est une information.
export default function SectionRepliable({ titre, compteur = null, ouvertParDefaut = false, children }) {
  const afficheCompteur = compteur !== null && compteur !== undefined

  return (
    // `open` n'est posé qu'au montage : React ne le réapplique pas tant que la
    // prop ne change pas, donc l'ouverture faite à la main survit aux rendus.
    <details open={ouvertParDefaut} className="group mb-6 rounded-xl bg-white">
      <summary
        className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-6 [&::-webkit-details-marker]:hidden"
      >
        <span
          aria-hidden="true"
          className="text-sm text-macao-teal transition-transform group-open:rotate-90"
        >
          ▶
        </span>
        <h2 className="font-serif text-xl text-macao-ink">
          {titre}
          {afficheCompteur && <span className="text-macao-ink/55"> ({compteur})</span>}
        </h2>
      </summary>

      {/* pt-0 : le padding du summary tient déjà l'écart avec le titre. */}
      <div className="px-6 pb-6 pt-0">{children}</div>
    </details>
  )
}
