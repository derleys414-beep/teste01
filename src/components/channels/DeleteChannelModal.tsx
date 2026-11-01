import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { deleteChannel } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

export function DeleteChannelModal({
  channelId,
  channelName,
  onClose,
  onDeleted,
}: {
  channelId: string;
  channelName: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteChannel(channelId);
      onDeleted();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <Modal
      title={`Excluir canal ${channelName}?`}
      description="As taxas e os preços deste canal em cada produto serão removidos."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={deleting} className="bg-rose-600 shadow-rose-600/20 hover:bg-rose-700 disabled:bg-rose-300">
            {deleting ? 'Excluindo...' : 'Excluir canal'}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">
        Canais que já têm vendas registradas não podem ser excluídos, para preservar o histórico de lucro. Essa ação não pode ser desfeita.
      </p>
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}
