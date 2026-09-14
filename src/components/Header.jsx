const TABS = [
  { id: 'museum', label: '🏛 Museo' },
  { id: 'theater', label: '🎭 Teatro' },
  { id: 'my-tickets', label: '🎟 Mis entradas' },
]

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon" aria-hidden="true">🎟️</span>
        <div>
          <h1>Spacecraft Tickets</h1>
          <p className="brand-subtitle">Reserva tu cupo al museo o compra entradas para las funciones de teatro</p>
        </div>
      </div>
      <nav className="tab-nav" aria-label="Secciones">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button${activeTab === tab.id ? ' tab-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
