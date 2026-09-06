import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Printer, Save, Tags, Trash2, ShieldCheck } from 'lucide-react'
import { useStore } from '../lib/store'
import { type LabelRecord, type LabelType, type Product } from '../lib/types'
import { addDays, formatDate, todayISO, uid } from '../lib/utils'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'

const TYPE_LABEL: Record<LabelType, string> = {
  produzione: 'Produzione',
  abbattimento: 'Abbattuto',
  congelamento: 'Congelato',
  scongelamento: 'Scongelato',
}

const TYPE_TONE: Record<LabelType, 'green' | 'blue' | 'violet' | 'amber'> = {
  produzione: 'green',
  abbattimento: 'blue',
  congelamento: 'violet',
  scongelamento: 'amber',
}

function emptyLabel(): LabelRecord {
  return {
    id: uid(),
    productId: '',
    productName: '',
    type: 'produzione',
    prodDate: todayISO(),
    expiryDate: addDays(todayISO(), 3),
    lot: 'L-' + todayISO().replaceAll('-', ''),
    operator: '',
    storageTemp: '+4 °C',
    allergens: [],
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

// ---- Etichetta stampabile ----
function LabelSheet({ label }: { label: LabelRecord }) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border-2 border-slate-800 bg-white p-4 text-slate-900">
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={18} />
          <span className="text-sm font-bold uppercase tracking-wide">
            Cucina Sicura
          </span>
        </div>
        <span className="rounded border-2 border-slate-800 px-2 py-0.5 text-xs font-bold uppercase">
          {TYPE_LABEL[label.type]}
        </span>
      </div>

      <div className="py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Prodotto
        </div>
        <div className="text-xl font-extrabold leading-tight">
          {label.productName || '—'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t-2 border-dashed border-slate-300 pt-3 text-sm">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-500">
            {label.type === 'congelamento'
              ? 'Congelato il'
              : label.type === 'scongelamento'
                ? 'Scongelato il'
                : label.type === 'abbattimento'
                  ? 'Abbattuto il'
                  : 'Prodotto il'}
          </div>
          <div className="text-base font-bold">{formatDate(label.prodDate)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-500">
            Consumare entro
          </div>
          <div className="text-base font-bold">
            {formatDate(label.expiryDate)}
          </div>
        </div>
        {label.lot && (
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Lotto
            </div>
            <div className="font-bold">{label.lot}</div>
          </div>
        )}
        {label.storageTemp && (
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Conservazione
            </div>
            <div className="font-bold">{label.storageTemp}</div>
          </div>
        )}
        {label.operator && (
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              Operatore
            </div>
            <div className="font-bold">{label.operator}</div>
          </div>
        )}
      </div>

      {label.allergens.length > 0 && (
        <div className="mt-3 border-t-2 border-dashed border-slate-300 pt-2">
          <div className="text-[11px] font-semibold uppercase text-slate-500">
            Allergeni
          </div>
          <div className="text-sm font-bold">{label.allergens.join(' · ')}</div>
        </div>
      )}

      {label.notes && (
        <div className="mt-2 text-xs text-slate-600">{label.notes}</div>
      )}
    </div>
  )
}

export default function Labels() {
  const { data, saveLabel, deleteLabel } = useStore()
  const [form, setForm] = useState<LabelRecord>(emptyLabel())
  const [printTarget, setPrintTarget] = useState<LabelRecord | null>(null)
  const shouldPrint = useRef(false)

  const set = <K extends keyof LabelRecord>(k: K, v: LabelRecord[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const onSelectProduct = (id: string) => {
    const p: Product | undefined = data.products.find((x) => x.id === id)
    setForm((f) => ({
      ...f,
      productId: id,
      productName: p?.name ?? f.productName,
      storageTemp: p?.storageTemp ?? f.storageTemp,
      allergens: p?.allergens ?? f.allergens,
      expiryDate: p ? addDays(f.prodDate, p.shelfLifeDays) : f.expiryDate,
    }))
  }

  // Esegue la stampa dopo che l'etichetta target è stata montata
  useEffect(() => {
    if (printTarget && shouldPrint.current) {
      shouldPrint.current = false
      const t = setTimeout(() => {
        window.print()
        setPrintTarget(null)
      }, 60)
      return () => clearTimeout(t)
    }
  }, [printTarget])

  const doPrint = (label: LabelRecord) => {
    shouldPrint.current = true
    setPrintTarget(label)
  }

  const sortedLabels = useMemo(
    () =>
      [...data.labels].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.labels],
  )

  return (
    <div>
      <PageHeader
        title="Etichette"
        subtitle="Crea e stampa etichette conformi con date, lotto e allergeni."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Dati etichetta
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Prodotto">
                {data.products.length > 0 ? (
                  <Select
                    value={form.productId}
                    onChange={(e) => onSelectProduct(e.target.value)}
                  >
                    <option value="">— Seleziona o scrivi sotto —</option>
                    {data.products.map((p) => (
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

            <Field label="Tipo etichetta">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_LABEL) as LabelType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('type', t)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.type === t
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Data">
                <Input
                  type="date"
                  value={form.prodDate}
                  onChange={(e) => set('prodDate', e.target.value)}
                />
              </Field>
              <Field label="Consumare entro">
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => set('expiryDate', e.target.value)}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 7].map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => set('expiryDate', addDays(form.prodDate, d))}
                >
                  +{d} gg
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Lotto">
                <Input
                  value={form.lot}
                  onChange={(e) => set('lot', e.target.value)}
                />
              </Field>
              <Field label="Conservazione">
                <Input
                  value={form.storageTemp}
                  onChange={(e) => set('storageTemp', e.target.value)}
                  placeholder="+4 °C"
                />
              </Field>
              <Field label="Operatore">
                <Input
                  value={form.operator}
                  onChange={(e) => set('operator', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Allergeni (separati da virgola)">
              <Input
                value={form.allergens.join(', ')}
                onChange={(e) =>
                  set(
                    'allergens',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Es. Latte, Glutine"
              />
            </Field>

            <Field label="Note">
              <Textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="secondary"
                onClick={() => {
                  saveLabel(form)
                  setForm(emptyLabel())
                }}
                disabled={!form.productName.trim()}
              >
                <Save size={16} /> Salva in archivio
              </Button>
              <Button
                onClick={() => doPrint(form)}
                disabled={!form.productName.trim()}
              >
                <Printer size={16} /> Stampa
              </Button>
              <Button variant="ghost" onClick={() => setForm(emptyLabel())}>
                <Plus size={16} /> Nuova
              </Button>
            </div>
          </div>
        </Card>

        {/* Anteprima */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Anteprima
          </h2>
          <LabelSheet label={form} />
        </div>
      </div>

      {/* Archivio etichette */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Etichette salvate
        </h2>
        {sortedLabels.length === 0 ? (
          <EmptyState
            icon={<Tags size={26} />}
            title="Nessuna etichetta in archivio"
            description="Compila i dati e premi «Salva in archivio» per ristampare velocemente le etichette più usate."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedLabels.map((l) => (
              <Card key={l.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                      {l.productName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone={TYPE_TONE[l.type]}>{TYPE_LABEL[l.type]}</Badge>
                      <span className="text-xs text-slate-400">
                        entro {formatDate(l.expiryDate)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Eliminare questa etichetta?'))
                        deleteLabel(l.id)
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Elimina"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setForm({ ...l, id: uid() })}
                  >
                    Riusa
                  </Button>
                  <Button size="sm" onClick={() => doPrint(l)}>
                    <Printer size={14} /> Stampa
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Area di stampa nascosta a schermo, visibile solo in stampa */}
      {printTarget && (
        <div id="print-area" className="fixed inset-0 -z-10 bg-white p-8 opacity-0">
          <LabelSheet label={printTarget} />
        </div>
      )}
    </div>
  )
}
