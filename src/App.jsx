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

  // Deep-link desde el landing de marketing (spacecraft-events-landing): al hacer click
  // en un museo o una funcion de teatro, llega ?type=museum&venue=<id> o
  // ?type=theater&venue=<id>&event=<id> y saltamos directo al flujo de compra de ese
  // recinto/evento en vez del catalogo general. Tambien soporta ?tab=my-tickets para el
  // link de "¿Ya compraste?" del landing.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    const venueId = params.get('venue')
    const eventId = params.get('event')
    const tab = params.get('tab')

    if (!type && tab === 'my-tickets') {
      setActiveTab('my-tickets')
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    if (!type || !venueId) return

    let cancelled = false

    if (type === 'museum') {
      ticketsApi
        .getSpacecraft(venueId)
        .then((venue) => {
          if (cancelled) return
          setActiveTab('museum')
          setSelectedVenue(venue)
          setStep('booking')
          window.history.replaceState(null, '', window.location.pathname)
        })
        .catch(() => {
          if (!cancelled) setToast('No se pudo abrir ese museo desde el enlace, mostrando el catálogo.')
        })
    } else if (type === 'theater' && eventId) {
      ticketsApi
        .getTheaterEvent(eventId)
        .then(async (event) => {
          const venue = await ticketsApi.getSpacecraft(event.spacecraftId)
          if (cancelled) return
          setActiveTab('theater')
          setSelectedVenue(venue)
          setSelectedEvent(event)
          setStep('booking')
          window.history.replaceState(null, '', window.location.pathname)
        })
        .catch(() => {
          if (!cancelled) setToast('No se pudo abrir esa función desde el enlace, mostrando el catálogo.')
        })
    }

    return () => {
      cancelled = true
    }
    // Solo al montar: el deep-link se resuelve una vez, con los query params iniciales.
  }, [])

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
