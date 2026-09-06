import { useMemo, useState } from 'react'
import { Plus, Snowflake, Trash2, Pencil, Tag } from 'lucide-react'
import { useStore } from '../lib/store'
import type { FreezingLog } from '../lib/types'
import { addDays, daysUntil, formatDate, todayISO, uid } from '../lib/utils'
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

function emptyFreezing(): FreezingLog {
  return {
    id: uid(),
    productId: '',
    productName: '',
    freezeDate: todayISO(),
    expiryDate: addDays(todayISO(), 90),
    lot: 'L-' + todayISO().replaceAll('-', ''),
    quantity: '',
    operator: '',
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

function expiryBadge(expiry: string) {
  const d = daysUntil(expiry)
  if (!Number.isFinite(d)) return null
  if (d < 0)
    return <Badge tone="red">Scaduto da {Math.abs(d)} gg</Badge>
  if (d <= 7) return <Badge tone="amber">Scade tra {d} gg</Badge>
  return <Badge tone="green">Scade tra {d} gg</Badge>
}

export default function Freezings() {
  const { data, saveFreezing, deleteFreezing } = useStore()
  const [editing, setEditing] = useState<FreezingLog | null>(null)

  const sorted = useMemo(
    () =>
      [...data.freezings].sort((a, b) =>
        b.freezeDate.localeCompare(a.freezeDate),
      ),
    [data.freezings],
  )

  return (
    <div>
      <PageHeader
        title="Congelamenti"
        subtitle="Registro dei prodotti congelati in cucina con lotto e data di scadenza."
        action={
          <Button onClick={() => setEditing(emptyFreezing())}>
            <Plus size={16} /> Nuovo congelamento
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Snowflake size={26} />}
          title="Nessun congelamento registrato"
          description="Tieni traccia di cosa congeli, quando e con quale lotto per garantire la tracciabilità."
          action={
            <Button onClick={() => setEditing(emptyFreezing())}>
              <Plus size={16} /> Registra congelamento
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((f) => (
            <Card key={f.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                      <Snowflake size={18} />
                    </div>
                    <h3 className="truncate font-semibold text-slate-900">
                      {f.productName || 'Prodotto'}
                    </h3>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing(f)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Modifica"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Eliminare questo congelamento?'))
                        deleteFreezing(f.id)
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Elimina"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Congelato il</dt>
                  <dd className="font-medium text-slate-800">
                    {formatDate(f.freezeDate)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Scadenza</dt>
                  <dd className="font-medium text-slate-800">
                    {formatDate(f.expiryDate)}
                  </dd>
                </div>
                {f.quantity && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Quantità</dt>
                    <dd className="font-medium text-slate-800">{f.quantity}</dd>
                  </div>
                )}
                {f.operator && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Operatore</dt>
                    <dd className="font-medium text-slate-800">{f.operator}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {f.lot && (
                  <Badge tone="slate">
                    <Tag size={12} /> {f.lot}
                  </Badge>
                )}
                {expiryBadge(f.expiryDate)}
              </div>

              {f.notes && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {f.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <FreezingModal
          freezing={editing}
          products={data.products}
          onClose={() => setEditing(null)}
          onSave={(f) => {
            saveFreezing(f)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function FreezingModal({
  freezing,
  products,
  onClose,
  onSave,
}: {
  freezing: FreezingLog
  products: { id: string; name: string; shelfLifeDays?: number }[]
  onClose: () => void
  onSave: (f: FreezingLog) => void
}) {
  const [form, setForm] = useState<FreezingLog>(freezing)
  const isNew = !freezing.productName

  const set = <K extends keyof FreezingLog>(k: K, v: FreezingLog[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const onSelectProduct = (id: string) => {
    const p = products.find((x) => x.id === id)
    setForm((f) => ({
      ...f,
      productId: id,
      productName: p?.name ?? f.productName,
    }))
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? 'Nuovo congelamento' : 'Modifica congelamento'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button
            onClick={() =>
              onSave({ ...form, productName: form.productName.trim() })
            }
            disabled={!form.productName.trim()}
          >
            Salva
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prodotto *">
            {products.length > 0 ? (
              <Select
                value={form.productId}
                onChange={(e) => onSelectProduct(e.target.value)}
              >
                <option value="">— Seleziona o scrivi sotto —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={form.productName}
                onChange={(e) => set('productName', e.target.value)}
                placeholder="Nome prodotto"
              />
            )}
          </Field>
          <Field label="Nome (se non in elenco)">
            <Input
              value={form.productName}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  productName: e.target.value,
                  productId: '',
                }))
              }
              placeholder="Nome prodotto"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data congelamento">
            <Input
              type="date"
              value={form.freezeDate}
              onChange={(e) => set('freezeDate', e.target.value)}
            />
          </Field>
          <Field label="Data scadenza">
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) => set('expiryDate', e.target.value)}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          {[30, 60, 90, 180].map((d) => (
            <Button
              key={d}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => set('expiryDate', addDays(form.freezeDate, d))}
            >
              +{d} giorni
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Lotto">
            <Input
              value={form.lot}
              onChange={(e) => set('lot', e.target.value)}
              placeholder="Es. L-20240101"
            />
          </Field>
          <Field label="Quantità">
            <Input
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              placeholder="Es. 4 kg"
            />
          </Field>
          <Field label="Operatore">
            <Input
              value={form.operator}
              onChange={(e) => set('operator', e.target.value)}
              placeholder="Chi ha congelato"
            />
          </Field>
        </div>

        <Field label="Note">
          <Textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Es. abbattuto prima del congelamento."
          />
        </Field>
      </div>
    </Modal>
  )
}
