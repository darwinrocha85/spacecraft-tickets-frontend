import { useEffect, useState } from 'react'
import Starfield from './components/Starfield'
import Header from './components/Header'
import Toast from './components/Toast'
import VenueGrid from './components/VenueGrid'
import MuseumBooking from './components/MuseumBooking'
import TheaterEventList from './components/TheaterEventList'
import TheaterBooking from './components/TheaterBooking'
import ConfirmationCard from './components/ConfirmationCard'
import MyTickets from './components/MyTickets'
import ticketsApi from './api/ticketsApi'

// Vistas dentro de cada tab: 'list' (catalogo) -> 'venue' (museo: booking directo,
// teatro: lista de funciones) -> 'event' (solo teatro: elegir funcion) -> 'confirmation'
export default function App() {
  const [activeTab, setActiveTab] = useState('museum')
  const [step, setStep] = useState('list')
  const [venues, setVenues] = useState([])
  const [loadingVenues, setLoadingVenues] = useState(true)
  const [venuesError, setVenuesError] = useState('')
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (activeTab !== 'museum' && activeTab !== 'theater') return
    let cancelled = false
    setLoadingVenues(true)
    setVenuesError('')
    ticketsApi
      .getVenues(activeTab)
      .then((data) => {
        if (!cancelled) setVenues(data)
      })
      .catch((err) => {
        if (!cancelled) setVenuesError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadingVenues(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTab])

  function goToTab(tab) {
    setActiveTab(tab)
    setStep('list')
    setSelectedVenue(null)
    setSelectedEvent(null)
    setConfirmationResult(null)
  }

  function handleSelectVenue(venue) {
    setSelectedVenue(venue)
    setStep(activeTab === 'museum' ? 'booking' : 'events')
  }

  function handleConfirm(result) {
    setConfirmationResult(result)
    setStep('confirmation')
    setToast('¡Compra confirmada!')
  }

  return (
    <div className="app-shell">
      <Starfield />
      <div className="app-content">
        <Header activeTab={activeTab} onTabChange={goToTab} />

        {activeTab === 'my-tickets' && <MyTickets />}

        {activeTab === 'museum' && (
          <>
            {step === 'list' && (
              <VenueGrid
                venues={venues}
                type="museum"
                loading={loadingVenues}
                error={venuesError}
                onSelect={handleSelectVenue}
              />
            )}
            {step === 'booking' && selectedVenue && (
              <MuseumBooking venue={selectedVenue} onBack={() => setStep('list')} onConfirm={handleConfirm} />
            )}
            {step === 'confirmation' && confirmationResult && (
              <ConfirmationCard
                result={confirmationResult}
                onBackToCatalog={() => goToTab('museum')}
                onGoToMyTickets={() => goToTab('my-tickets')}
              />
            )}
          </>
        )}

        {activeTab === 'theater' && (
          <>
            {step === 'list' && (
              <VenueGrid
                venues={venues}
                type="theater"
                loading={loadingVenues}
                error={venuesError}
                onSelect={handleSelectVenue}
              />
            )}
            {step === 'events' && selectedVenue && (
              <TheaterEventList
                venue={selectedVenue}
                onBack={() => setStep('list')}
                onSelectEvent={(ev) => {
                  setSelectedEvent(ev)
                  setStep('booking')
                }}
              />
            )}
            {step === 'booking' && selectedVenue && selectedEvent && (
              <TheaterBooking
                venue={selectedVenue}
                event={selectedEvent}
                onBack={() => setStep('events')}
                onConfirm={handleConfirm}
              />
            )}
            {step === 'confirmation' && confirmationResult && (
              <ConfirmationCard
                result={confirmationResult}
                onBackToCatalog={() => goToTab('theater')}
                onGoToMyTickets={() => goToTab('my-tickets')}
              />
            )}
          </>
        )}
      </div>
      <Toast message={toast} type="success" onClose={() => setToast('')} />
    </div>
  )
}
