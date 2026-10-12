import React, { useState } from 'react';
import { X, Clock, Plus, Minus, Save } from 'lucide-react';
import { PhotoRecord } from '../../models';
import { db } from '../../storage/db';
import { getPhotoBlob, savePhotoBlob } from '../../storage/blobStorage';
import { processAndStampPhoto, StampRenderMetadata } from '../../services/image/stampEngine';

interface BatchTimeAdjustModalProps {
  isOpen: boolean;
  selectedPhotos: PhotoRecord[];
  onClose: () => void;
  onCompleted: () => void;
}

export const BatchTimeAdjustModal: React.FC<BatchTimeAdjustModalProps> = ({
  isOpen,
  selectedPhotos,
  onClose,
  onCompleted,
}) => {
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [amount, setAmount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedPhotos.length });

    try {
      const multiplier = operation === 'add' ? 1 : -1;
      let msOffset = 0;
      if (unit === 'minutes') msOffset = amount * 60 * 1000 * multiplier;
      else if (unit === 'hours') msOffset = amount * 60 * 60 * 1000 * multiplier;
      else if (unit === 'days') msOffset = amount * 24 * 60 * 60 * 1000 * multiplier;

      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        setProgress({ current: i + 1, total: selectedPhotos.length });

        const originalDate = new Date(photo.displayDateTime);
        const newDate = new Date(originalDate.getTime() + msOffset);
        const newIso = newDate.toISOString();

        // Get source photo blob (prefer clean original if stored)
        const sourceBlob = await getPhotoBlob(
          photo.originalPhotoBlobId || photo.stampedPhotoBlobId
        );
        if (sourceBlob) {
          const meta: StampRenderMetadata = {
            displayDateTime: newIso,
            dateTimeSource: 'adjusted',
            gps: photo.gpsDisplay,
            gpsSource: photo.gpsSource,
            address: photo.addressDisplay,
            addressSource: photo.addressSource,
            author: photo.author,
            contractor: photo.contractor,
            notes: photo.notes,
            photoId: photo.id,
          };

          const result = await processAndStampPhoto(
            sourceBlob,
            meta,
            photo.templateSnapshot
          );

          // Update stamped blob
          await savePhotoBlob(
            photo.stampedPhotoBlobId,
            photo.id,
            'stamped',
            result.stampedBlob,
            'image/jpeg'
          );

          // Update thumbnail blob
          await savePhotoBlob(
            photo.thumbnailBlobId,
            photo.id,
            'thumbnail',
            result.thumbnailBlob,
            'image/jpeg'
          );

          // Update database record
          const updated: PhotoRecord = {
            ...photo,
            displayDateTime: newIso,
            dateTimeSource: 'adjusted',
            sha256Hash: result.sha256Hash,
            updatedAt: new Date().toISOString(),
          };
          await db.photos.put(updated);
        }
      }

      onCompleted();
      onClose();
    } catch (err: any) {
      alert('Lỗi điều chỉnh thời gian hàng loạt: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Điều chỉnh ngày giờ hàng loạt
              </h3>
              <p className="text-xs text-slate-400">
                Áp dụng cho {selectedPhotos.length} ảnh đã chọn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Operation: Add or Subtract */}
          <div>
            <label className="block font-semibold text-slate-300">Thao tác</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOperation('add')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition-colors ${
                  operation === 'add'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Cộng thêm thời gian</span>
              </button>

              <button
                type="button"
                onClick={() => setOperation('subtract')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition-colors ${
                  operation === 'subtract'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400'
                }`}
              >
                <Minus className="h-4 w-4" />
                <span>Trừ bớt thời gian</span>
              </button>
            </div>
          </div>

          {/* Amount and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300">Số lượng</label>
              <input
                type="number"
                min="1"
                max="999"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Đơn vị</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              >
                <option value="minutes">Phút</option>
                <option value="hours">Giờ</option>
                <option value="days">Ngày</option>
              </select>
            </div>
          </div>

          {/* Progress bar if processing */}
          {isProcessing && (
            <div className="space-y-1 rounded-xl border border-sky-500/20 bg-sky-950/30 p-3">
              <div className="flex justify-between text-[11px] text-sky-300 font-semibold">
                <span>Đang xử lý vẽ lại dấu...</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-150"
                  style={{
                    width: `${(progress.current / Math.max(1, progress.total)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-sky-950 hover:bg-sky-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Áp dụng hàng loạt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
