// Utilidades de fecha en formato ISO (yyyy-MM-dd), sin dependencias externas.

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysISO(baseDate, days) {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

// Ventana movil de 8 dias (hoy inclusive + 7 mas), igual que el backend.
export function windowDays() {
  const today = new Date()
  return Array.from({ length: 8 }, (_, i) => addDaysISO(today, i))
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function formatDayLabel(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]} ${d}/${m}`
}

// Todas las fechas ISO entre start y end (inclusive), para un rango de evento de teatro.
export function isoRange(startISO, endISO) {
  const dates = []
  let cursor = new Date(startISO)
  const end = new Date(endISO)
  while (cursor <= end) {
    dates.push(toISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}
