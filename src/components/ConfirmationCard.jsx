import { formatMoney } from '../constants/pricing'

export default function ConfirmationCard({ result, onBackToCatalog, onGoToMyTickets }) {
  const { type, ticket, venue, event } = result

  return (
    <div className="booking-panel confirmation-panel">
      <div className="confirmation-icon" aria-hidden="true">✅</div>
      <h2 className="booking-title">¡Compra confirmada!</h2>
      <p className="confirmation-code">{ticket.confirmationCode}</p>

      <div className="confirmation-details">
        <p><strong>Nave:</strong> {venue.name}</p>
        {type === 'museum' ? (
          <>
            <p><strong>Fecha:</strong> {ticket.visitDate}</p>
            <p><strong>Hora:</strong> {ticket.visitTime?.slice(0, 5)}</p>
            <p><strong>Cupos:</strong> {ticket.quantity}</p>
          </>
        ) : (
          <>
            <p><strong>Función:</strong> {ticket.functionDate} {event?.time?.slice(0, 5)}</p>
            <p><strong>Asientos:</strong> {ticket.seats?.slice().sort((a, b) => a - b).join(', ')}</p>
          </>
        )}
        <p><strong>Comprador:</strong> {ticket.buyerName} ({ticket.buyerEmail})</p>
        <p>
          <strong>Cobrado con BankIn:</strong> {formatMoney(ticket.amountCharged)}
          {ticket.bankinTransactionId ? ` · transacción #${ticket.bankinTransactionId}` : ''}
        </p>
      </div>

      <p className="venue-card-meta">
        Te enviamos un email de confirmación. El cobro fue procesado por BankIn (entorno demo) — esta
        entrada sigue sin tener validez legal, pero el pago sí se registró de verdad en ese entorno de pruebas.
      </p>

      <div className="modal-actions confirmation-actions">
        <button className="btn btn-ghost" onClick={onBackToCatalog}>
          Volver al catálogo
        </button>
        <button className="btn btn-primary" onClick={onGoToMyTickets}>
          Ver en Mis entradas
        </button>
      </div>
    </div>
  )
}
