import { useEffect, useState } from 'react';
import { checkPlatformAdmin } from '@/lib/accounts';

// Undefined while the server check is running; false when denied or when the check fails.
export function useAdminAccess(): boolean | undefined {
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let active = true;
    checkPlatformAdmin()
      .then((value) => {
        if (active) setIsAdmin(value);
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}
