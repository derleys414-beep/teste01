import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
    return <ErrorState message={catalog.error ?? 'Canais indisponíveis.'} onRetry={catalog.reload} />;
  }

  const data = catalog.data;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Canais de venda"
        subtitle="Comissão, taxa fixa e imposto de cada marketplace. Esses valores entram no lucro real das vendas."
        actions={
          <Button onClick={() => setCreating(true)} icon={<Plus className="h-4 w-4" />}>
            Novo canal
          </Button>
        }
      />

      {data.channels.length === 0 ? (
        <Card className="p-6 text-sm text-slate-500">Nenhum canal cadastrado. Crie o primeiro para registrar vendas.</Card>
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
      setError('Informe percentuais entre 0 e 100 e uma taxa fixa válida.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateChannelRates(channel.id, { commission_pct: commissionPct, fixed_fee: fee, tax_pct: taxPct });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-5 overflow-hidden p-6 transition-shadow duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: channel.color }} />
          <h3 className="truncate font-semibold text-slate-900">{channel.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {formatPct(parseDecimal(commission))} + {formatBRL(parseDecimal(fixedFee))} + {formatPct(parseDecimal(tax))}
          </span>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir canal ${channel.name}`}
            title="Excluir canal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Comissão (%)">
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
        {error ? <p className="text-sm text-rose-600">{error}</p> : <span />}
        <Button variant="secondary" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Salvando...' : 'Salvar taxas'}
        </Button>
      </div>
    </Card>
  );
}
