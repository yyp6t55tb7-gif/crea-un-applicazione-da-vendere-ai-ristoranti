import { useMemo, useState } from 'react'
import { Plus, Truck, Pencil, Trash2, Phone, Mail, Search } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Supplier } from '../lib/types'
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
  Textarea,
} from '../components/ui'

function emptySupplier(): Supplier {
  return {
    id: uid(),
    name: '',
    category: '',
    contact: '',
    phone: '',
    email: '',
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

export default function Suppliers() {
  const { data, saveSupplier, deleteSupplier } = useStore()
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [query, setQuery] = useState('')

  const productsBySupplier = useMemo(() => {
    const map = new Map<string, number>()
    data.products.forEach((p) => {
      if (p.supplierId)
        map.set(p.supplierId, (map.get(p.supplierId) ?? 0) + 1)
    })
    return map
  }, [data.products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.suppliers
    return data.suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q),
    )
  }, [data.suppliers, query])

  return (
    <div>
      <PageHeader
        title="Fornitori"
        subtitle="Anagrafica dei fornitori a cui colleghi prodotti e ordini."
        action={
          <Button onClick={() => setEditing(emptySupplier())}>
            <Plus size={16} /> Nuovo fornitore
          </Button>
        }
      />

      {data.suppliers.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            className="pl-9"
            placeholder="Cerca fornitore…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Truck size={26} />}
          title="Nessun fornitore"
          description="Aggiungi i tuoi fornitori per collegarli ai prodotti e generare gli ordini."
          action={
            <Button onClick={() => setEditing(emptySupplier())}>
              <Plus size={16} /> Aggiungi fornitore
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  {s.category && (
                    <Badge tone="blue" className="mt-1">
                      {s.category}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(s)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Modifica"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Eliminare "${s.name}"?`)) deleteSupplier(s.id)
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Elimina"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                {s.contact && (
                  <div className="text-slate-500">Referente: {s.contact}</div>
                )}
                {s.phone && (
                  <a
                    href={`tel:${s.phone}`}
                    className="flex items-center gap-2 hover:text-brand-700"
                  >
                    <Phone size={14} className="text-slate-400" /> {s.phone}
                  </a>
                )}
                {s.email && (
                  <a
                    href={`mailto:${s.email}`}
                    className="flex items-center gap-2 break-all hover:text-brand-700"
                  >
                    <Mail size={14} className="text-slate-400" /> {s.email}
                  </a>
                )}
              </div>

              {s.notes && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {s.notes}
                </p>
              )}

              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                {productsBySupplier.get(s.id) ?? 0} prodotti collegati
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <SupplierModal
          supplier={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            saveSupplier(s)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function SupplierModal({
  supplier,
  onClose,
  onSave,
}: {
  supplier: Supplier
  onClose: () => void
  onSave: (s: Supplier) => void
}) {
  const [form, setForm] = useState<Supplier>(supplier)
  const isNew = !supplier.name

  const set = <K extends keyof Supplier>(k: K, v: Supplier[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Nuovo fornitore' : 'Modifica fornitore'}
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
        <Field label="Nome fornitore *">
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Es. Ortofrutta Bio Verdi"
            autoFocus
          />
        </Field>
        <Field label="Categoria merceologica">
          <Input
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Es. Ortofrutta, Pesce, Secco…"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Referente">
            <Input
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
              placeholder="Nome e cognome"
            />
          </Field>
          <Field label="Telefono">
            <Input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+39 …"
            />
          </Field>
        </div>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="ordini@fornitore.it"
          />
        </Field>
        <Field label="Note">
          <Textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Giorni di consegna, condizioni, ecc."
          />
        </Field>
      </div>
    </Modal>
  )
}
