import { useMemo, useState } from 'react'
import { Plus, Package, Pencil, Trash2, Search } from 'lucide-react'
import { useStore } from '../lib/store'
import { ALLERGENS, type Product } from '../lib/types'
import { uid } from '../lib/utils'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'

function emptyProduct(): Product {
  return {
    id: uid(),
    name: '',
    category: '',
    supplierId: '',
    unit: 'kg',
    shelfLifeDays: 3,
    allergens: [],
    storageTemp: '+4 °C',
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

export default function Products() {
  const { data, saveProduct, deleteProduct } = useStore()
  const [editing, setEditing] = useState<Product | null>(null)
  const [query, setQuery] = useState('')

  const supplierName = (id: string) =>
    data.suppliers.find((s) => s.id === id)?.name ?? 'Produzione interna'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.products
    return data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [data.products, query])

  return (
    <div>
      <PageHeader
        title="Prodotti"
        subtitle="Anagrafica dei prodotti con allergeni, conservazione e fornitore."
        action={
          <Button onClick={() => setEditing(emptyProduct())}>
            <Plus size={16} /> Nuovo prodotto
          </Button>
        }
      />

      {data.products.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            className="pl-9"
            placeholder="Cerca prodotto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={26} />}
          title="Nessun prodotto"
          description="Crea i prodotti che gestisci in cucina: verranno usati per etichette, raffreddamenti e ordini."
          action={
            <Button onClick={() => setEditing(emptyProduct())}>
              <Plus size={16} /> Aggiungi prodotto
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Prodotto</th>
                  <th className="px-4 py-3 font-semibold">Fornitore</th>
                  <th className="px-4 py-3 font-semibold">Conservazione</th>
                  <th className="px-4 py-3 font-semibold">Durata</th>
                  <th className="px-4 py-3 font-semibold">Allergeni</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      {p.category && (
                        <div className="text-xs text-slate-400">{p.category}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {supplierName(p.supplierId)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.storageTemp || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.shelfLifeDays} gg
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.allergens.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          p.allergens.map((a) => (
                            <Badge key={a} tone="amber">
                              {a}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Modifica"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare "${p.name}"?`))
                              deleteProduct(p.id)
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editing && (
        <ProductModal
          product={editing}
          suppliers={data.suppliers}
          onClose={() => setEditing(null)}
          onSave={(p) => {
            saveProduct(p)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function ProductModal({
  product,
  suppliers,
  onClose,
  onSave,
}: {
  product: Product
  suppliers: { id: string; name: string }[]
  onClose: () => void
  onSave: (p: Product) => void
}) {
  const [form, setForm] = useState<Product>(product)
  const isNew = !product.name

  const set = <K extends keyof Product>(k: K, v: Product[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const toggleAllergen = (a: string) =>
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(a)
        ? f.allergens.filter((x) => x !== a)
        : [...f.allergens, a],
    }))

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? 'Nuovo prodotto' : 'Modifica prodotto'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button
            onClick={() => onSave({ ...form, name: form.name.trim() })}
            disabled={!form.name.trim()}
          >
            Salva
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome prodotto *">
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Es. Branzino fresco"
              autoFocus
            />
          </Field>
          <Field label="Categoria">
            <Input
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="Es. Pesce, Latticini…"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fornitore">
            <Select
              value={form.supplierId}
              onChange={(e) => set('supplierId', e.target.value)}
            >
              <option value="">Produzione interna / nessuno</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unità di misura">
            <Select
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
            >
              {['kg', 'g', 'L', 'ml', 'pz', 'conf', 'cassa'].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Temperatura di conservazione">
            <Input
              value={form.storageTemp}
              onChange={(e) => set('storageTemp', e.target.value)}
              placeholder="Es. +4 °C"
            />
          </Field>
          <Field label="Durata / shelf life (giorni)" hint="Usata per calcolare la scadenza in etichetta.">
            <Input
              type="number"
              min={0}
              value={form.shelfLifeDays}
              onChange={(e) =>
                set('shelfLifeDays', Math.max(0, Number(e.target.value) || 0))
              }
            />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Allergeni
          </span>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const active = form.allergens.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-amber-300 bg-amber-100 text-amber-800'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {a}
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Note">
          <Textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Indicazioni particolari di lavorazione o conservazione."
          />
        </Field>
      </div>
    </Modal>
  )
}
