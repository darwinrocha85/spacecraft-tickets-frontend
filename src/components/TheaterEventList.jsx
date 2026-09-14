import { useEffect, useState } from 'react'
import ticketsApi from '../api/ticketsApi'

const TYPE_LABELS = { MUSICA: '🎵 Música', ARTES: '🎨 Artes', LIBRE: '✨ Libre' }

export default function TheaterEventList({ venue, onBack, onSelectEvent }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ticketsApi
      .listTheaterEvents(venue.id)
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [venue.id])

  return (
    <div className="booking-panel">
      <button className="btn btn-ghost btn-back" onClick={onBack}>
        ← Volver al catálogo
      </button>
      <h2 className="booking-title">
        🎭 {venue.name} <span className="venue-card-meta">· {venue.franchise}</span>
      </h2>

      {loading && (
        <div className="table-state">
          <div className="spinner" />
        </div>
      )}
      {!loading && error && <div className="inline-error">{error}</div>}
      {!loading && !error && events.length === 0 && (
        <div className="table-state">
          <p className="empty-icon" aria-hidden="true">🎭</p>
          <p>Esta nave todavía no tiene funciones programadas.</p>
        </div>
      )}
      {!loading && events.length > 0 && (
        <div className="event-list">
          {events.map((ev) => (
            <button key={ev.id} className="event-card" onClick={() => onSelectEvent(ev)}>
              <span className="event-type-badge">{TYPE_LABELS[ev.eventType] || ev.eventType}</span>
              <p className="event-dates">
                {ev.startDate} → {ev.endDate}
              </p>
              <p className="event-time">Función diaria a las {ev.time.slice(0, 5)}</p>
              <span className="venue-card-cta">Elegir función →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
