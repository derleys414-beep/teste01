import { useEffect, useState } from 'react';
import { getUser, handleAuthCallback, onAuthChange, type User } from '@netlify/identity';

// User is undefined while the stored session is still being read.
export function useSession(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((_event, next) => {
      if (active) setUser(next);
    });
    // Processes email-confirmation links (#confirmation_token=...) before reading the session.
    handleAuthCallback()
      .catch(() => null)
      .then(() => getUser())
      .then((current) => {
        if (active) setUser(current);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return user;
}
