// Demandées vs fournies. Ce qui manque est mis en évidence : c'est
// l'information qui fait rater un dépôt.
export default function PiecesChecklist({ demandees, fournies, onBasculer }) {
  // Le serveur peut renvoyer null (et non un tableau vide) sur ces champs :
  // les valeurs par défaut de déstructuration ne suffisent donc pas.
  const listeDemandees = Array.isArray(demandees) ? demandees : []
  const listeFournies = Array.isArray(fournies) ? fournies : []

  if (!listeDemandees.length) {
    return <p className="text-macao-ink/50 text-sm">Aucune pièce demandée renseignée.</p>
  }

  return (
    <ul className="space-y-2">
      {listeDemandees.map(piece => {
        const fournie = listeFournies.includes(piece)
        return (
          <li key={piece} className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBasculer ? () => onBasculer(piece) : undefined}
              disabled={!onBasculer}
              className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 ${
                fournie
                  ? 'bg-macao-teal border-macao-teal text-white'
                  : 'border-macao-terra bg-white'
              } ${onBasculer ? 'cursor-pointer' : 'cursor-default'}`}
              aria-label={fournie ? `${piece} fournie` : `${piece} manquante`}
            >
              {fournie ? '✓' : ''}
            </button>
            <span className={fournie ? 'text-macao-ink/70' : 'text-macao-terra font-semibold'}>
              {piece}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
