import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Camera,
  HardDrive,
  Trash2,
  Check,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AppSettings } from '../models';
import { db, getStorageStats, cleanupOrphanBlobs } from '../storage/db';
import { useTheme } from '../hooks/useTheme';
import { formatBytes } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    defaultResolution: '1080p',
    autoSaveOriginal: true,
    defaultTemplateId: 'preset-standard',
    defaultAuthor: 'Kỹ sư Giám sát',
    defaultContractor: 'Delta Construction',
    watermarkDisclaimer: true,
  });

  const [stats, setStats] = useState<{
    photoCount: number;
    projectCount: number;
    reportCount: number;
    estimatedBytesUsed: number;
    quotaBytes: number;
  }>({
    photoCount: 0,
    projectCount: 0,
    reportCount: 0,
    estimatedBytesUsed: 0,
    quotaBytes: 1024 * 1024 * 1024,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [cleanOrphanMsg, setCleanOrphanMsg] = useState('');

  const loadSettingsAndStats = async () => {
    const sRec = await db.settings.get('appSettings');
    if (sRec && sRec.value) {
      setSettings(sRec.value);
    }
    const st = await getStorageStats();
    setStats(st);
  };

  useEffect(() => {
    loadSettingsAndStats();
  }, []);

  const handleSaveSettings = async () => {
    await db.settings.put({ key: 'appSettings', value: settings });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCleanupOrphans = async () => {
    const cleaned = await cleanupOrphanBlobs();
    setCleanOrphanMsg(`Đã dọn dẹp ${cleaned} tệp ảnh mồ côi không tham chiếu.`);
    loadSettingsAndStats();
    setTimeout(() => setCleanOrphanMsg(''), 4000);
  };

  const handleClearAllData = async () => {
    await db.photos.clear();
    await db.photoBlobs.clear();
    await db.projects.clear();
    await db.reports.clear();
    await db.workItems.clear();
    setIsConfirmClearOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-sky-400" />
          <span>Cài đặt Ứng dụng</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Quản lý tùy chọn máy ảnh, giao diện người dùng và dung lượng bộ nhớ thiết bị
        </p>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <Check className="h-4 w-4" />
          <span>Đã lưu cấu hình cài đặt thành công!</span>
        </div>
      )}

      {/* General & Camera Preferences */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
          Tùy chọn Chụp ảnh & Hiện trường
        </h3>

        {/* Resolution selector */}
        <div>
          <label className="block font-semibold text-slate-300">
            Độ phân giải camera mặc định
          </label>
          <select
            value={settings.defaultResolution}
            onChange={(e) =>
              setSettings({ ...settings, defaultResolution: e.target.value as any })
            }
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white"
          >
            <option value="4k">4K Siêu nét (3840 × 2160) — Ưu tiên độ chi tiết</option>
            <option value="1080p">Full HD (1920 × 1080) — Cân bằng & tối ưu dung lượng (Khuyên dùng)</option>
            <option value="720p">HD (1280 × 720) — Tiết kiệm bộ nhớ</option>
          </select>
        </div>

        {/* Auto save clean photo */}
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3 hover:bg-slate-800/60">
          <div>
            <span className="font-semibold text-white block">
              Tự động lưu kèm ảnh gốc sạch (Clean photo)
            </span>
            <span className="text-slate-400 text-[11px]">
              Cho phép chỉnh sửa lại thông tin đóng dấu trong tương lai mà không bị chồng dấu cũ
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.autoSaveOriginal}
            onChange={(e) =>
              setSettings({ ...settings, autoSaveOriginal: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-700 text-sky-600 focus:ring-0"
          />
        </label>

        {/* Default Author and Contractor */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-slate-300">
              Người chụp mặc định
            </label>
            <input
              type="text"
              value={settings.defaultAuthor}
              onChange={(e) =>
                setSettings({ ...settings, defaultAuthor: e.target.value })
              }
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300">
              Đơn vị / Nhà thầu mặc định
            </label>
            <input
              type="text"
              value={settings.defaultContractor}
              onChange={(e) =>
                setSettings({ ...settings, defaultContractor: e.target.value })
              }
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSaveSettings}
          className="rounded-xl bg-sky-600 px-5 py-2 font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-950"
        >
          Lưu cài đặt
        </button>
      </div>

      {/* Storage and Cleanup Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-indigo-400" />
          <span>Thống kê Dung lượng & Dọn dẹp Bộ nhớ</span>
        </h3>

        <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Dung lượng đã sử dụng:</span>
            <span className="font-bold text-white">{formatBytes(stats.estimatedBytesUsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tổng số tệp ảnh:</span>
            <span className="font-bold text-white">{stats.photoCount} ảnh</span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-sky-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((stats.estimatedBytesUsed / Math.max(1, stats.quotaBytes)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>

        {cleanOrphanMsg && (
          <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-2.5 text-sky-400">
            {cleanOrphanMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleCleanupOrphans}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700 font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
            <span>Dọn dẹp ảnh mồ côi</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-red-400">Khu vực nguy hiểm</h3>
        <p className="text-slate-300 leading-relaxed">
          Xóa toàn bộ ảnh, công trình và báo cáo hiện có trong cơ sở dữ liệu trên thiết bị này. Thao tác này không thể hoàn tác.
        </p>

        <button
          onClick={() => setIsConfirmClearOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/20 px-4 py-2 font-bold text-red-400 hover:bg-red-600/30"
        >
          <Trash2 className="h-4 w-4" />
          <span>Xóa sạch toàn bộ dữ liệu</span>
        </button>
      </div>

      {/* Double Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Xóa sạch toàn bộ dữ liệu ứng dụng?"
        message="Hành động này sẽ xóa toàn bộ các dự án, ảnh đã chụp và báo cáo trên thiết bị của bạn. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Tôi hiểu, xóa toàn bộ"
        onConfirm={handleClearAllData}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
