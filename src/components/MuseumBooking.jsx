import { useEffect, useRef, useState } from 'react'
import ticketsApi from '../api/ticketsApi'
import { windowDays, formatDayLabel } from '../utils/dates'
import { ticketPriceFor, formatMoney, formatEur, BASE_CURRENCY, PAY_CURRENCIES } from '../constants/pricing'
import RemainingPayment from './RemainingPayment'
import usePaymentQuote from '../hooks/usePaymentQuote'

const DAYS = windowDays()

export default function MuseumBooking({ venue, onBack, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState(DAYS[0])
  const [availability, setAvailability] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  const [availabilityError, setAvailabilityError] = useState('')
  const [selectedTime, setSelectedTime] = useState(null)
  const [quantity, setQuantity] = useState(1)
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
  const total = unitPrice * quantity
  const quote = usePaymentQuote(total, currency)

  useEffect(() => {
    let cancelled = false
    setLoadingAvailability(true)
    setAvailabilityError('')
    setSelectedTime(null)
    ticketsApi
      .getMuseumAvailability(venue.id, selectedDate)
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
  }, [venue.id, selectedDate])

  const selectedSlot = availability.find((s) => s.time === selectedTime)
  const maxQuantity = selectedSlot ? Math.min(10, selectedSlot.available) : 10

  async function handleSubmit(e) {
    e.preventDefault()
    if (submittingRef.current) return
    if (!selectedTime) {
      setSubmitError('Elige un horario disponible.')
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
        spacecraftId: venue.id,
        visitDate: selectedDate,
        visitTime: selectedTime,
        quantity,
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
      const ticket = await ticketsApi.purchaseMuseumTicket(payload)
      if (ticket.status === 'RESERVED') {
        setReservedTicket(ticket)
      } else {
        onConfirm({ type: 'museum', ticket, venue })
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
        ← Volver al catálogo
      </button>
      <h2 className="booking-title">
        🏛 {venue.name} <span className="venue-card-meta">· {venue.franchise}</span>
      </h2>

      <p className="schedule-title">Elige un día</p>
      <div className="day-picker">
        {DAYS.map((day) => (
          <button
            key={day}
            className={`day-chip${day === selectedDate ? ' day-chip-active' : ''}`}
            onClick={() => setSelectedDate(day)}
          >
            {formatDayLabel(day)}
          </button>
        ))}
      </div>

      <p className="schedule-title">Turnos disponibles</p>
      {loadingAvailability && (
        <div className="table-state table-state-inline">
          <div className="spinner" />
        </div>
      )}
      {!loadingAvailability && availabilityError && <div className="inline-error">{availabilityError}</div>}
      {!loadingAvailability && !availabilityError && availability.length === 0 && (
        <p className="venue-card-meta">La nave está cerrada ese día — no hay horario de museo definido.</p>
      )}
      {!loadingAvailability && availability.length > 0 && (
        <div className="slot-grid">
          {availability.map((slot) => (
            <button
              key={slot.time}
              className={`slot-chip${slot.time === selectedTime ? ' slot-chip-active' : ''}${
                slot.available === 0 ? ' slot-chip-full' : ''
              }`}
              disabled={slot.available === 0}
              onClick={() => {
                setSelectedTime(slot.time)
                setQuantity(1)
              }}
            >
              <span className="slot-time">{slot.time.slice(0, 5)}</span>
              <span className="slot-avail">{slot.available === 0 ? 'Agotado' : `${slot.available} cupos`}</span>
            </button>
          ))}
        </div>
      )}

      {selectedTime && (
        <form className="form-grid booking-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Cantidad de cupos (máx. {maxQuantity})</span>
            <div className="stepper">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}>
                +
              </button>
            </div>
          </label>
          <label className="field">
            <span>Nombre del comprador</span>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
          </label>
          <label className="field">
            <span>Email del comprador</span>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              required
            />
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
            Precio base: <strong>{formatEur(total)} {BASE_CURRENCY}</strong> ({formatMoney(unitPrice)} × {quantity}).
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Cobrando…' : `Pagar y reservar ${quantity} cupo${quantity === 1 ? '' : 's'}`}
            </button>
            <button type="button" className="btn btn-ghost" disabled title="Integración con Adyen en proceso">
              Pagar con Adyen (próximamente)
            </button>
          </div>
        </form>
      )}

      {reservedTicket && (
        <RemainingPayment
          kind="museum"
          ticket={reservedTicket}
          onPaid={(updated) => {
            if (updated.status === 'ACTIVE') {
              onConfirm({ type: 'museum', ticket: updated, venue })
            } else {
              setReservedTicket(updated)
            }
          }}
        />
      )}
    </div>
  )
}
