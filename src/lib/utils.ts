import type { AppData } from './types'

// Genera un id univoco senza dipendenze esterne
export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase()
}

export function todayISO(): string {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export function nowTime(): string {
  return new Date().toTimeString().slice(0, 5)
}

// Aggiunge un numero di giorni a una data ISO (yyyy-mm-dd)
export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

// Giorni rimanenti alla scadenza (negativo se scaduto)
export function daysUntil(iso: string): number {
  if (!iso) return NaN
  const target = new Date(iso + 'T00:00:00').getTime()
  const now = new Date(todayISO() + 'T00:00:00').getTime()
  return Math.round((target - now) / 86400000)
}

// Verifica la conformità di un abbattimento secondo i limiti HACCP indicativi:
// - Abbattimento positivo: da +65°C a +10°C entro 90 minuti
// - Abbattimento negativo: da +65°C a -18°C entro 240 minuti
export function coolingConformity(params: {
  type: 'positivo' | 'negativo'
  endTemp: number
  startTime: string
  endTime: string
}): { ok: boolean; minutes: number; reasons: string[] } {
  const { type, endTemp, startTime, endTime } = params
  const reasons: string[] = []
  let minutes = NaN

  if (startTime && endTime) {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    minutes = eh * 60 + em - (sh * 60 + sm)
    if (minutes < 0) minutes += 24 * 60
  }

  const tempLimit = type === 'positivo' ? 10 : -18
  const timeLimit = type === 'positivo' ? 90 : 240

  if (Number.isFinite(endTemp) && endTemp > tempLimit) {
    reasons.push(
      `Temperatura finale ${endTemp}°C oltre il limite di ${tempLimit}°C`,
    )
  }
  if (Number.isFinite(minutes) && minutes > timeLimit) {
    reasons.push(`Durata ${minutes} min oltre il limite di ${timeLimit} min`)
  }

  return { ok: reasons.length === 0, minutes, reasons }
}

const seedCreatedAt = new Date('2024-01-01T09:00:00').toISOString()

export function seedData(): AppData {
  const supFresco = 'SUP-FRESCO'
  const supIttico = 'SUP-ITTICO'
  const supSecco = 'SUP-SECCO'

  const prodPomodoro = 'PRD-POMODORO'
  const prodMozzarella = 'PRD-MOZZ'
  const prodBranzino = 'PRD-BRANZINO'
  const prodRagu = 'PRD-RAGU'

  return {
    suppliers: [
      {
        id: supFresco,
        name: 'Ortofrutta Bio Verdi',
        category: 'Ortofrutta',
        contact: 'Marco Verdi',
        phone: '+39 06 1234567',
        email: 'ordini@ortoverdi.it',
        notes: 'Consegne il lunedì e giovedì mattina.',
        createdAt: seedCreatedAt,
      },
      {
        id: supIttico,
        name: 'Pescheria del Porto',
        category: 'Pesce e ittici',
        contact: 'Lucia Mare',
        phone: '+39 06 7654321',
        email: 'info@pescheriaporto.it',
        notes: 'Prodotto fresco, richiedere sempre documento di pesca.',
        createdAt: seedCreatedAt,
      },
      {
        id: supSecco,
        name: 'Alimentari Grossi & C.',
        category: 'Secco e dispensa',
        contact: 'Anna Grossi',
        phone: '+39 06 5551212',
        email: 'commerciale@grossi.it',
        notes: '',
        createdAt: seedCreatedAt,
      },
    ],
    products: [
      {
        id: prodPomodoro,
        name: 'Pomodori San Marzano',
        category: 'Ortofrutta',
        supplierId: supFresco,
        unit: 'kg',
        shelfLifeDays: 5,
        allergens: [],
        storageTemp: '+4 °C',
        notes: '',
        createdAt: seedCreatedAt,
      },
      {
        id: prodMozzarella,
        name: 'Mozzarella di bufala',
        category: 'Latticini',
        supplierId: supSecco,
        unit: 'kg',
        shelfLifeDays: 7,
        allergens: ['Latte'],
        storageTemp: '+4 °C',
        notes: 'Conservare nel suo liquido di governo.',
        createdAt: seedCreatedAt,
      },
      {
        id: prodBranzino,
        name: 'Branzino fresco',
        category: 'Pesce',
        supplierId: supIttico,
        unit: 'kg',
        shelfLifeDays: 2,
        allergens: ['Pesce'],
        storageTemp: '0 / +2 °C',
        notes: 'Abbattere se non lavorato in giornata.',
        createdAt: seedCreatedAt,
      },
      {
        id: prodRagu,
        name: 'Ragù alla bolognese',
        category: 'Preparati cucina',
        supplierId: '',
        unit: 'kg',
        shelfLifeDays: 3,
        allergens: ['Sedano'],
        storageTemp: '+4 °C',
        notes: 'Produzione interna.',
        createdAt: seedCreatedAt,
      },
    ],
    coolings: [
      {
        id: uid(),
        date: todayISO(),
        productId: prodRagu,
        productName: 'Ragù alla bolognese',
        operator: 'Giulia',
        type: 'positivo',
        startTemp: 82,
        endTemp: 8,
        startTime: '11:00',
        endTime: '12:20',
        notes: '',
        createdAt: new Date().toISOString(),
      },
    ],
    freezings: [
      {
        id: uid(),
        productId: prodBranzino,
        productName: 'Branzino fresco',
        freezeDate: todayISO(),
        expiryDate: addDays(todayISO(), 90),
        lot: 'L-' + todayISO().replaceAll('-', ''),
        quantity: '4 kg',
        operator: 'Marco',
        notes: 'Abbattuto e congelato per servizio sushi.',
        createdAt: new Date().toISOString(),
      },
    ],
    labels: [],
    orders: [
      {
        id: uid(),
        supplierId: supFresco,
        supplierName: 'Ortofrutta Bio Verdi',
        date: todayISO(),
        expectedDate: addDays(todayISO(), 1),
        status: 'inviato',
        items: [
          {
            productId: prodPomodoro,
            productName: 'Pomodori San Marzano',
            quantity: '10',
            unit: 'kg',
          },
        ],
        notes: '',
        createdAt: new Date().toISOString(),
      },
    ],
  }
}
