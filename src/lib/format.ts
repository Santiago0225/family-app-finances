export function formatCLP(amount: number): string {
  return '$' + amount.toLocaleString('es-CL')
}

export function parseCLP(value: string): number {
  return parseInt(value.replace(/\D/g, ''), 10) || 0
}
