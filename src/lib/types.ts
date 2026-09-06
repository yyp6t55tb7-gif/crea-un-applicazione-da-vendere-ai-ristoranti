// ---- Modello dati dell'applicazione Cucina Sicura ----

export type ID = string

export interface Supplier {
  id: ID
  name: string
  category: string
  contact: string
  phone: string
  email: string
  notes: string
  createdAt: string
}

export interface Product {
  id: ID
  name: string
  category: string
  supplierId: ID | ''
  unit: string
  shelfLifeDays: number
  allergens: string[]
  storageTemp: string
  notes: string
  createdAt: string
}

export type CoolingType = 'positivo' | 'negativo'

export interface CoolingLog {
  id: ID
  date: string
  productId: ID | ''
  productName: string
  operator: string
  type: CoolingType
  startTemp: number
  endTemp: number
  startTime: string
  endTime: string
  notes: string
  createdAt: string
}

export interface FreezingLog {
  id: ID
  productId: ID | ''
  productName: string
  freezeDate: string
  expiryDate: string
  lot: string
  quantity: string
  operator: string
  notes: string
  createdAt: string
}

export type LabelType =
  | 'produzione'
  | 'abbattimento'
  | 'congelamento'
  | 'scongelamento'

export interface LabelRecord {
  id: ID
  productId: ID | ''
  productName: string
  type: LabelType
  prodDate: string
  expiryDate: string
  lot: string
  operator: string
  storageTemp: string
  allergens: string[]
  notes: string
  createdAt: string
}

export type OrderStatus = 'bozza' | 'inviato' | 'ricevuto'

export interface OrderItem {
  productId: ID | ''
  productName: string
  quantity: string
  unit: string
}

export interface Order {
  id: ID
  supplierId: ID | ''
  supplierName: string
  date: string
  expectedDate: string
  status: OrderStatus
  items: OrderItem[]
  notes: string
  createdAt: string
}

export interface AppData {
  suppliers: Supplier[]
  products: Product[]
  coolings: CoolingLog[]
  freezings: FreezingLog[]
  labels: LabelRecord[]
  orders: Order[]
}

export const ALLERGENS = [
  'Glutine',
  'Crostacei',
  'Uova',
  'Pesce',
  'Arachidi',
  'Soia',
  'Latte',
  'Frutta a guscio',
  'Sedano',
  'Senape',
  'Sesamo',
  'Solfiti',
  'Lupini',
  'Molluschi',
]
