import { useEffect, useState } from 'react'
import ticketsApi from '../api/ticketsApi'
import { windowDays, formatDayLabel } from '../utils/dates'
import { ticketPriceFor, formatMoney } from '../constants/pricing'

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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const unitPrice = ticketPriceFor(venue)
  const total = unitPrice * quantity

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
    if (!selectedTime) {
      setSubmitError('Elige un horario disponible.')
      return
    }
    if (!cardId.trim()) {
      setSubmitError('Ingresa el número de tarjeta BankIn para pagar la entrada.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const ticket = await ticketsApi.purchaseMuseumTicket({
        spacecraftId: venue.id,
        visitDate: selectedDate,
        visitTime: selectedTime,
        quantity,
        buyerName,
        buyerEmail,
        cardId: cardId.trim(),
      })
      onConfirm({ type: 'museum', ticket, venue })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
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

          <p className="venue-card-meta" style={{ gridColumn: '1 / -1' }}>
            Total a cobrar con BankIn: <strong>{formatMoney(total)}</strong> ({formatMoney(unitPrice)} × {quantity})
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
          </div>
        </form>
      )}
    </div>
  )
}
