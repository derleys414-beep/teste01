import { supabase } from '@/lib/supabase';

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
}

// Returns true when the account was created and is ready to use, false when the project still requires email confirmation.
export async function signUp(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
  return data.session !== null;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(translateAuthError(error.message));
}

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'Já existe uma conta com este e-mail.';
  }
  if (normalized.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (normalized.includes('invalid email')) return 'Informe um e-mail válido.';
  if (normalized.includes('fetch') || normalized.includes('network')) return 'Sem conexão. Verifique sua internet e tente novamente.';
  return 'Não foi possível concluir. Tente novamente.';
}
