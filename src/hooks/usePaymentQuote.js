import { useEffect, useState } from 'react'
import ticketsApi from '../api/ticketsApi'

// Fase 8: cotiza un monto en EUR a la moneda elegida con la tasa vigente de
// BankIn (vía backend). Devuelve { quoted_amount, rate } o null si no aplica
// (EUR, monto inválido o sin tasa) — en ese caso la nota se oculta.
export default function usePaymentQuote(eurAmount, currency) {
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    if (!currency || currency === 'EUR' || !Number.isFinite(Number(eurAmount)) || Number(eurAmount) <= 0) {
      setQuote(null)
      return
    }
    let cancelled = false
    setQuote(null)
    const timer = setTimeout(() => {
      ticketsApi
        .getPaymentQuote(Number(eurAmount), currency)
        .then((data) => {
          if (!cancelled) setQuote(data)
        })
        .catch(() => {
          if (!cancelled) setQuote(null)
        })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [eurAmount, currency])

  return quote
}
