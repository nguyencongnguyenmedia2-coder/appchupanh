import React, { useState } from 'react';
import {
  RotateCcw,
  Check,
  Calendar,
  MapPin,
  FileText,
  User,
  ShieldCheck,
  Info,
  Building2,
  Layers,
} from 'lucide-react';
import { StampTemplate, WorkItem } from '../../models';
import { formatDateTime } from '../../services/image/stampEngine';

interface ConfirmCaptureModalProps {
  isOpen: boolean;
  previewDataUrl: string;
  originalBlob: Blob;
  initialDateTime: string;
  initialGps: { latitude: number; longitude: number; altitude?: number } | null;
  initialAddress: string;
  gpsSource: 'device' | 'manual' | 'none';
  addressSource: 'geocoded' | 'manual' | 'none';
  initialProjectName?: string;
  workItem?: WorkItem;
  defaultAuthor?: string;
  defaultContractor?: string;
  template: StampTemplate;
  onRetake: () => void;
  onConfirmSave: (data: {
    displayDateTime: string;
    dateTimeSource: 'device' | 'manual' | 'adjusted';
    gpsDisplay: { latitude: number; longitude: number; altitude?: number } | null;
    gpsSource: 'device' | 'manual' | 'none';
    addressDisplay: string;
    addressSource: 'geocoded' | 'manual' | 'none';
    projectName: string;
    author: string;
    contractor: string;
    notes: string;
    saveOriginal: boolean;
  }) => Promise<void>;
}

