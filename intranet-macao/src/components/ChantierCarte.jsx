// Un des trois chantiers d'un dossier (mémoire, offre, dépôt), avec son état
// modifiable. En lecture seule quand onChanger n'est pas fourni.
export default function ChantierCarte({ titre, valeur, options, couleur, onChanger, enCours }) {
  const listeOptions = Array.isArray(options) ? options : []

  return (
    <div className="bg-white rounded-xl p-5 border-t-4" style={{ borderTopColor: couleur }}>
      <p className="text-xs text-macao-ink/60 mb-2">{titre}</p>
      {onChanger ? (
        <select
          value={valeur || ''}
          disabled={enCours}
          onChange={(e) => onChanger(e.target.value)}
          className="w-full bg-transparent font-serif text-lg text-macao-ink border border-macao-ink/15 rounded-lg px-3 py-2 disabled:opacity-50"
        >
          {/* Un dossier sans valeur ne doit pas afficher par défaut la première
              option : sans cette entrée vide, React sélectionnerait l'option 1
              visuellement alors que rien n'a été choisi. */}
          {!valeur && <option value="">—</option>}
          {listeOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <p className="font-serif text-lg text-macao-ink">{valeur || '—'}</p>
      )}
    </div>
  )
}
