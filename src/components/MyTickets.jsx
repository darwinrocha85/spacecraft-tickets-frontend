import { useState } from 'react'
import ticketsApi from '../api/ticketsApi'
import { windowDays, formatDayLabel } from '../utils/dates'

const DAYS = windowDays()

export default function MyTickets() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { kind: 'museum'|'theater', ticket, venue, event }
  const [actionMessage, setActionMessage] = useState('')

  // estado del panel de reprogramar (solo museo)
  const [rescheduling, setRescheduling] = useState(false)
  const [newDate, setNewDate] = useState(DAYS[0])
  const [newAvailability, setNewAvailability] = useState([])
  const [loadingNewAvailability, setLoadingNewAvailability] = useState(false)
  const [newTime, setNewTime] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setResult(null)
    setActionMessage('')
    setRescheduling(false)

    try {
      if (trimmed.startsWith('THT')) {
        const ticket = await ticketsApi.searchTheaterTicket(trimmed)
        const event = await ticketsApi.getTheaterEvent(ticket.eventId)
        const venue = await ticketsApi.getSpacecraft(event.spacecraftId)
        setResult({ kind: 'theater', ticket, venue, event })
      } else {
        const ticket = await ticketsApi.searchMuseumTicket(trimmed)
        const venue = await ticketsApi.getSpacecraft(ticket.spacecraftId)
        setResult({ kind: 'museum', ticket, venue })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!result) return
    setLoading(true)
    setError('')
    try {
      if (result.kind === 'museum') {
        const ticket = await ticketsApi.cancelMuseumTicket(result.ticket.id)
        setResult({ ...result, ticket })
      } else {
        const ticket = await ticketsApi.cancelTheaterTicket(result.ticket.id)
        setResult({ ...result, ticket })
      }
      setActionMessage('Entrada cancelada. El cupo/asiento quedó liberado.')
      setRescheduling(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function openReschedule() {
    setRescheduling(true)
    setNewTime(null)
    await loadNewAvailability(newDate)
  }

  async function loadNewAvailability(date) {
    setLoadingNewAvailability(true)
    try {
      const data = await ticketsApi.getMuseumAvailability(result.venue.id, date)
      setNewAvailability(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingNewAvailability(false)
    }
  }

  async function handleConfirmReschedule() {
    if (!newTime) return
    setLoading(true)
    setError('')
    try {
      const ticket = await ticketsApi.rescheduleMuseumTicket(result.ticket.id, newDate, newTime)
      setResult({ ...result, ticket })
      setActionMessage('Entrada reprogramada correctamente.')
      setRescheduling(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="booking-panel">
      <h2 className="booking-title">🎟 Mis entradas</h2>
      <form className="search-code-form" onSubmit={handleSearch}>
        <input
          placeholder="Código de confirmación (ej. MUS-A1B2C3D4)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          Buscar
        </button>
      </form>

      {loading && !result && (
        <div className="table-state table-state-inline">
          <div className="spinner" />
        </div>
      )}
      {error && <div className="inline-error">{error}</div>}
      {actionMessage && <p className="venue-card-meta">{actionMessage}</p>}

      {result && (
        <div className="ticket-detail-card">
          <span className={`franchise-badge ${result.ticket.status === 'ACTIVE' ? '' : 'ticket-cancelled-badge'}`}>
            {result.ticket.status === 'ACTIVE' ? 'Activa' : 'Cancelada'}
          </span>
          <p className="confirmation-code">{result.ticket.confirmationCode}</p>
          <p><strong>Nave:</strong> {result.venue.name}</p>

          {result.kind === 'museum' ? (
            <>
              <p><strong>Fecha:</strong> {result.ticket.visitDate}</p>
              <p><strong>Hora:</strong> {result.ticket.visitTime?.slice(0, 5)}</p>
              <p><strong>Cupos:</strong> {result.ticket.quantity}</p>
            </>
          ) : (
            <>
              <p><strong>Función:</strong> {result.ticket.functionDate} {result.event?.time?.slice(0, 5)}</p>
              <p><strong>Asientos:</strong> {result.ticket.seats?.slice().sort((a, b) => a - b).join(', ')}</p>
            </>
          )}
          <p><strong>Comprador:</strong> {result.ticket.buyerName} ({result.ticket.buyerEmail})</p>

          {result.ticket.status === 'ACTIVE' && (
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleCancel} disabled={loading}>
                Cancelar entrada
              </button>
              {result.kind === 'museum' && (
                <button className="btn btn-ghost" onClick={openReschedule} disabled={loading}>
                  Reprogramar
                </button>
              )}
            </div>
          )}

          {rescheduling && (
            <div className="reschedule-panel">
              <p className="schedule-title">Nuevo día</p>
              <div className="day-picker">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    className={`day-chip${day === newDate ? ' day-chip-active' : ''}`}
                    onClick={() => {
                      setNewDate(day)
                      setNewTime(null)
                      loadNewAvailability(day)
                    }}
                  >
                    {formatDayLabel(day)}
                  </button>
                ))}
              </div>

              {loadingNewAvailability ? (
                <div className="table-state table-state-inline">
                  <div className="spinner" />
                </div>
              ) : (
                <div className="slot-grid">
                  {newAvailability.map((slot) => (
                    <button
                      key={slot.time}
                      className={`slot-chip${slot.time === newTime ? ' slot-chip-active' : ''}${
                        slot.available < result.ticket.quantity ? ' slot-chip-full' : ''
                      }`}
                      disabled={slot.available < result.ticket.quantity}
                      onClick={() => setNewTime(slot.time)}
                    >
                      <span className="slot-time">{slot.time.slice(0, 5)}</span>
                      <span className="slot-avail">{slot.available} cupos</span>
                    </button>
                  ))}
                  {newAvailability.length === 0 && (
                    <p className="venue-card-meta">Nave cerrada ese día.</p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setRescheduling(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleConfirmReschedule} disabled={!newTime || loading}>
                  Confirmar nuevo horario
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
