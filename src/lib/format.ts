export function formatCLP(amount: number): string {
  return '$' + amount.toLocaleString('es-CL')
}

export function parseCLP(value: string): number {
  return parseInt(value.replace(/\D/g, ''), 10) || 0
}

export function getTodaySantiago(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
}

export function getMonthRangeSantiago(): { primerDia: string; ultimoDia: string; label: string } {
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
  const [year, month] = dateStr.split('-').map(Number)
  const primerDia = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const ultimoDia = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return { primerDia, ultimoDia, label: `${meses[month - 1]} ${year}` }
}

export function normalizeMerchant(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  return trimmed
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
