import { useEffect, useState } from 'react'
import ticketsApi from '../api/ticketsApi'
import SeatMap from './SeatMap'
import { isoRange, formatDayLabel } from '../utils/dates'
import { ticketPriceFor, formatMoney } from '../constants/pricing'

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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const unitPrice = ticketPriceFor(venue)
  const total = unitPrice * selectedSeats.length

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
    if (selectedSeats.length === 0) {
      setSubmitError('Elige al menos un asiento.')
      return
    }
    if (!cardId.trim()) {
      setSubmitError('Ingresa el número de tarjeta BankIn para pagar la entrada.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const ticket = await ticketsApi.purchaseTheaterTicket({
        eventId: event.id,
        functionDate: selectedDate,
        seats: selectedSeats,
        buyerName,
        buyerEmail,
        cardId: cardId.trim(),
      })
      onConfirm({ type: 'theater', ticket, venue, event })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
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

            <p className="venue-card-meta" style={{ gridColumn: '1 / -1' }}>
              Total a cobrar con BankIn: <strong>{formatMoney(total)}</strong> ({formatMoney(unitPrice)} × {selectedSeats.length || 0})
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
            </div>
          </form>
        </>
      )}
    </div>
  )
}
