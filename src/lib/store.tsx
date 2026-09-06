import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppData,
  CoolingLog,
  FreezingLog,
  LabelRecord,
  Order,
  Product,
  Supplier,
} from './types'
import { seedData } from './utils'

const STORAGE_KEY = 'cucina-sicura:data:v1'

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>
      return {
        suppliers: parsed.suppliers ?? [],
        products: parsed.products ?? [],
        coolings: parsed.coolings ?? [],
        freezings: parsed.freezings ?? [],
        labels: parsed.labels ?? [],
        orders: parsed.orders ?? [],
      }
    }
  } catch {
    // dati corrotti: si riparte dal seed
  }
  return seedData()
}

interface StoreContextValue {
  data: AppData
  // Suppliers
  saveSupplier: (s: Supplier) => void
  deleteSupplier: (id: string) => void
  // Products
  saveProduct: (p: Product) => void
  deleteProduct: (id: string) => void
  // Coolings
  saveCooling: (c: CoolingLog) => void
  deleteCooling: (id: string) => void
  // Freezings
  saveFreezing: (f: FreezingLog) => void
  deleteFreezing: (id: string) => void
  // Labels
  saveLabel: (l: LabelRecord) => void
  deleteLabel: (id: string) => void
  // Orders
  saveOrder: (o: Order) => void
  deleteOrder: (id: string) => void
  // Misc
  resetDemo: () => void
  clearAll: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id)
  if (idx === -1) return [item, ...list]
  const copy = list.slice()
  copy[idx] = item
  return copy
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // spazio pieno o storage non disponibile: si ignora
    }
  }, [data])

  const saveSupplier = useCallback(
    (s: Supplier) =>
      setData((d) => ({ ...d, suppliers: upsert(d.suppliers, s) })),
    [],
  )
  const deleteSupplier = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        suppliers: d.suppliers.filter((x) => x.id !== id),
      })),
    [],
  )

  const saveProduct = useCallback(
    (p: Product) => setData((d) => ({ ...d, products: upsert(d.products, p) })),
    [],
  )
  const deleteProduct = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        products: d.products.filter((x) => x.id !== id),
      })),
    [],
  )

  const saveCooling = useCallback(
    (c: CoolingLog) =>
      setData((d) => ({ ...d, coolings: upsert(d.coolings, c) })),
    [],
  )
  const deleteCooling = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        coolings: d.coolings.filter((x) => x.id !== id),
      })),
    [],
  )

  const saveFreezing = useCallback(
    (f: FreezingLog) =>
      setData((d) => ({ ...d, freezings: upsert(d.freezings, f) })),
    [],
  )
  const deleteFreezing = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        freezings: d.freezings.filter((x) => x.id !== id),
      })),
    [],
  )

  const saveLabel = useCallback(
    (l: LabelRecord) => setData((d) => ({ ...d, labels: upsert(d.labels, l) })),
    [],
  )
  const deleteLabel = useCallback(
    (id: string) =>
      setData((d) => ({ ...d, labels: d.labels.filter((x) => x.id !== id) })),
    [],
  )

  const saveOrder = useCallback(
    (o: Order) => setData((d) => ({ ...d, orders: upsert(d.orders, o) })),
    [],
  )
  const deleteOrder = useCallback(
    (id: string) =>
      setData((d) => ({ ...d, orders: d.orders.filter((x) => x.id !== id) })),
    [],
  )

  const resetDemo = useCallback(() => setData(seedData()), [])
  const clearAll = useCallback(
    () =>
      setData({
        suppliers: [],
        products: [],
        coolings: [],
        freezings: [],
        labels: [],
        orders: [],
      }),
    [],
  )

  const value = useMemo<StoreContextValue>(
    () => ({
      data,
      saveSupplier,
      deleteSupplier,
      saveProduct,
      deleteProduct,
      saveCooling,
      deleteCooling,
      saveFreezing,
      deleteFreezing,
      saveLabel,
      deleteLabel,
      saveOrder,
      deleteOrder,
      resetDemo,
      clearAll,
    }),
    [
      data,
      saveSupplier,
      deleteSupplier,
      saveProduct,
      deleteProduct,
      saveCooling,
      deleteCooling,
      saveFreezing,
      deleteFreezing,
      saveLabel,
      deleteLabel,
      saveOrder,
      deleteOrder,
      resetDemo,
      clearAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve essere usato dentro StoreProvider')
  return ctx
}
