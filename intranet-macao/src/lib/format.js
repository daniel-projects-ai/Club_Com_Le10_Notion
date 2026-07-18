// Formatages français partagés. Une valeur absente devient toujours « — ».
const formateurEuros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
})

export function formaterBudget(budget) {
  if (budget === null || budget === undefined || Number.isNaN(Number(budget))) return '—'
  return formateurEuros.format(Number(budget))
}

export function formaterDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export const ouTiret = (valeur) =>
  valeur === null || valeur === undefined || valeur === '' ? '—' : valeur
