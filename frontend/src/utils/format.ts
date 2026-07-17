export function formatCurrency(amount: number, currency = 'NPR'): string {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-NP').format(value)
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}
