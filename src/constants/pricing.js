// Precio por defecto cuando la nave no tiene `ticketPrice` configurado en el admin.
// Debe coincidir con BankInPaymentService.DEFAULT_TICKET_PRICE en el backend.
export const DEFAULT_TICKET_PRICE = 25.0

export function ticketPriceFor(venue) {
  return venue?.ticketPrice ?? DEFAULT_TICKET_PRICE
}

export function formatMoney(amount) {
  if (amount === null || amount === undefined) return '—'
  return `$${Number(amount).toFixed(2)}`
}
