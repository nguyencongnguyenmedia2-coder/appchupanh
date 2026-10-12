import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Share2, FileCheck } from 'lucide-react';
import { saveAs } from 'file-saver';
import { ReportRecord, Project, PhotoRecord } from '../../models';
import { generateReportPdf } from '../../services/pdf/reportPdfService';
import { db } from '../../storage/db';

interface ReportPdfPreviewModalProps {
  isOpen: boolean;
  report: ReportRecord;
  project?: Project;
  onClose: () => void;
}

export const ReportPdfPreviewModal: React.FC<ReportPdfPreviewModalProps> = ({
  isOpen,
  report,
  project,
  onClose,
}) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const buildPdf = async () => {
      setIsGenerating(true);
      try {
        // Fetch all photos referenced in report
        const photoIds = report.photoItems.map((p) => p.photoId);
        const photoRecords = await db.photos.where('id').anyOf(photoIds).toArray();
        const photoRecordMap = new Map(photoRecords.map((p) => [p.id, p]));

        const matchedPhotos = report.photoItems
          .map((item) => ({
            record: photoRecordMap.get(item.photoId)!,
            caption: item.caption,
            order: item.order,
          }))
          .filter((item) => item.record);

        const blob = await generateReportPdf({
          report,
          project,
          photos: matchedPhotos,
        });

        if (mounted) {
          setPdfBlob(blob);
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (err: any) {
        console.error('Lỗi tạo PDF:', err);
        alert('Lỗi tạo PDF: ' + err.message);
      } finally {
        if (mounted) setIsGenerating(false);
      }
    };

    if (isOpen) {
      buildPdf();
    }

    return () => {
      mounted = false;
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, report.id]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!pdfBlob) return;
    saveAs(pdfBlob, `${report.reportCode}_${report.title.slice(0, 20)}.pdf`);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  };

  const handleShare = async () => {
    if (!pdfBlob) return;
    if (navigator.share) {
      try {
        const file = new File([pdfBlob], `${report.reportCode}.pdf`, {
          type: 'application/pdf',
        });
        await navigator.share({
          title: report.title,
          text: `Báo cáo hiện trường: ${report.title}`,
          files: [file],
        });
      } catch (err) {
        // User canceled or failed
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 sm:p-5 backdrop-blur-md animate-in fade-in">
      <div className="flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Xem trước Báo cáo PDF: {report.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Mã: {report.reportCode} | {report.photoItems.length} ảnh đính kèm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isGenerating || !pdfBlob}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">In báo cáo</span>
            </button>

            <button
              onClick={handleShare}
              disabled={isGenerating || !pdfBlob}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating || !pdfBlob}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-sky-950 hover:bg-sky-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Tải file PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewport */}
        <div className="flex flex-1 items-center justify-center bg-slate-950 p-2 sm:p-4 overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
              <span className="text-sm font-semibold">
                Đang kết xuất báo cáo PDF chuẩn tiếng Việt...
              </span>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Bản xem trước PDF"
              className="h-full w-full rounded-xl border border-slate-800 shadow-2xl"
            />
          ) : (
            <div className="text-sm text-red-400">Không thể tải tệp PDF.</div>
          )}
        </div>
      </div>
    </div>
  );
};
