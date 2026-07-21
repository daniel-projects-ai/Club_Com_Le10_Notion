import { formaterDate } from '../lib/format'

// Journal chronologique d'une organisation. Le backend renvoie déjà la liste
// triée du plus récent au plus ancien : on ne retrie pas.
export default function JournalEchange({ interactions }) {
  const liste = Array.isArray(interactions) ? interactions : []

  if (!liste.length) {
    return <p className="text-macao-ink/50 text-sm">Aucun échange journalisé.</p>
  }

  return (
    <ul className="space-y-3">
      {liste.map((it) => (
        <li key={it.id} className="bg-white rounded-xl p-4 border-l-4 border-macao-teal">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-macao-ink/60">
            <span className="font-semibold text-macao-ink">{formaterDate(it.date)}</span>
            <span>{it.canal || '—'}</span>
            <span>{it.sens || '—'}</span>
            <span>{it.auteur || '—'}</span>
            {it.assisteeIA && (
              <span className="text-macao-ink/40 uppercase tracking-[0.14em]">assistée IA</span>
            )}
          </div>
          {it.compteRendu && (
            <p className="mt-2 text-sm text-macao-ink whitespace-pre-wrap break-words">{it.compteRendu}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
