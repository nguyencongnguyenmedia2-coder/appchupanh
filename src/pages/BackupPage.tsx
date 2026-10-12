import React, { useState } from 'react';
import {
  HardDriveDownload,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  FileArchive,
  ShieldAlert,
} from 'lucide-react';
import {
  downloadBackupZip,
  importBackupZip,
  ImportBackupResult,
} from '../services/backup/backupService';

export const BackupPage: React.FC = () => {
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [onConflict, setOnConflict] = useState<'skip' | 'overwrite'>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importResult, setImportResult] = useState<ImportBackupResult | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage('Đang chuẩn bị dữ liệu sao lưu...');
    try {
      await downloadBackupZip(undefined, (_curr, _tot, msg) => {
        setExportMessage(msg);
      });
    } catch (err: any) {
      alert('Lỗi xuất sao lưu: ' + err.message);
    } finally {
      setIsExporting(false);
      setExportMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportProgress('Đang nạp và kiểm tra tệp ZIP...');
    setImportResult(null);

    try {
      const result = await importBackupZip(importFile, {
        onConflict,
        onProgress: (curr, tot, msg) => {
          setImportProgress(msg);
        },
      });
      setImportResult(result);
    } catch (err: any) {
      alert('Lỗi nhập dữ liệu: ' + err.message);
    } finally {
      setIsImporting(false);
      setImportProgress('');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <HardDriveDownload className="h-6 w-6 text-sky-400" />
          <span>Sao lưu & Khôi phục Dữ liệu Cục bộ</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Đóng gói toàn bộ cơ sở dữ liệu và ảnh hiện trường thành tệp ZIP an toàn để lưu trữ hoặc chuyển sang máy khác
        </p>
      </div>

      {/* Warning Box */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">
              Cảnh báo quan trọng về lưu trữ Local-First:
            </h4>
            <p className="leading-relaxed">
              Ứng dụng không tự động tải dữ liệu của bạn lên bất kỳ máy chủ đám mây nào nhằm bảo mật tuyệt đối ảnh hiện trường. Dữ liệu có thể bị xóa nếu bạn chủ động xóa lịch sử/dữ liệu trang web của trình duyệt hoặc gỡ cài đặt ứng dụng. Hãy thường xuyên xuất tệp sao lưu ZIP để bảo vệ dữ liệu công trình.
            </p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-sky-500/10 p-2 text-sky-400">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Xuất gói sao lưu (Export ZIP)</h3>
            <p className="text-xs text-slate-400">
              Nén toàn bộ dữ liệu, báo cáo, mẫu dấu và ảnh hiện trường thành tệp lưu trữ
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-300">
            Tải về trọn vẹn tệp nén ZIP bao gồm cơ sở dữ liệu ảnh, báo cáo hiện trường và cấu hình mẫu dấu để lưu trữ an toàn hoặc chuyển thiết bị.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-sky-950 hover:bg-sky-500 disabled:opacity-50 text-xs shrink-0"
          >
            <FileArchive className="h-4 w-4" />
            <span>{isExporting ? exportMessage || 'Đang đóng gói...' : 'Tải xuống tệp Sao lưu .ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Khôi phục từ tệp sao lưu (Import ZIP)</h3>
            <p className="text-xs text-slate-400">
              Nhập lại công trình, ảnh và báo cáo từ tệp .ZIP đã xuất trước đó
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* File Picker */}
          <div>
            <label className="block font-semibold text-slate-300">Chọn tệp ZIP sao lưu</label>
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-600"
            />
          </div>

          {/* Conflict resolution option */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
            <span className="block font-semibold text-white mb-2">
              Xử lý khi phát hiện dữ liệu trùng lặp ID:
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="conflict"
                  checked={onConflict === 'skip'}
                  onChange={() => setOnConflict('skip')}
                  className="text-sky-500"
                />
                <span className="text-slate-300">Bỏ qua dữ liệu trùng (Giữ nguyên hiện tại)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="conflict"
                  checked={onConflict === 'overwrite'}
                  onChange={() => setOnConflict('overwrite')}
                  className="text-sky-500"
                />
                <span className="text-slate-300">Ghi đè dữ liệu trùng</span>
              </label>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-emerald-950 hover:bg-emerald-500 disabled:opacity-50 text-xs"
          >
            <Upload className="h-4 w-4" />
            <span>{isImporting ? importProgress || 'Đang khôi phục...' : 'Bắt đầu Khôi phục Dữ liệu'}</span>
          </button>

          {/* Import Result Notification */}
          {importResult && (
            <div
              className={`rounded-xl border p-4 space-y-2 ${
                importResult.success
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>
                  {importResult.success
                    ? 'Khôi phục dữ liệu thành công!'
                    : 'Khôi phục thất bại có lỗi xảy ra'}
                </span>
              </div>
              <div className="text-xs space-y-0.5">
                <p>Công trình đã nạp: {importResult.importedProjects}</p>
                <p>Ảnh đã phục hồi: {importResult.importedPhotos}</p>
                <p>Báo cáo đã nạp: {importResult.importedReports}</p>
                {importResult.skippedCount > 0 && (
                  <p>Số bản ghi đã bỏ qua do trùng: {importResult.skippedCount}</p>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="text-xs text-red-400 mt-2">
                  <p className="font-semibold">Chi tiết lỗi:</p>
                  <ul className="list-disc pl-4">
                    {importResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
