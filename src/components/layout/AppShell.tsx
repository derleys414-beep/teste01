import type { LucideIcon } from 'lucide-react';
import { BarChart3, Calculator, GitCompareArrows, LayoutDashboard, LogOut, ShieldCheck, Store, Tags } from 'lucide-react';
import type { ReactNode } from 'react';

export type PageId = 'dashboard' | 'calculator' | 'compare' | 'products' | 'channels' | 'reports';

const NAV_ITEMS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calculator', label: 'Calculadora', icon: Calculator },
  { id: 'compare', label: 'Comparativo', icon: GitCompareArrows },
  { id: 'products', label: 'Produtos', icon: Tags },
  { id: 'channels', label: 'Canais', icon: Store },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

function navItemClass(active: boolean) {
  return `group relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
    active ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
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
    <div className="min-h-screen bg-white md:flex">
      <aside className="border-b border-slate-200 bg-slate-50/80 md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col md:border-b-0 md:border-r">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-semibold tracking-tight text-slate-900">MargemOS</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-1 md:overflow-visible md:px-4 md:pb-0 md:pt-4">
          {NAV_ITEMS.map((item) => {
            const active = item.id === page;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={navItemClass(active)}
              >
                <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              aria-current={adminActive ? 'page' : undefined}
              className={navItemClass(adminActive)}
            >
              <ShieldCheck className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${adminActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              Painel Admin
            </button>
          )}
        </nav>
        <div className="hidden px-4 pb-6 pt-4 md:block">
          <div className="rounded-xl bg-white/70 p-3 ring-1 ring-slate-200">
            <p className="truncate text-xs text-slate-500" title={userEmail}>
              {userEmail}
            </p>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
            {signOutError && <p className="mt-2 text-xs text-rose-600">{signOutError}</p>}
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 md:ml-60">
        <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-4 sm:px-6 md:hidden">
          <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-rose-600">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-12">{children}</div>
      </main>

    </div>
  );
}
