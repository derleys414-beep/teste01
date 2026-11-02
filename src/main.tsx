import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle } from 'lucide-react';
import './index.css';

const root = createRoot(document.getElementById('root')!);

function MissingConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-2xl border border-rose-200 bg-white px-6 py-10 text-center shadow-sm">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-4 font-medium text-slate-900">Configuração do Supabase ausente</p>
        <p className="mt-2 text-sm text-slate-600">
          Defina as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e publique o site novamente.
        </p>
      </div>
    </div>
  );
}

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  root.render(<MissingConfig />);
} else {
  // Imported lazily so the Supabase client is only created once its config exists.
  import('./App.tsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}
