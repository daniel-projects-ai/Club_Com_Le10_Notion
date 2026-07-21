// En-tête de page : le titre à gauche, les actions de niveau page à droite.
// Une seule barre par écran — les actions qui ne concernent qu'une ligne
// restent sur leur carte, sinon on ne sait plus sur quoi elles portent.
//
// Sous `sm`, la barre repasse en colonne : l'intranet se consulte au téléphone,
// et deux blocs côte à côte sur 375 px ne laissent de place ni au titre ni aux
// boutons.
export default function BarreActions({ titre, sousTitre, children }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {/* break-words : un nom de collectivité tient rarement sur 375 px, et
            sans césure il pousserait toute la page vers la droite. */}
        <h1 className="font-serif text-2xl text-macao-ink break-words sm:text-3xl">{titre}</h1>
        {sousTitre && <p className="mt-1 text-sm text-macao-ink/60 break-words">{sousTitre}</p>}
      </div>

      {/* Rien à afficher plutôt qu'un conteneur vide : sans ce test, la grille
          garderait une gouttière pour des actions inexistantes. */}
      {children ? (
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0 sm:justify-end">
          {children}
        </div>
      ) : null}
    </header>
  )
}
