import {
  Thermometer,
  Snowflake,
  Tags,
  ShoppingCart,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Plus,
  CalendarClock,
} from 'lucide-react'
import type { View } from '../App'
import { useStore } from '../lib/store'
import { coolingConformity, daysUntil, formatDate, todayISO } from '../lib/utils'
import { Badge, Button, Card } from '../components/ui'

function StatCard({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="truncate text-sm text-slate-500">{label}</div>
      </div>
    </button>
  )
}

export default function Dashboard({ setView }: { setView: (v: View) => void }) {
  const { data } = useStore()
  const today = todayISO()

  const coolingsToday = data.coolings.filter((c) => c.date === today)
  const nonConforming = data.coolings.filter(
    (c) => !coolingConformity(c).ok,
  )
  const expiringFreezings = data.freezings
    .map((f) => ({ f, d: daysUntil(f.expiryDate) }))
    .filter((x) => Number.isFinite(x.d) && x.d <= 7)
    .sort((a, b) => a.d - b.d)
  const openOrders = data.orders.filter((o) => o.status !== 'ricevuto')

  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {greeting}! 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ecco la situazione HACCP di oggi, {formatDate(today)}.
        </p>
      </div>

      {/* Azioni rapide */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => setView('coolings')}>
          <Plus size={16} /> Raffreddamento
        </Button>
        <Button variant="secondary" onClick={() => setView('freezings')}>
          <Plus size={16} /> Congelamento
        </Button>
        <Button variant="secondary" onClick={() => setView('labels')}>
          <Tags size={16} /> Etichetta
        </Button>
        <Button variant="secondary" onClick={() => setView('orders')}>
          <ShoppingCart size={16} /> Ordine
        </Button>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          icon={<Thermometer size={22} className="text-blue-600" />}
          tone="bg-blue-50"
          label="Raffreddamenti oggi"
          value={coolingsToday.length}
          onClick={() => setView('coolings')}
        />
        <StatCard
          icon={<Snowflake size={22} className="text-cyan-600" />}
          tone="bg-cyan-50"
          label="Prodotti congelati"
          value={data.freezings.length}
          onClick={() => setView('freezings')}
        />
        <StatCard
          icon={<ShoppingCart size={22} className="text-violet-600" />}
          tone="bg-violet-50"
          label="Ordini aperti"
          value={openOrders.length}
          onClick={() => setView('orders')}
        />
        <StatCard
          icon={<Package size={22} className="text-brand-600" />}
          tone="bg-brand-50"
          label="Prodotti a catalogo"
          value={data.products.length}
          onClick={() => setView('products')}
        />
        <StatCard
          icon={<Truck size={22} className="text-amber-600" />}
          tone="bg-amber-50"
          label="Fornitori"
          value={data.suppliers.length}
          onClick={() => setView('suppliers')}
        />
        <StatCard
          icon={<Tags size={22} className="text-slate-600" />}
          tone="bg-slate-100"
          label="Etichette salvate"
          value={data.labels.length}
          onClick={() => setView('labels')}
        />
      </div>

      {/* Avvisi */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <CalendarClock size={18} className="text-amber-500" />
              In scadenza (7 giorni)
            </h2>
            <button
              onClick={() => setView('freezings')}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
            >
              Vedi tutti <ArrowRight size={14} />
            </button>
          </div>
          {expiringFreezings.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-3 text-sm text-brand-700">
              <CheckCircle2 size={18} /> Nessun prodotto congelato in scadenza.
            </div>
          ) : (
            <ul className="space-y-2">
              {expiringFreezings.slice(0, 6).map(({ f, d }) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-800">
                      {f.productName}
                    </div>
                    <div className="text-xs text-slate-400">
                      Scadenza {formatDate(f.expiryDate)}
                    </div>
                  </div>
                  {d < 0 ? (
                    <Badge tone="red">Scaduto</Badge>
                  ) : (
                    <Badge tone="amber">{d} gg</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-800">
              <AlertTriangle size={18} className="text-red-500" />
              Raffreddamenti non conformi
            </h2>
            <button
              onClick={() => setView('coolings')}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
            >
              Vedi tutti <ArrowRight size={14} />
            </button>
          </div>
          {nonConforming.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-3 text-sm text-brand-700">
              <CheckCircle2 size={18} /> Tutti gli abbattimenti sono conformi.
            </div>
          ) : (
            <ul className="space-y-2">
              {nonConforming.slice(0, 6).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-800">
                      {c.productName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDate(c.date)}
                    </div>
                  </div>
                  <Badge tone="red">Non conforme</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
