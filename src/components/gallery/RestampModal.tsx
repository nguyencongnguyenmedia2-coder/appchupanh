import React, { useState, useEffect } from 'react';
import {
  X,
  Stamp,
  RotateCcw,
  Check,
  AlertTriangle,
  Calendar,
  MapPin,
  Save,
} from 'lucide-react';
import { PhotoRecord, StampTemplate, Project, WorkItem } from '../../models';
import { db } from '../../storage/db';
import { getPhotoBlob, savePhotoBlob } from '../../storage/blobStorage';
import { processAndStampPhoto, StampRenderMetadata } from '../../services/image/stampEngine';

interface RestampModalProps {
  isOpen: boolean;
  photo: PhotoRecord;
  projects: Project[];
  workItems: WorkItem[];
  onClose: () => void;
  onSaved: (updatedPhoto: PhotoRecord) => void;
}

export const RestampModal: React.FC<RestampModalProps> = ({
  isOpen,
  photo,
  projects,
  workItems,
  onClose,
  onSaved,
}) => {
  const [displayDateTime, setDisplayDateTime] = useState(
    photo.displayDateTime.slice(0, 19)
  );
  const [lat, setLat] = useState(photo.gpsDisplay?.latitude?.toString() || '');
  const [lng, setLng] = useState(photo.gpsDisplay?.longitude?.toString() || '');
  const [address, setAddress] = useState(photo.addressDisplay || '');
  const [projectId, setProjectId] = useState(photo.projectId || '');
  const [workItemId, setWorkItemId] = useState(photo.workItemId || '');
  const [author, setAuthor] = useState(photo.author || '');
  const [contractor, setContractor] = useState(photo.contractor || '');
  const [notes, setNotes] = useState(photo.notes || '');

  const [templates, setTemplates] = useState<StampTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    photo.templateSnapshot?.id || ''
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [saveAsNew, setSaveAsNew] = useState(false);

  useEffect(() => {
    db.stampTemplates.toArray().then((list) => {
      setTemplates(list);
      if (!selectedTemplateId && list.length > 0) {
        setSelectedTemplateId(list[0].id);
      }
    });
  }, []);

  if (!isOpen) return null;

  const hasCleanOriginal = !!photo.originalPhotoBlobId;

  const handleApplyRestamp = async () => {
    setIsProcessing(true);
    try {
      // 1. Get source blob: prefer clean original photo if stored!
      let sourceBlob = await getPhotoBlob(
        photo.originalPhotoBlobId || photo.stampedPhotoBlobId
      );
      if (!sourceBlob) {
        throw new Error('Không tìm thấy tệp ảnh gốc trong bộ nhớ.');
      }

      // 2. Select template
      const template =
        templates.find((t) => t.id === selectedTemplateId) || photo.templateSnapshot;

      const selectedProj = projects.find((p) => p.id === projectId);
      const selectedItem = workItems.find((w) => w.id === workItemId);

      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const hasGps = !isNaN(parsedLat) && !isNaN(parsedLng);

      const newPhotoId = saveAsNew ? `img-${Date.now()}` : photo.id;

      // 3. Render fresh stamp
      const meta: StampRenderMetadata = {
        displayDateTime: new Date(displayDateTime).toISOString(),
        dateTimeSource:
          new Date(displayDateTime).toISOString() !== photo.capturedAtOriginal
            ? 'manual'
            : 'device',
        gps: hasGps ? { latitude: parsedLat, longitude: parsedLng } : null,
        gpsSource: hasGps ? 'manual' : 'none',
        address: address.trim(),
        addressSource: address.trim() !== photo.addressOriginal ? 'manual' : 'geocoded',
        projectName: selectedProj?.name,
        projectCode: selectedProj?.code,
        workItemName: selectedItem?.name,
        author: author.trim(),
        contractor: contractor.trim(),
        notes: notes.trim(),
        photoId: newPhotoId,
      };

      const result = await processAndStampPhoto(sourceBlob, meta, template);

      // 4. Save new or updated blobs
      const stampedBlobId = `stamped-${newPhotoId}`;
      const thumbBlobId = `thumb-${newPhotoId}`;

      await savePhotoBlob(
        stampedBlobId,
        newPhotoId,
        'stamped',
        result.stampedBlob,
        'image/jpeg'
      );
      await savePhotoBlob(
        thumbBlobId,
        newPhotoId,
        'thumbnail',
        result.thumbnailBlob,
        'image/jpeg'
      );

      let originalBlobId = photo.originalPhotoBlobId;
      if (saveAsNew && photo.originalPhotoBlobId) {
        originalBlobId = `orig-${newPhotoId}`;
        await savePhotoBlob(
          originalBlobId,
          newPhotoId,
          'original',
          sourceBlob,
          'image/jpeg'
        );
      }

      const nowIso = new Date().toISOString();
      const updatedRecord: PhotoRecord = {
        ...photo,
        id: newPhotoId,
        projectId: projectId || undefined,
        workItemId: workItemId || undefined,
        displayDateTime: new Date(displayDateTime).toISOString(),
        dateTimeSource: 'manual',
        gpsDisplay: hasGps ? { latitude: parsedLat, longitude: parsedLng } : null,
        gpsSource: hasGps ? 'manual' : 'none',
        addressDisplay: address.trim(),
        addressSource: 'manual',
        author: author.trim(),
        contractor: contractor.trim(),
        notes: notes.trim(),
        stampedPhotoBlobId: stampedBlobId,
        thumbnailBlobId: thumbBlobId,
        originalPhotoBlobId: originalBlobId,
        templateSnapshot: template,
        sha256Hash: result.sha256Hash,
        updatedAt: nowIso,
        createdAt: saveAsNew ? nowIso : photo.createdAt,
      };

      await db.photos.put(updatedRecord);
      onSaved(updatedRecord);
      onClose();
    } catch (err: any) {
      alert('Lỗi chỉnh sửa dấu ảnh: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Stamp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Chỉnh sửa thông tin đóng dấu
              </h3>
              <p className="text-xs text-slate-400">
                Tạo lại dấu pixel trên ảnh theo cấu hình mới
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

        {/* Warning if no clean original */}
        {!hasCleanOriginal && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <span>
              Ảnh này không lưu bản gốc sạch (clean photo). Việc đóng dấu lại có thể ghi đè lên nền dấu cũ.
            </span>
          </div>
        )}

        <div className="mt-4 space-y-4 text-xs">
          {/* Template select */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300">
              Mẫu đóng dấu áp dụng
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white focus:outline-none"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.position})
                </option>
              ))}
            </select>
          </div>

          {/* Project & Work Item */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300">Dự án</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              >
                <option value="">-- Chưa chọn --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Hạng mục</label>
              <select
                value={workItemId}
                onChange={(e) => setWorkItemId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              >
                <option value="">-- Chưa chọn --</option>
                {workItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Time */}
          <div>
            <label className="flex items-center gap-1 font-semibold text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              <span>Thời gian hiển thị trên ảnh</span>
            </label>
            <input
              type="datetime-local"
              value={displayDateTime}
              onChange={(e) => setDisplayDateTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
            />
          </div>

          {/* GPS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 font-semibold text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                <span>Vĩ độ (Lat)</span>
              </label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="10.762622"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300">Kinh độ (Lng)</label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="106.660172"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block font-semibold text-slate-300">Địa chỉ hiển thị</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
            />
          </div>

          {/* Author & Contractor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300">Người chụp</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300">Đơn vị / Nhà thầu</label>
              <input
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-300">Ghi chú hiện trường</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
            />
          </div>

          {/* Save Mode: Overwrite vs New */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
            <span className="block font-semibold text-white mb-2">Phương thức lưu:</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="saveMode"
                  checked={!saveAsNew}
                  onChange={() => setSaveAsNew(false)}
                  className="text-sky-500"
                />
                <span className="text-slate-300">Ghi đè ảnh hiện tại</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="saveMode"
                  checked={saveAsNew}
                  onChange={() => setSaveAsNew(true)}
                  className="text-sky-500"
                />
                <span className="text-slate-300">Lưu thành bản ảnh mới</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApplyRestamp}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-950 hover:bg-sky-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isProcessing ? 'Đang vẽ lại dấu...' : 'Xuất lại dấu ảnh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
