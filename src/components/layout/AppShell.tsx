import type { LucideIcon } from 'lucide-react';
import { BarChart3, Calculator, GitCompareArrows, LayoutDashboard, LogOut, ShieldCheck, Store, Tags, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

export type PageId = 'dashboard' | 'calculator' | 'compare' | 'products' | 'channels' | 'reports';

const NAV_ITEMS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calculator', label: 'Calculadora', icon: Calculator },
  { id: 'compare', label: 'Comparativo', icon: GitCompareArrows },
  { id: 'products', label: 'Produtos', icon: Tags },
  { id: 'channels', label: 'Canais', icon: Store },
  { id: 'reports', label: 'Relatorios', icon: BarChart3 },
];

function navItemClass(active: boolean) {
  return `group relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
    active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
  }`;
}

function desktopNavItemClass(active: boolean) {
  return `group relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
    active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
  }`;
}

export function AppShell({
  page,
  onNavigate,
  isAdmin,
  adminActive,
  onOpenAdmin,
  userEmail,
  onSignOut,
  signOutError,
  children,
}: {
  page: PageId | null;
  onNavigate: (page: PageId) => void;
  isAdmin: boolean;
  adminActive: boolean;
  onOpenAdmin: () => void;
  userEmail: string;
  onSignOut: () => void;
  signOutError: string | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-slate-200/70 bg-white md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col">
        <div className="flex h-16 items-center gap-2.5 px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <TrendingUp className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">MargemOS</span>
        </div>
        <nav className="flex flex-col gap-1 px-4 pt-2">
          {NAV_ITEMS.map((item) => {
            const active = item.id === page;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={desktopNavItemClass(active)}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-brand-600' : 'text-slate-400'}`} strokeWidth={2} />
                {item.label}
                {active && <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-brand-600" />}
              </button>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              aria-current={adminActive ? 'page' : undefined}
              className={desktopNavItemClass(adminActive)}
            >
              <ShieldCheck className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${adminActive ? 'text-brand-600' : 'text-slate-400'}`} strokeWidth={2} />
              Painel Admin
              {adminActive && <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-brand-600" />}
            </button>
          )}
        </nav>
        <div className="mt-auto px-4 pb-5">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-700">
                {userEmail.charAt(0).toUpperCase()}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600" title={userEmail}>
                {userEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-2.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
            {signOutError && <p className="mt-1.5 text-xs text-rose-600">{signOutError}</p>}
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 glass md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900">MargemOS</span>
        </div>
        <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600">
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 md:ml-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 md:px-10 md:py-10 md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/70 bg-white/95 glass md:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const active = item.id === page;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200 ${
                  active ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              aria-current={adminActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200 ${
                adminActive ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <ShieldCheck className={`h-5 w-5 transition-transform duration-200 ${adminActive ? 'scale-110' : ''}`} strokeWidth={adminActive ? 2.5 : 2} />
              Admin
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
