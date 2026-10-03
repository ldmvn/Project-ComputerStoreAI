import type { Banner } from '@/types/banner.type';
import Modal from '@/components/ui/Modal';

export default function BannerDeleteDialog({ banner, busy, error, onClose, onConfirm }: {
  banner: Banner; busy: boolean; error: string; onClose: () => void; onConfirm: () => void;
}) {
  return <Modal title="Xóa banner" onClose={onClose} busy={busy}>
    <p className="text-slate-600">Xóa “{banner.name}” và media đã upload? Banner sẽ không còn xuất hiện trên Home.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={busy} className="ui-button ui-button--neutral rounded-lg border px-4 py-2 disabled:opacity-50">Hủy</button><button type="button" onClick={onConfirm} disabled={busy} className="ui-button ui-button--danger rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-50">{busy ? 'Đang xóa…' : 'Xóa banner'}</button></div>
  </Modal>;
}
