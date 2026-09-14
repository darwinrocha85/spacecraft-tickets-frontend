// Catalogo de naves habilitadas como museo o teatro (type = 'museum' | 'theater')
export default function VenueGrid({ venues, type, loading, error, onSelect }) {
  if (loading) {
    return (
      <div className="table-state">
        <div className="spinner" />
        <p>Escaneando naves disponibles…</p>
      </div>
    )
  }

  if (error) {
    return <div className="inline-error">{error}</div>
  }

  if (!venues.length) {
    return (
      <div className="table-state">
        <p className="empty-icon" aria-hidden="true">🛰️</p>
        <p>Todavia no hay naves habilitadas como {type === 'museum' ? 'museo' : 'teatro'}.</p>
      </div>
    )
  }

  return (
    <div className="venue-grid">
      {venues.map((v) => (
        <button key={v.id} className="venue-card" onClick={() => onSelect(v)}>
          <div className="venue-card-icon" aria-hidden="true">{type === 'museum' ? '🏛' : '🎭'}</div>
          <h3>{v.name}</h3>
          <p className="franchise-badge">{v.franchise}</p>
          {type === 'museum' && (
            <p className="venue-card-meta">Capacidad: {v.museumCapacity} personas/turno</p>
          )}
          <span className="venue-card-cta">Ver disponibilidad →</span>
        </button>
      ))}
    </div>
  )
}
