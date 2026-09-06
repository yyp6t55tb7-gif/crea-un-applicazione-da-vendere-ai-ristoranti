import { useState } from 'react'
import {
  LayoutDashboard,
  Snowflake,
  Thermometer,
  Tags,
  ShoppingCart,
  Package,
  Truck,
  Menu,
  X,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import Dashboard from './pages/Dashboard'
import Coolings from './pages/Coolings'
import Freezings from './pages/Freezings'
import Labels from './pages/Labels'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Suppliers from './pages/Suppliers'
import { Button } from './components/ui'

export type View =
  | 'dashboard'
  | 'coolings'
  | 'freezings'
  | 'labels'
  | 'orders'
  | 'products'
  | 'suppliers'

interface NavItem {
  id: View
  label: string
  icon: typeof LayoutDashboard
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Cruscotto', icon: LayoutDashboard },
  { id: 'coolings', label: 'Raffreddamenti', icon: Thermometer },
  { id: 'freezings', label: 'Congelamenti', icon: Snowflake },
  { id: 'labels', label: 'Etichette', icon: Tags },
  { id: 'orders', label: 'Ordini', icon: ShoppingCart },
  { id: 'products', label: 'Prodotti', icon: Package },
  { id: 'suppliers', label: 'Fornitori', icon: Truck },
]

function Sidebar({
  view,
  setView,
  onNavigate,
}: {
  view: View
  setView: (v: View) => void
  onNavigate?: () => void
}) {
  const { resetDemo } = useStore()
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <ShieldCheck size={22} />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold text-slate-900">Cucina Sicura</div>
          <div className="text-xs text-slate-400">Gestione HACCP</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id)
                onNavigate?.()
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={19} className={active ? 'text-brand-600' : 'text-slate-400'} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={() => {
            if (
              confirm(
                'Ripristinare i dati dimostrativi? Le modifiche attuali verranno sostituite.',
              )
            ) {
              resetDemo()
              onNavigate?.()
            }
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <RotateCcw size={15} />
          Dati dimostrativi
        </button>
        <p className="px-3 pt-2 text-[11px] leading-relaxed text-slate-400">
          I dati sono salvati sul dispositivo.
        </p>
      </div>
    </div>
  )
}

function Shell() {
  const [view, setView] = useState<View>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  const current = NAV.find((n) => n.id === view)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar view={view} setView={setView} />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Chiudi menu"
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar
              view={view}
              setView={setView}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ShieldCheck size={18} />
            </div>
            <span className="font-bold text-slate-900">Cucina Sicura</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setMobileOpen(true)}>
            <Menu size={16} /> {current?.label}
          </Button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {view === 'dashboard' && <Dashboard setView={setView} />}
          {view === 'coolings' && <Coolings />}
          {view === 'freezings' && <Freezings />}
          {view === 'labels' && <Labels />}
          {view === 'orders' && <Orders />}
          {view === 'products' && <Products />}
          {view === 'suppliers' && <Suppliers />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
