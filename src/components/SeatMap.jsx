// Mapa de 100 asientos (10x10). occupiedSeats: array/Set de numeros ocupados.
// selected: array de numeros elegidos por el comprador (maximo lo controla el padre).
export default function SeatMap({ totalSeats = 100, occupiedSeats = [], selected, onToggle, maxSeats = 5 }) {
  const occupied = new Set(occupiedSeats)
  const selectedSet = new Set(selected)

  return (
    <div className="seat-map">
      <div className="seat-map-screen">PANTALLA / ESCENARIO</div>
      <div className="seat-grid">
        {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seat) => {
          const isOccupied = occupied.has(seat)
          const isSelected = selectedSet.has(seat)
          const disabled = isOccupied || (!isSelected && selected.length >= maxSeats)
          return (
            <button
              key={seat}
              type="button"
              className={`seat${isOccupied ? ' seat-occupied' : ''}${isSelected ? ' seat-selected' : ''}`}
              disabled={disabled}
              onClick={() => onToggle(seat)}
              title={`Asiento ${seat}${isOccupied ? ' (ocupado)' : ''}`}
            >
              {seat}
            </button>
          )
        })}
      </div>
      <div className="seat-legend">
        <span><i className="seat-swatch" /> Libre</span>
        <span><i className="seat-swatch seat-swatch-selected" /> Elegido</span>
        <span><i className="seat-swatch seat-swatch-occupied" /> Ocupado</span>
      </div>
    </div>
  )
}
