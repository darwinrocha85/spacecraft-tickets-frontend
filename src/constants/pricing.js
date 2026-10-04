// Precio por defecto cuando la nave no tiene `ticketPrice` configurado en el admin.
// Debe coincidir con BankInPaymentService.DEFAULT_TICKET_PRICE en el backend.
// Fase 8: el precio base siempre es EUR (el backend crea la orden en EUR).
export const DEFAULT_TICKET_PRICE = 25.0
export const BASE_CURRENCY = 'EUR'
export const PAY_CURRENCIES = ['EUR', 'USD', 'COP']

export function ticketPriceFor(venue) {
  return venue?.ticketPrice ?? DEFAULT_TICKET_PRICE
}

export function formatMoney(amount) {
  if (amount === null || amount === undefined) return '—'
  return `$${Number(amount).toFixed(2)}`
}

export function formatEur(amount) {
  if (amount === null || amount === undefined) return '—'
  return `€${Number(amount).toFixed(2)}`
}

export function remainingOf(ticket) {
  if (ticket == null) return null
  const total = ticket.totalEur ?? ticket.amountCharged ?? null
  const paid = ticket.paidEur ?? ticket.amountCharged ?? 0
  if (total == null) return null
  return Math.max(0, Math.round((total - paid) * 100) / 100)
}
