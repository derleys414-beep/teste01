import { AuthError, MissingIdentityError, login, logout, signup } from '@netlify/identity';

export async function signIn(email: string, password: string): Promise<void> {
  try {
    await login(email, password);
  } catch (err) {
    throw new Error(translateAuthError(err));
  }
}

// Returns true when the account was created and is ready to use, false when the email still needs confirmation.
export async function signUp(email: string, password: string): Promise<boolean> {
  try {
    const user = await signup(email, password);
    return Boolean(user.confirmedAt);
  } catch (err) {
    throw new Error(translateAuthError(err));
  }
}

export async function signOut(): Promise<void> {
  try {
    await logout();
  } catch (err) {
    throw new Error(translateAuthError(err));
  }
}

function translateAuthError(err: unknown): string {
  if (err instanceof MissingIdentityError) return 'O login ainda não está ativado neste site.';
  if (!(err instanceof AuthError)) return 'Sem conexão. Verifique sua internet e tente novamente.';
  const normalized = err.message.toLowerCase();
  if (normalized.includes('not confirmed')) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (err.status === 401 || normalized.includes('invalid')) {
    if (normalized.includes('email') && !normalized.includes('password')) return 'Informe um e-mail válido.';
    return 'E-mail ou senha incorretos.';
  }
  if (normalized.includes('already')) return 'Já existe uma conta com este e-mail.';
  if (normalized.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (err.status === 403) return 'Novos cadastros estão desativados.';
  if (err.status === 422) return 'Verifique o e-mail e a senha informados.';
  return 'Não foi possível concluir. Tente novamente.';
}
