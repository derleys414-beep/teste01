import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { signIn, signUp } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

type Mode = 'signin' | 'signup';

const COPY: Record<Mode, { title: string; submit: string; switchLabel: string; switchAction: string }> = {
  signin: {
    title: 'Entrar na sua conta',
    submit: 'Entrar',
    switchLabel: 'Ainda não tem conta?',
    switchAction: 'Criar conta',
  },
  signup: {
    title: 'Criar sua conta',
    submit: 'Criar conta',
    switchLabel: 'Já tem uma conta?',
    switchAction: 'Entrar',
  },
};

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Informe e-mail e senha.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(trimmedEmail, password);
      } else {
        const hasSession = await signUp(trimmedEmail, password);
        if (!hasSession) {
          setNotice('Conta criada. Entre com seu e-mail e senha para continuar.');
          setMode('signin');
          setPassword('');
        }
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/70 md:flex-row">
      <aside className="flex flex-col justify-between bg-white p-8 md:w-[45%] md:p-12 lg:p-16">
        <span className="text-lg font-semibold tracking-tight text-slate-900">MargemOS</span>
        <div className="mt-16 hidden max-w-md md:block">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900">Quanto você realmente lucra em cada canal.</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500">
            Comissão, taxas, imposto e frete entram na conta. Você vê o lucro real de cada venda antes de anunciar.
          </p>
        </div>
        <p className="mt-12 text-xs text-slate-400 md:mt-0">Lucro real por canal de venda</p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.18)]">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{copy.title}</h1>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
              <Field label="E-mail">
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                />
              </Field>
              <Field label="Senha" hint={mode === 'signup' ? 'Mínimo de 6 caracteres' : undefined}>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

              <Button type="submit" disabled={submitting} className="mt-1 h-11 w-full">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Aguarde...' : copy.submit}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {copy.switchLabel}{' '}
            <button type="button" onClick={switchMode} className="font-medium text-brand-600 transition-colors hover:text-brand-800">
              {copy.switchAction}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
