import { useRef, useState } from 'react'
import ticketsApi from '../api/ticketsApi'
import { PAY_CURRENCIES, formatEur, remainingOf } from '../constants/pricing'
import usePaymentQuote from '../hooks/usePaymentQuote'

// Fase 8: abonar el resto de una reserva parcial (status RESERVED).
// El botón de Adyen queda deshabilitado hasta integrar la pasarela real.
export default function RemainingPayment({ kind, ticket, onPaid }) {
  const [cardId, setCardId] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  // Guard síncrono anti-doble-click (igual que en los checkouts).
  const payingRef = useRef(false)

  const remaining = remainingOf(ticket)
  const quote = usePaymentQuote(remaining, currency)

  async function handlePay(e) {
    e.preventDefault()
    if (payingRef.current) return
    if (!cardId.trim()) {
      setError('Ingresa el número de tarjeta BankIn para este tramo.')
      return
    }
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Ingresa un monto mayor que cero.')
      return
    }
    payingRef.current = true
    setPaying(true)
    setError('')
    try {
      const payload = {
        cardId: cardId.trim(),
        amount: value,
        currency,
        idempotencyKey: `${ticket.confirmationCode}-${Date.now()}`,
      }
      const updated =
        kind === 'museum'
          ? await ticketsApi.payRemainingMuseumTicket(ticket.id, payload)
          : await ticketsApi.payRemainingTheaterTicket(ticket.id, payload)
      onPaid(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      payingRef.current = false
      setPaying(false)
    }
  }

  if (ticket.status !== 'RESERVED') return null

  return (
    <div className="booking-panel" style={{ marginTop: '1rem' }}>
      <p className="schedule-title">Pago parcial registrado</p>
      <p className="venue-card-meta">
        Pagado: <strong>{formatEur(ticket.paidEur)}</strong> de{' '}
        <strong>{formatEur(ticket.totalEur)}</strong> — faltan{' '}
        <strong>{formatEur(remaining)}</strong>. La entrada se confirma cuando se cubra el total.
        {quote && (
          <> En {quote.currency} faltan ≈ <strong>{Number(quote.quoted_amount).toFixed(2)} {quote.currency}</strong>{' '}
          (tasa BankIn: 1 EUR = {Number(quote.rate).toFixed(4)} {quote.currency}).</>
        )}
      </p>
      <form className="form-grid booking-form" onSubmit={handlePay}>
        <label className="field">
          <span>Número de tarjeta BankIn</span>
          <input
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            placeholder="Ej. 1234567890123456"
            inputMode="numeric"
            required
          />
        </label>
        <label className="field">
          <span>Moneda del tramo</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {PAY_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field" style={{ gridColumn: '1 / -1' }}>
          <span>Monto del tramo (se convierte a EUR)</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Ej. ${remaining}`}
            required
          />
        </label>
        {error && (
          <div className="inline-error" role="alert" style={{ gridColumn: '1 / -1' }}>
            ⚠ {error}
          </div>
        )}
        <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
          <button type="submit" className="btn btn-primary" disabled={paying}>
            {paying ? 'Cobrando tramo…' : `Pagar tramo en ${currency}`}
          </button>
          <button type="button" className="btn btn-ghost" disabled title="Integración con Adyen en proceso">
            Pagar con Adyen (próximamente)
          </button>
        </div>
      </form>
    </div>
  )
}
