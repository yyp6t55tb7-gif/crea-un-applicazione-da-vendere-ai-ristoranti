import { useMemo, useState } from 'react'
import {
  Plus,
  ShoppingCart,
  Trash2,
  Pencil,
  Mail,
  X,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '../lib/store'
import type { Order, OrderItem, OrderStatus, Product, Supplier } from '../lib/types'
import { formatDate, todayISO, uid } from '../lib/utils'
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

const STATUS_LABEL: Record<OrderStatus, string> = {
  bozza: 'Bozza',
  inviato: 'Inviato',
  ricevuto: 'Ricevuto',
}
const STATUS_TONE: Record<OrderStatus, 'slate' | 'blue' | 'green'> = {
  bozza: 'slate',
  inviato: 'blue',
  ricevuto: 'green',
}

function emptyOrder(): Order {
  return {
    id: uid(),
    supplierId: '',
    supplierName: '',
    date: todayISO(),
    expectedDate: '',
    status: 'bozza',
    items: [],
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

function buildEmailBody(order: Order): string {
  const lines = [
    `Ordine del ${formatDate(order.date)}`,
    order.expectedDate
      ? `Consegna richiesta: ${formatDate(order.expectedDate)}`
      : '',
    '',
    'Articoli:',
    ...order.items.map(
      (it) => `- ${it.productName}: ${it.quantity} ${it.unit}`,
    ),
    '',
    order.notes ? `Note: ${order.notes}` : '',
  ].filter(Boolean)
  return lines.join('\n')
}

export default function Orders() {
  const { data, saveOrder, deleteOrder } = useStore()
  const [editing, setEditing] = useState<Order | null>(null)

  const supplierEmail = (id: string) =>
    data.suppliers.find((s) => s.id === id)?.email ?? ''

  const sorted = useMemo(
    () => [...data.orders].sort((a, b) => b.date.localeCompare(a.date)),
    [data.orders],
  )

  const sendEmail = (o: Order) => {
    const email = supplierEmail(o.supplierId)
    const subject = encodeURIComponent(
      `Ordine ${o.supplierName || ''} - ${formatDate(o.date)}`,
    )
    const body = encodeURIComponent(buildEmailBody(o))
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    if (o.status === 'bozza') saveOrder({ ...o, status: 'inviato' })
  }

  return (
    <div>
      <PageHeader
        title="Ordini fornitori"
        subtitle="Crea ordini collegati ai fornitori e inviali via email in un clic."
        action={
          <Button
            onClick={() => setEditing(emptyOrder())}
            disabled={data.suppliers.length === 0}
          >
            <Plus size={16} /> Nuovo ordine
          </Button>
        }
      />

      {data.suppliers.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={26} />}
          title="Aggiungi prima un fornitore"
          description="Per creare un ordine serve almeno un fornitore in anagrafica."
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={26} />}
          title="Nessun ordine"
          description="Crea il tuo primo ordine selezionando fornitore e prodotti."
          action={
            <Button onClick={() => setEditing(emptyOrder())}>
              <Plus size={16} /> Crea ordine
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((o) => (
            <Card key={o.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {o.supplierName || 'Fornitore'}
                    </h3>
                    <Badge tone={STATUS_TONE[o.status]}>
                      {STATUS_LABEL[o.status]}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Data ordine {formatDate(o.date)}
                    {o.expectedDate &&
                      ` · Consegna ${formatDate(o.expectedDate)}`}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.items.length === 0 ? (
                      <span className="text-xs text-slate-400">
                        Nessun articolo
                      </span>
                    ) : (
                      o.items.map((it, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {it.productName}{' '}
                          <span className="font-semibold text-slate-800">
                            {it.quantity} {it.unit}
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                  {o.notes && (
                    <p className="mt-2 text-xs text-slate-500">{o.notes}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendEmail(o)}
                  >
                    <Mail size={14} /> Invia
                  </Button>
                  {o.status !== 'ricevuto' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveOrder({ ...o, status: 'ricevuto' })}
                    >
                      Segna ricevuto <ChevronRight size={14} />
                    </Button>
                  )}
                  <button
                    onClick={() => setEditing(o)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Modifica"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Eliminare questo ordine?')) deleteOrder(o.id)
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Elimina"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <OrderModal
          order={editing}
          suppliers={data.suppliers}
          products={data.products}
          onClose={() => setEditing(null)}
          onSave={(o) => {
            saveOrder(o)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function OrderModal({
  order,
  suppliers,
  products,
  onClose,
  onSave,
}: {
  order: Order
  suppliers: Supplier[]
  products: Product[]
  onClose: () => void
  onSave: (o: Order) => void
}) {
  const [form, setForm] = useState<Order>(order)
  const isNew = order.items.length === 0 && !order.supplierId

  const set = <K extends keyof Order>(k: K, v: Order[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const onSelectSupplier = (id: string) => {
    const s = suppliers.find((x) => x.id === id)
    setForm((f) => ({ ...f, supplierId: id, supplierName: s?.name ?? '' }))
  }

  // Prodotti suggeriti: quelli del fornitore selezionato, altrimenti tutti
  const supplierProducts = form.supplierId
    ? products.filter((p) => p.supplierId === form.supplierId)
    : products
  const availableProducts =
    supplierProducts.length > 0 ? supplierProducts : products

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { productId: '', productName: '', quantity: '1', unit: 'kg' },
      ],
    }))
  }

  const updateItem = (idx: number, patch: Partial<OrderItem>) => {
    setForm((f) => {
      const items = f.items.slice()
      items[idx] = { ...items[idx], ...patch }
      return { ...f, items }
    })
  }

  const onItemProduct = (idx: number, id: string) => {
    const p = products.find((x) => x.id === id)
    updateItem(idx, {
      productId: id,
      productName: p?.name ?? '',
      unit: p?.unit ?? 'kg',
    })
  }

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  const canSave =
    !!form.supplierId &&
    form.items.length > 0 &&
    form.items.every((it) => it.productName.trim() && it.quantity.trim())

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? 'Nuovo ordine' : 'Modifica ordine'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => onSave(form)} disabled={!canSave}>
            Salva ordine
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fornitore *">
            <Select
              value={form.supplierId}
              onChange={(e) => onSelectSupplier(e.target.value)}
            >
              <option value="">— Seleziona fornitore —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stato">
            <Select
              value={form.status}
              onChange={(e) => set('status', e.target.value as OrderStatus)}
            >
              <option value="bozza">Bozza</option>
              <option value="inviato">Inviato</option>
              <option value="ricevuto">Ricevuto</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data ordine">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Field label="Consegna prevista">
            <Input
              type="date"
              value={form.expectedDate}
              onChange={(e) => set('expectedDate', e.target.value)}
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Articoli</span>
            <Button variant="secondary" size="sm" onClick={addItem}>
              <Plus size={14} /> Aggiungi
            </Button>
          </div>

          {form.items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400">
              Nessun articolo. Aggiungi almeno un prodotto.
            </p>
          ) : (
            <div className="space-y-2">
              {form.items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 p-2 sm:flex-row sm:items-center"
                >
                  {availableProducts.length > 0 ? (
                    <Select
                      className="sm:flex-1"
                      value={it.productId}
                      onChange={(e) => onItemProduct(idx, e.target.value)}
                    >
                      <option value="">— Prodotto —</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      <option value="__free">Altro (scrivi a mano)</option>
                    </Select>
                  ) : null}
                  {(it.productId === '' || it.productId === '__free') && (
                    <Input
                      className="sm:flex-1"
                      value={it.productName}
                      onChange={(e) =>
                        updateItem(idx, {
                          productName: e.target.value,
                          productId: '__free',
                        })
                      }
                      placeholder="Nome prodotto"
                    />
                  )}
                  <Input
                    className="sm:w-24"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: e.target.value })
                    }
                    placeholder="Qtà"
                  />
                  <Input
                    className="sm:w-20"
                    value={it.unit}
                    onChange={(e) => updateItem(idx, { unit: e.target.value })}
                    placeholder="unità"
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    className="self-end rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 sm:self-auto"
                    aria-label="Rimuovi"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Field label="Note">
          <Textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Indicazioni per il fornitore."
          />
        </Field>
      </div>
    </Modal>
  )
}
