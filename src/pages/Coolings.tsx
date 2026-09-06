import { useMemo, useState } from 'react'
import {
  Plus,
  Thermometer,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '../lib/store'
import type { CoolingLog, CoolingType } from '../lib/types'
import { coolingConformity, formatDate, nowTime, todayISO, uid } from '../lib/utils'
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

function emptyCooling(): CoolingLog {
  return {
    id: uid(),
    date: todayISO(),
    productId: '',
    productName: '',
    operator: '',
    type: 'positivo',
    startTemp: 65,
    endTemp: 8,
    startTime: nowTime(),
    endTime: '',
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

const typeLabel: Record<CoolingType, string> = {
  positivo: 'Abbattimento positivo (+3 °C)',
  negativo: 'Abbattimento negativo (−18 °C)',
}

export default function Coolings() {
  const { data, saveCooling, deleteCooling } = useStore()
  const [editing, setEditing] = useState<CoolingLog | null>(null)

  const sorted = useMemo(
    () =>
      [...data.coolings].sort((a, b) =>
        (b.date + b.startTime).localeCompare(a.date + a.startTime),
      ),
    [data.coolings],
  )

  return (
    <div>
      <PageHeader
        title="Raffreddamenti / Abbattimenti"
        subtitle="Registro giornaliero degli abbattimenti con controllo automatico dei limiti HACCP."
        action={
          <Button onClick={() => setEditing(emptyCooling())}>
            <Plus size={16} /> Nuovo raffreddamento
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Thermometer size={26} />}
          title="Nessun raffreddamento registrato"
          description="Registra gli abbattimenti di temperatura: l'app verifica in automatico tempi e temperature limite."
          action={
            <Button onClick={() => setEditing(emptyCooling())}>
              <Plus size={16} /> Registra raffreddamento
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => {
            const conf = coolingConformity(c)
            return (
              <Card key={c.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {c.productName || 'Prodotto non specificato'}
                      </h3>
                      <Badge tone={c.type === 'positivo' ? 'blue' : 'violet'}>
                        {c.type === 'positivo' ? 'Positivo' : 'Negativo'}
                      </Badge>
                      {conf.ok ? (
                        <Badge tone="green">
                          <CheckCircle2 size={13} /> Conforme
                        </Badge>
                      ) : (
                        <Badge tone="red">
                          <AlertTriangle size={13} /> Non conforme
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {formatDate(c.date)}
                      {c.operator && ` · Operatore: ${c.operator}`}
                    </div>
                    {!conf.ok && conf.reasons.length > 0 && (
                      <ul className="mt-2 list-inside list-disc text-xs text-red-600">
                        {conf.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-slate-800">
                          {c.startTemp}°
                        </div>
                        <div className="text-[11px] uppercase text-slate-400">
                          Iniziale
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-slate-800">
                          {c.endTemp}°
                        </div>
                        <div className="text-[11px] uppercase text-slate-400">
                          Finale
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-slate-800">
                          {Number.isFinite(conf.minutes) ? conf.minutes : '—'}
                          <span className="text-xs font-normal text-slate-400">
                            {Number.isFinite(conf.minutes) ? ' min' : ''}
                          </span>
                        </div>
                        <div className="text-[11px] uppercase text-slate-400">
                          Durata
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(c)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Modifica"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Eliminare questo raffreddamento?'))
                            deleteCooling(c.id)
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing && (
        <CoolingModal
          cooling={editing}
          products={data.products}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            saveCooling(c)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function CoolingModal({
  cooling,
  products,
  onClose,
  onSave,
}: {
  cooling: CoolingLog
  products: { id: string; name: string }[]
  onClose: () => void
  onSave: (c: CoolingLog) => void
}) {
  const [form, setForm] = useState<CoolingLog>(cooling)
  const isNew = !cooling.endTime && !cooling.productName

  const set = <K extends keyof CoolingLog>(k: K, v: CoolingLog[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const conf = coolingConformity(form)

  const onSelectProduct = (id: string) => {
    const p = products.find((x) => x.id === id)
    setForm((f) => ({ ...f, productId: id, productName: p?.name ?? f.productName }))
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={isNew ? 'Nuovo raffreddamento' : 'Modifica raffreddamento'}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Data">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Field label="Operatore">
            <Input
              value={form.operator}
              onChange={(e) => set('operator', e.target.value)}
              placeholder="Chi ha eseguito"
            />
          </Field>
          <Field label="Tipo abbattimento">
            <Select
              value={form.type}
              onChange={(e) => set('type', e.target.value as CoolingType)}
            >
              <option value="positivo">{typeLabel.positivo}</option>
              <option value="negativo">{typeLabel.negativo}</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Temp. iniziale (°C)">
            <Input
              type="number"
              value={form.startTemp}
              onChange={(e) => set('startTemp', Number(e.target.value))}
            />
          </Field>
          <Field label="Temp. finale (°C)">
            <Input
              type="number"
              value={form.endTemp}
              onChange={(e) => set('endTemp', Number(e.target.value))}
            />
          </Field>
          <Field label="Ora inizio">
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
          </Field>
          <Field label="Ora fine">
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => set('endTime', e.target.value)}
            />
          </Field>
        </div>

        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
            conf.ok
              ? 'border-brand-200 bg-brand-50 text-brand-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {conf.ok ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          )}
          <div>
            <div className="font-medium">
              {conf.ok ? 'Abbattimento conforme' : 'Abbattimento non conforme'}
              {Number.isFinite(conf.minutes) && ` · durata ${conf.minutes} min`}
            </div>
            {!conf.ok && conf.reasons.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-xs">
                {conf.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
            {conf.ok && (
              <div className="text-xs text-brand-700/80">
                {form.type === 'positivo'
                  ? 'Limite: ≤ +10 °C entro 90 min'
                  : 'Limite: ≤ −18 °C entro 240 min'}
              </div>
            )}
          </div>
        </div>

        <Field label="Note">
          <Textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Eventuali azioni correttive o osservazioni."
          />
        </Field>
      </div>
    </Modal>
  )
}
