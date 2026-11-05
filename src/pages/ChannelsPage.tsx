import { useState } from 'react';
import { Plus, Store, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, LoadingState } from '@/components/ui/StateMessage';
import { ChannelFormModal } from '@/components/channels/ChannelFormModal';
import { DeleteChannelModal } from '@/components/channels/DeleteChannelModal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { nextChannelColor } from '@/lib/channelColors';
import { fetchCatalog, updateChannelRates } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatBRL, formatPct, parseDecimal, parseRequiredDecimal } from '@/lib/format';
import type { Channel } from '@/types';

export function ChannelsPage() {
  const catalog = useAsyncData(fetchCatalog);
  const [creating, setCreating] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);

  if (catalog.loading) return <LoadingState />;
  if (catalog.error || !catalog.data) {
    return <ErrorState message={catalog.error ?? 'Canais indisponiveis.'} onRetry={catalog.reload} />;
  }

  const data = catalog.data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Canais de venda"
        subtitle="Comissao, taxa fixa e imposto de cada marketplace. Esses valores entram no lucro real das vendas."
        actions={
          <Button onClick={() => setCreating(true)} icon={<Plus className="h-4 w-4" />}>
            Novo canal
          </Button>
        }
      />

      {data.channels.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
              <Store className="h-7 w-7" />
            </span>
            <p className="font-semibold text-slate-900">Nenhum canal cadastrado</p>
            <p className="max-w-sm text-sm text-slate-500">Crie o primeiro canal de venda para registrar vendas e calcular o lucro real.</p>
            <Button onClick={() => setCreating(true)} className="mt-1">Criar canal</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.channels.map((channel) => (
            <ChannelRateCard
              key={channel.id}
              channel={channel}
              onSaved={catalog.reload}
              onDelete={() => setChannelToDelete(channel)}
            />
          ))}
        </div>
      )}

      {creating && (
        <ChannelFormModal
          color={nextChannelColor(data.channels.length)}
          onClose={() => setCreating(false)}
          onSaved={catalog.reload}
        />
      )}

      {channelToDelete && (
        <DeleteChannelModal
          channelId={channelToDelete.id}
          channelName={channelToDelete.name}
          onClose={() => setChannelToDelete(null)}
          onDeleted={catalog.reload}
        />
      )}
    </div>
  );
}

function ChannelRateCard({ channel, onSaved, onDelete }: { channel: Channel; onSaved: () => void; onDelete: () => void }) {
  const [commission, setCommission] = useState(String(channel.commission_pct));
  const [fixedFee, setFixedFee] = useState(String(channel.fixed_fee));
  const [tax, setTax] = useState(String(channel.tax_pct));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    commission !== String(channel.commission_pct) ||
    fixedFee !== String(channel.fixed_fee) ||
    tax !== String(channel.tax_pct);

  const save = async () => {
    const commissionPct = parseRequiredDecimal(commission);
    const fee = parseRequiredDecimal(fixedFee);
    const taxPct = parseRequiredDecimal(tax);
    if (commissionPct === null || commissionPct > 100 || fee === null || taxPct === null || taxPct > 100) {
      setError('Informe percentuais entre 0 e 100 e uma taxa fixa valida.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateChannelRates(channel.id, { commission_pct: commissionPct, fixed_fee: fee, tax_pct: taxPct });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="group flex flex-col gap-5 overflow-hidden p-5 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: channel.color }}>
            <Store className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h3 className="truncate font-semibold text-slate-900">{channel.name}</h3>
            <p className="text-xs text-slate-400">
              {formatPct(parseDecimal(commission))} + {formatBRL(parseDecimal(fixedFee))} + {formatPct(parseDecimal(tax))}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Excluir canal ${channel.name}`}
          title="Excluir canal"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Comissao (%)">
          <input type="number" min="0" max="100" step="0.1" inputMode="decimal" className={inputClass} value={commission} onChange={(e) => setCommission(e.target.value)} />
        </Field>
        <Field label="Taxa fixa (R$)">
          <input type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} />
        </Field>
        <Field label="Imposto (%)">
          <input type="number" min="0" max="100" step="0.1" inputMode="decimal" className={inputClass} value={tax} onChange={(e) => setTax(e.target.value)} />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {saved && !error && (
            <span className="animate-fade-in-fast inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Taxas salvas
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Salvando...' : 'Salvar taxas'}
        </Button>
      </div>
    </Card>
  );
}
