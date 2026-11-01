import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { createChannel } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { parseRequiredDecimal } from '@/lib/format';

export function ChannelFormModal({
  color,
  onClose,
  onSaved,
}: {
  color: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [commission, setCommission] = useState('');
  const [fixedFee, setFixedFee] = useState('0');
  const [tax, setTax] = useState('6');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const commissionPct = parseRequiredDecimal(commission);
    const fee = parseRequiredDecimal(fixedFee);
    const taxPct = parseRequiredDecimal(tax);
    if (!trimmedName) {
      setError('Informe o nome do canal.');
      return;
    }
    if (commissionPct === null || commissionPct > 100) {
      setError('Informe uma comissão entre 0 e 100.');
      return;
    }
    if (fee === null) {
      setError('Informe a taxa fixa por venda.');
      return;
    }
    if (taxPct === null || taxPct > 100) {
      setError('Informe um imposto entre 0 e 100.');
      return;
    }

    setSaving(true);
    try {
      await createChannel({ name: trimmedName, color, commission_pct: commissionPct, fixed_fee: fee, tax_pct: taxPct });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Novo canal de venda"
      description="Cadastre um marketplace ou loja com as taxas cobradas em cada venda."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="channel-form" disabled={saving}>
            {saving ? 'Salvando...' : 'Criar canal'}
          </Button>
        </>
      }
    >
      <form id="channel-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nome do canal">
          <input
            className={inputClass}
            value={name}
            maxLength={40}
            placeholder="Ex.: Magalu"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Comissão (%)">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              inputMode="decimal"
              className={inputClass}
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </Field>
          <Field label="Taxa fixa por venda (R$)">
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={inputClass}
              value={fixedFee}
              onChange={(e) => setFixedFee(e.target.value)}
            />
          </Field>
          <Field label="Imposto sobre venda (%)">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              inputMode="decimal"
              className={inputClass}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />
          </Field>
        </div>
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      </form>
    </Modal>
  );
}