export const ConfirmCaptureModal: React.FC<ConfirmCaptureModalProps> = ({
  isOpen,
  previewDataUrl,
  initialDateTime,
  initialGps,
  initialAddress,
  gpsSource,
  addressSource,
  initialProjectName = '',
  workItem,
  defaultAuthor = 'Kỹ sư Giám sát',
  defaultContractor = '',
  onRetake,
  onConfirmSave,
}) => {
  const [displayDateTime, setDisplayDateTime] = useState(
    initialDateTime.slice(0, 19)
  );
  const [isCustomTime, setIsCustomTime] = useState(false);

  const [lat, setLat] = useState(initialGps?.latitude?.toString() || '');
  const [lng, setLng] = useState(initialGps?.longitude?.toString() || '');
  const [isCustomGps, setIsCustomGps] = useState(gpsSource === 'manual');

  const [address, setAddress] = useState(initialAddress);
  const [projectName, setProjectName] = useState(initialProjectName);
  const [author, setAuthor] = useState(defaultAuthor);
  const [contractor, setContractor] = useState(defaultContractor);
  const [notes, setNotes] = useState('');
  const [saveOriginal, setSaveOriginal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const hasValidGps = !isNaN(parsedLat) && !isNaN(parsedLng);

      await onConfirmSave({
        displayDateTime: new Date(displayDateTime).toISOString(),
        dateTimeSource: isCustomTime ? 'manual' : 'device',
        gpsDisplay: hasValidGps
          ? { latitude: parsedLat, longitude: parsedLng }
          : null,
        gpsSource: hasValidGps ? (isCustomGps ? 'manual' : 'device') : 'none',
        addressDisplay: address.trim(),
        addressSource: address.trim() !== initialAddress ? 'manual' : addressSource,
        projectName: projectName.trim(),
        author: author.trim(),
        contractor: contractor.trim(),
        notes: notes.trim(),
        saveOriginal,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-5 backdrop-blur-md animate-in fade-in">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-400" />
            <h3 className="font-bold text-white text-base sm:text-lg">
              Xem trước & Xác nhận thông tin đóng dấu
            </h3>
          </div>
          {workItem && (
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {workItem.name}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2">
          {/* Stamped Photo Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-950 p-4">
            <img
              src={previewDataUrl}
              alt="Ảnh đã đóng dấu"
              className="max-h-[60vh] w-auto rounded-lg border border-slate-800 object-contain shadow-lg"
            />
            <p className="mt-2 text-center text-xs text-slate-400">
              Dấu ngày giờ và GPS được ghi trực tiếp vào pixel của ảnh.
            </p>
          </div>

          {/* Form to tweak timestamp / GPS / Address / Notes */}
          <div className="space-y-4 p-5 text-xs text-slate-300">
            {/* Optional Project / Site Name */}
            <div>
              <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-sky-400" />
                <span>Tên công trình / Địa điểm (Tùy chọn)</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="VD: Cầu An Phú, Tòa nhà Landmark..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Date Time Section */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
                  <Calendar className="h-3.5 w-3.5 text-sky-400" />
                  <span>Ngày & Giờ chụp</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTime(!isCustomTime)}
                  className={`text-[11px] font-semibold underline ${
                    isCustomTime ? 'text-amber-400' : 'text-sky-400'
                  }`}
                >
                  {isCustomTime ? 'Đang chỉnh sửa thủ công' : 'Chỉnh sửa giờ'}
                </button>
              </div>

              {isCustomTime ? (
                <input
                  type="datetime-local"
                  value={displayDateTime}
                  onChange={(e) => setDisplayDateTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-amber-500/50 bg-slate-800 p-2 text-white focus:outline-none"
                />
              ) : (
                <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-2">
                  <span className="font-mono text-white">
                    {formatDateTime(displayDateTime, 'DD/MM/YYYY', '24h', true)}
                  </span>
                  <span className="rounded bg-sky-950 px-1.5 py-0.5 text-[10px] text-sky-400 border border-sky-800">
                    Thời gian thiết bị
                  </span>
                </div>
              )}
            </div>

            {/* GPS Section */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
                  <MapPin className="h-3.5 w-3.5 text-sky-400" />
                  <span>Tọa độ GPS</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomGps(!isCustomGps)}
                  className={`text-[11px] font-semibold underline ${
                    isCustomGps ? 'text-amber-400' : 'text-sky-400'
                  }`}
                >
                  {isCustomGps ? 'Đang sửa tọa độ' : 'Sửa GPS thủ công'}
                </button>
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Vĩ độ (Latitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => {
                      setLat(e.target.value);
                      setIsCustomGps(true);
                    }}
                    placeholder="10.762622"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Kinh độ (Longitude)</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => {
                      setLng(e.target.value);
                      setIsCustomGps(true);
                    }}
                    placeholder="106.660172"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-200">
                Địa chỉ hiển thị
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ hiện trường..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white focus:outline-none"
              />
            </div>

            {/* Author & Contractor */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="flex items-center gap-1 font-bold text-slate-300">
                  <User className="h-3 w-3 text-sky-400" />
                  <span>Người chụp</span>
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300">Đơn vị / Nhà thầu</label>
                <input
                  type="text"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  placeholder="VD: Delta, Coteccons..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Field Notes */}
            <div>
              <label className="flex items-center gap-1 font-bold text-slate-300">
                <FileText className="h-3 w-3 text-amber-400" />
                <span>Ghi chú công việc</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Kiểm tra cốt thép dầm D2, độ võng đạt chuẩn..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white focus:outline-none"
              />
            </div>

            {/* Checkbox: Save clean original */}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 p-2.5">
              <input
                type="checkbox"
                checked={saveOriginal}
                onChange={(e) => setSaveOriginal(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-sky-600 focus:ring-0"
              />
              <div className="text-[11px]">
                <span className="font-semibold text-white">
                  Lưu kèm bản ảnh gốc sạch (Clean photo)
                </span>
                <p className="text-slate-400">
                  Cho phép chỉnh sửa lại thông tin đóng dấu trong tương lai mà không bị chồng dấu cũ.
                </p>
              </div>
            </label>

            {/* Disclaimer pill */}
            <div className="flex items-start gap-2 rounded-xl bg-slate-950 p-2.5 text-[11px] text-slate-400">
              <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Ảnh và dấu được lưu an toàn tại bộ nhớ thiết bị của bạn.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-5 py-3">
          <button
            type="button"
            onClick={onRetake}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Chụp lại</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{isSaving ? 'Đang lưu ảnh...' : 'Xác nhận & Lưu ảnh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
