import axios from 'axios'

// Base URL configurable por variable de entorno (ver .env.example), pero el propio
// modo de Vite ya distingue el entorno sin depender de que exista un .env: en `npm run dev`
// (import.meta.env.DEV) usa el backend local, en `npm run build` (producción) usa Render.
// Un VITE_API_URL explícito (.env.local, variable de entorno en CI, etc.) siempre gana.
const DEFAULT_API_URL = import.meta.env.DEV
  ? 'http://localhost:8080/api'
  : 'https://spacecraftsystem.onrender.com/api'
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Normaliza los errores de axios/backend a un mensaje legible,
// reutilizando el "message" que devuelve GlobalExceptionHandler cuando existe.
function toFriendlyError(error) {
  if (error.response) {
    const backendMessage = error.response.data?.message
    const err = new Error(backendMessage || `Error ${error.response.status} del servidor`)
    err.status = error.response.status
    return err
  }
  if (error.request) {
    return new Error(
      'No se pudo contactar al backend. ¿Está corriendo en ' + API_URL + '?'
    )
  }
  return error
}

export const ticketsApi = {
  // Naves habilitadas como museo y/o teatro
  async getVenues(type) {
    try {
      const { data } = await client.get('/spacecrafts/venues', { params: type ? { type } : {} })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getSpacecraft(id) {
    try {
      const { data } = await client.get(`/spacecrafts/${id}`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  // ---- Museo ----

  async getMuseumAvailability(spacecraftId, date) {
    try {
      const { data } = await client.get(`/museum/${spacecraftId}/availability`, { params: { date } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async purchaseMuseumTicket(payload) {
    try {
      const { data } = await client.post('/museum-tickets', payload)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async cancelMuseumTicket(id) {
    try {
      const { data } = await client.patch(`/museum-tickets/${id}/cancel`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async rescheduleMuseumTicket(id, visitDate, visitTime) {
    try {
      const { data } = await client.patch(`/museum-tickets/${id}/reschedule`, null, {
        params: { visitDate, visitTime },
      })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async searchMuseumTicket(code) {
    try {
      const { data } = await client.get('/museum-tickets/search', { params: { code } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  // ---- Teatro ----

  async listTheaterEvents(spacecraftId) {
    try {
      const { data } = await client.get('/theater-events', { params: { spacecraftId } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getTheaterEvent(id) {
    try {
      const { data } = await client.get(`/theater-events/${id}`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async getTheaterAvailability(eventId, date) {
    try {
      const { data } = await client.get(`/theater-events/${eventId}/availability`, { params: { date } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async purchaseTheaterTicket(payload) {
    try {
      const { data } = await client.post('/theater-tickets', payload)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async cancelTheaterTicket(id) {
    try {
      const { data } = await client.patch(`/theater-tickets/${id}/cancel`)
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },

  async searchTheaterTicket(code) {
    try {
      const { data } = await client.get('/theater-tickets/search', { params: { code } })
      return data
    } catch (error) {
      throw toFriendlyError(error)
    }
  },
}

export default ticketsApi
