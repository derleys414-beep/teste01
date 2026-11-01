import { useEffect, useState } from 'react';
import { AppShell, type PageId } from '@/components/layout/AppShell';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AccountStatusScreen } from '@/components/auth/AccountStatusScreen';
import { LoadingState, ErrorState } from '@/components/ui/StateMessage';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSession } from '@/hooks/useSession';
import { fetchOwnAccountStatus } from '@/lib/accounts';
import { signOut } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { AdminPage } from '@/pages/AdminPage';
import { CalculatorPage } from '@/pages/CalculatorPage';
import { ChannelsPage } from '@/pages/ChannelsPage';
import { ComparePage } from '@/pages/ComparePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ReportsPage } from '@/pages/ReportsPage';

const ADMIN_PATH = '/admin';

function App() {
  const session = useSession();

  if (session === undefined) return <LoadingState />;
  if (session === null) return <AuthScreen />;

  return <SignedInApp userId={session.user.id} userEmail={session.user.email ?? ''} />;
}

function SignedInApp({ userId, userEmail }: { userId: string; userEmail: string }) {
  const account = useAsyncData(fetchOwnAccountStatus);
  const [page, setPage] = useState<PageId>('dashboard');
  const [adminOpen, setAdminOpen] = useState(() => window.location.pathname === ADMIN_PATH);
  const isAdmin = useAdminAccess();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (adminOpen && isAdmin === false) {
      setAdminOpen(false);
      window.history.replaceState(null, '', '/');
    }
  }, [adminOpen, isAdmin]);

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (err) {
      setSignOutError(errorMessage(err));
    }
  };

  if (account.loading) return <LoadingState />;
  if (account.error || !account.data) {
    return <ErrorState message={account.error ?? 'Não foi possível carregar sua conta.'} onRetry={account.reload} />;
  }
  if (account.data !== 'ativo') {
    return <AccountStatusScreen status={account.data} onSignOut={handleSignOut} signOutError={signOutError} />;
  }

  const navigate = (next: PageId) => {
    setPage(next);
    setAdminOpen(false);
    window.history.replaceState(null, '', '/');
  };

  const openAdmin = () => {
    setAdminOpen(true);
    window.history.pushState(null, '', ADMIN_PATH);
  };

  const adminLoading = adminOpen && isAdmin === undefined;
  const showAdmin = adminOpen && isAdmin === true;

  return (
    <AppShell
      page={adminOpen ? null : page}
      onNavigate={navigate}
      isAdmin={isAdmin === true}
      adminActive={adminOpen}
      onOpenAdmin={openAdmin}
      userEmail={userEmail}
      onSignOut={handleSignOut}
      signOutError={signOutError}
    >
      {adminLoading && <LoadingState />}
      {showAdmin && <AdminPage currentUserId={userId} />}
      {!adminLoading && !showAdmin && (
        <>
          {page === 'dashboard' && <DashboardPage />}
          {page === 'calculator' && <CalculatorPage />}
          {page === 'compare' && <ComparePage />}
          {page === 'products' && <ProductsPage />}
          {page === 'channels' && <ChannelsPage />}
          {page === 'reports' && <ReportsPage />}
        </>
      )}
    </AppShell>
  );
}

export default App;
