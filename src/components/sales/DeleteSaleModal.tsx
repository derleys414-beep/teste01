import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { deleteSale } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';

export function DeleteSaleModal({
  saleId,
  productName,
  channelName,
  soldAt,
  onClose,
  onDeleted,
}: {
  saleId: string;
  productName: string;
  channelName: string;
  soldAt: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteSale(saleId);
      onDeleted();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      title="Excluir venda?"
      description={`${productName} vendido em ${channelName} no dia ${formatDate(soldAt)}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={deleting} className="bg-rose-600 shadow-rose-600/20 hover:bg-rose-700 disabled:bg-rose-300">
            {deleting ? 'Excluindo...' : 'Excluir venda'}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">
        A venda deixa de contar no faturamento, no lucro e na margem dos relatórios e do painel. Essa ação não pode ser desfeita.
      </p>
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}
