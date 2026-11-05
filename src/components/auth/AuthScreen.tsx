import { useState, type FormEvent } from 'react';
import { Loader2, TrendingUp, BarChart3, Calculator, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { signIn, signUp } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

type Mode = 'signin' | 'signup';

const COPY: Record<Mode, { title: string; submit: string; switchLabel: string; switchAction: string }> = {
  signin: {
    title: 'Entrar na sua conta',
    submit: 'Entrar',
    switchLabel: 'Ainda nao tem conta?',
    switchAction: 'Criar conta',
  },
  signup: {
    title: 'Criar sua conta',
    submit: 'Criar conta',
    switchLabel: 'Ja tem uma conta?',
    switchAction: 'Entrar',
  },
};

const FEATURES = [
  { icon: BarChart3, title: 'Lucro real por canal', desc: 'Comissao, taxas, imposto e frete na conta.' },
  { icon: Calculator, title: 'Calculadora inteligente', desc: 'Saiba quanto sobra antes de anunciar.' },
  { icon: ShieldCheck, title: 'Comparativo de marketplaces', desc: 'Descubra onde vale mais a pena vender.' },
];

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
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {/* Brand panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-slate-900 p-8 md:w-[44%] md:p-12 lg:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900/60" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, #6254e8 0%, transparent 50%), radial-gradient(circle at 80% 70%, #4f46e5 0%, transparent 50%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/40">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-bold tracking-tight text-white">MargemOS</span>
          </div>
        </div>
        <div className="relative mt-16 hidden max-w-md md:block">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl">
            Quanto voce realmente lucra em cada canal.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Comissao, taxas, imposto e frete entram na conta. Voce ve o lucro real de cada venda antes de anunciar.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300 ring-1 ring-white/10">
                  <f.icon className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative mt-12 text-xs text-slate-500 md:mt-0">Lucro real por canal de venda</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="animate-fade-in rounded-2xl border border-slate-200/70 bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.12)]">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{copy.title}</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {mode === 'signin' ? 'Bem-vindo de volta.' : 'Comece em menos de um minuto.'}
            </p>

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
              <Field label="Senha" hint={mode === 'signup' ? 'Minimo de 6 caracteres' : undefined}>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                />
              </Field>

              {error && <p className="animate-fade-in-fast rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              {notice && <p className="animate-fade-in-fast rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

              <Button type="submit" disabled={submitting} className="mt-1 h-11 w-full">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Aguarde...' : copy.submit}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            {copy.switchLabel}{' '}
            <button type="button" onClick={switchMode} className="font-medium text-brand-600 transition-colors hover:text-brand-700">
              {copy.switchAction}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
