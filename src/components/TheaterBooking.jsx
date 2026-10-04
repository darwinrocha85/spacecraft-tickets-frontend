import { useEffect, useRef, useState } from 'react'
import ticketsApi from '../api/ticketsApi'
import SeatMap from './SeatMap'
import { isoRange, formatDayLabel } from '../utils/dates'
import { ticketPriceFor, formatMoney, formatEur, BASE_CURRENCY, PAY_CURRENCIES } from '../constants/pricing'
import RemainingPayment from './RemainingPayment'
import usePaymentQuote from '../hooks/usePaymentQuote'

export default function TheaterBooking({ venue, event, onBack, onConfirm }) {
  const functionDates = isoRange(event.startDate, event.endDate)
  const [selectedDate, setSelectedDate] = useState(functionDates[0])
  const [availability, setAvailability] = useState(null)
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  const [availabilityError, setAvailabilityError] = useState('')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [cardId, setCardId] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [payAmount, setPayAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [reservedTicket, setReservedTicket] = useState(null)
  // Guard síncrono anti-doble-click: setSubmitting es async y dos clicks
  // rápidos entrarían dos veces (doble cobro). El ref bloquea en el acto.
  const submittingRef = useRef(false)

  const unitPrice = ticketPriceFor(venue)
  const total = unitPrice * selectedSeats.length
  const quote = usePaymentQuote(total, currency)

  useEffect(() => {
    let cancelled = false
    setLoadingAvailability(true)
    setAvailabilityError('')
    setSelectedSeats([])
    ticketsApi
      .getTheaterAvailability(event.id, selectedDate)
      .then((data) => {
        if (!cancelled) setAvailability(data)
      })
      .catch((err) => {
        if (!cancelled) setAvailabilityError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false)
      })
    return () => {
      cancelled = true
    }
  }, [event.id, selectedDate])

  function toggleSeat(seat) {
    setSelectedSeats((current) =>
      current.includes(seat) ? current.filter((s) => s !== seat) : [...current, seat]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submittingRef.current) return
    if (selectedSeats.length === 0) {
      setSubmitError('Elige al menos un asiento.')
      return
    }
    if (!cardId.trim()) {
      setSubmitError('Ingresa el número de tarjeta BankIn para pagar la entrada.')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        eventId: event.id,
        functionDate: selectedDate,
        seats: selectedSeats,
        buyerName,
        buyerEmail,
        cardId: cardId.trim(),
        paymentCurrency: currency,
        idempotencyKey: `${buyerEmail.trim()}-${Date.now()}`,
      }
      const firstPay = Number(payAmount)
      if (payAmount !== '' && Number.isFinite(firstPay) && firstPay > 0) {
        payload.payAmount = firstPay
      }
      const ticket = await ticketsApi.purchaseTheaterTicket(payload)
      if (ticket.status === 'RESERVED') {
        setReservedTicket(ticket)
      } else {
        onConfirm({ type: 'theater', ticket, venue, event })
      }
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="booking-panel">
      <button className="btn btn-ghost btn-back" onClick={onBack}>
        ← Volver a las funciones
      </button>
      <h2 className="booking-title">
        🎭 {venue.name} <span className="venue-card-meta">· función a las {event.time.slice(0, 5)}</span>
      </h2>

      <p className="schedule-title">Elige la función (día)</p>
      <div className="day-picker">
        {functionDates.map((day) => (
          <button
            key={day}
            className={`day-chip${day === selectedDate ? ' day-chip-active' : ''}`}
            onClick={() => setSelectedDate(day)}
          >
            {formatDayLabel(day)}
          </button>
        ))}
      </div>

      {loadingAvailability && (
        <div className="table-state table-state-inline">
          <div className="spinner" />
        </div>
      )}
      {!loadingAvailability && availabilityError && <div className="inline-error">{availabilityError}</div>}
      {!loadingAvailability && availability && (
        <>
          <SeatMap
            totalSeats={availability.totalSeats}
            occupiedSeats={availability.occupiedSeats}
            selected={selectedSeats}
            onToggle={toggleSeat}
            maxSeats={5}
          />

          <form className="form-grid booking-form" onSubmit={handleSubmit}>
            <p className="venue-card-meta" style={{ gridColumn: '1 / -1' }}>
              Asientos elegidos: {selectedSeats.length ? selectedSeats.sort((a, b) => a - b).join(', ') : 'ninguno'} (máx. 5)
            </p>
            <label className="field">
              <span>Nombre del comprador</span>
              <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
            </label>
            <label className="field">
              <span>Email del comprador</span>
              <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required />
            </label>
            <label className="field" style={{ gridColumn: '1 / -1' }}>
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
              <span>Moneda del pago</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {PAY_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Primer pago (vacío = total)</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={`${total.toFixed(2)}`}
              />
            </label>

            <p className="venue-card-meta" style={{ gridColumn: '1 / -1' }}>
              Precio base: <strong>{formatEur(total)} {BASE_CURRENCY}</strong> ({formatMoney(unitPrice)} × {selectedSeats.length || 0}).
              Puedes pagar en partes y en varias monedas: la entrada se confirma al cubrir el total.
              {quote && (
                <> Faltan ≈ <strong>{Number(quote.quoted_amount).toFixed(2)} {quote.currency}</strong> para
                completar el pago (tasa BankIn: 1 EUR = {Number(quote.rate).toFixed(4)} {quote.currency}).</>
              )}
            </p>

            {submitError && (
              <div className="inline-error" role="alert" style={{ gridColumn: '1 / -1' }}>
                ⚠ {submitError}
              </div>
            )}

            <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || selectedSeats.length === 0}>
                {submitting ? 'Cobrando…' : `Pagar ${selectedSeats.length || ''} entrada${selectedSeats.length === 1 ? '' : 's'}`}
              </button>
              <button type="button" className="btn btn-ghost" disabled title="Integración con Adyen en proceso">
                Pagar con Adyen (próximamente)
              </button>
            </div>
          </form>

          {reservedTicket && (
            <RemainingPayment
              kind="theater"
              ticket={reservedTicket}
              onPaid={(updated) => {
                if (updated.status === 'ACTIVE') {
                  onConfirm({ type: 'theater', ticket: updated, venue, event })
                } else {
                  setReservedTicket(updated)
                }
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
