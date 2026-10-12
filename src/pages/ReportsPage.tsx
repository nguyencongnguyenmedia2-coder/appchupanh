import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  Trash2,
  Edit,
  FolderKanban,
  Calendar,
  Layers,
} from 'lucide-react';
import { ReportRecord, WorkItem } from '../models';
import { db } from '../storage/db';
import { ReportFormModal } from '../components/reports/ReportFormModal';
import { ReportPdfPreviewModal } from '../components/reports/ReportPdfPreviewModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatDateVi } from '../utils/formatters';

interface ReportsPageProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = () => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<ReportRecord | null>(null);

  const [pdfPreviewReport, setPdfPreviewReport] = useState<ReportRecord | null>(null);
  const [reportToDelete, setReportToDelete] = useState<ReportRecord | null>(null);

  const loadData = async () => {
    const [rList, items] = await Promise.all([
      db.reports.reverse().sortBy('createdAt'),
      db.workItems.toArray(),
    ]);

    setReports(rList);
    setWorkItems(items);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.reportCode.toLowerCase().includes(q) ||
      r.author.toLowerCase().includes(q) ||
      (r.projectName && r.projectName.toLowerCase().includes(q))
    );
  });

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    await db.reports.delete(reportToDelete.id);
    setReportToDelete(null);
    loadData();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-sky-400" />
            <span>Quản lý Báo cáo Hiện trường & Xuất PDF</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tạo báo cáo nghiệm thu, kiểm tra an toàn, tiến độ thi công kèm hình ảnh minh chứng có dấu ngày giờ
          </p>
        </div>

        <button
          onClick={() => {
            setReportToEdit(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-950 hover:bg-sky-500 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Lập báo cáo mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề báo cáo, công trình, mã số, người lập..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300">
            Chưa có báo cáo nào
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Nhấn "Lập báo cáo mới" để tạo báo cáo kiểm tra hiện trường và xuất file PDF.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => {
            return (
              <div
                key={report.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-sky-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-400 border border-sky-800">
                        {report.reportCode}
                      </span>
                      <h3 className="mt-2 text-base font-bold text-white line-clamp-1">
                        {report.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                      {report.photoItems.length} ảnh
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                    {report.projectName && (
                      <div className="flex items-center gap-1.5 font-medium text-sky-400">
                        <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{report.projectName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Ngày: {formatDateVi(report.reportDate)}</span>
                    </div>

                    <div className="text-slate-300 line-clamp-2 pt-1 text-[11px]">
                      {report.workContent}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <button
                    onClick={() => setPdfPreviewReport(report)}
                    className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 shadow-md shadow-sky-950"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Xem & Xuất PDF</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setReportToEdit(report);
                        setIsFormOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Chỉnh sửa nội dung"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setReportToDelete(report)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                      title="Xóa báo cáo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <ReportFormModal
        isOpen={isFormOpen}
        reportToEdit={reportToEdit}
        workItems={workItems}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => loadData()}
      />

      {/* PDF Preview Modal */}
      {pdfPreviewReport && (
        <ReportPdfPreviewModal
          isOpen={true}
          report={pdfPreviewReport}
          onClose={() => setPdfPreviewReport(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!reportToDelete}
        title="Xác nhận xóa báo cáo"
        message={`Bạn có chắc chắn muốn xóa báo cáo "${reportToDelete?.title}" (${reportToDelete?.reportCode})? Các ảnh đính kèm vẫn được bảo toàn trong thư viện.`}
        confirmLabel="Xóa báo cáo"
        onConfirm={handleDeleteReport}
        onCancel={() => setReportToDelete(null)}
      />
    </div>
  );
};
