// Demandées vs fournies. Ce qui manque est mis en évidence : c'est
// l'information qui fait rater un dépôt.
export default function PiecesChecklist({ demandees, fournies, onBasculer, enCours = false }) {
  // Le serveur peut renvoyer null (et non un tableau vide) sur ces champs :
  // les valeurs par défaut de déstructuration ne suffisent donc pas.
  const listeDemandees = Array.isArray(demandees) ? demandees : []
  const listeFournies = Array.isArray(fournies) ? fournies : []
  // Interactif seulement si un gestionnaire est fourni ET qu'aucun enregistrement
  // n'est en cours : sans cela, les clics ignorés pendant l'envoi restent invisibles.
  const interactif = Boolean(onBasculer) && !enCours

  if (!listeDemandees.length) {
    return <p className="text-macao-ink/50 text-sm">Aucune pièce demandée renseignée.</p>
  }

  return (
    <ul className={`space-y-2 ${onBasculer && enCours ? 'opacity-50' : ''}`}>
      {listeDemandees.map(piece => {
        const fournie = listeFournies.includes(piece)
        return (
          <li key={piece} className="flex items-center">
            {/* La case reste visuellement à 20 px, mais la zone cliquable fait
                44 px : au doigt, cocher une pièce ne doit pas se viser.
                Les marges négatives absorbent ce débord pour que la case reste
                alignée sur le bord du bloc et que la ligne ne s'étire pas. */}
            <button
              type="button"
              onClick={interactif ? () => onBasculer(piece) : undefined}
              disabled={!interactif}
              className={`-my-2 -ml-3 flex h-11 w-11 shrink-0 items-center justify-center ${
                interactif ? 'cursor-pointer' : 'cursor-default'
              }`}
              aria-label={fournie ? `${piece} fournie` : `${piece} manquante`}
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                  fournie
                    ? 'bg-macao-teal border-macao-teal text-white'
                    : 'border-macao-terra bg-white'
                }`}
              >
                {fournie ? '✓' : ''}
              </span>
            </button>
            <span className={`min-w-0 break-words ${fournie ? 'text-macao-ink/70' : 'text-macao-terra font-semibold'}`}>
              {piece}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
