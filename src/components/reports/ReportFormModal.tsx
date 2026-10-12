import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import {
  ReportRecord,
  ReportType,
  Project,
  WorkItem,
  PhotoRecord,
  ReportPhotoItem,
} from '../../models';
import { db } from '../../storage/db';
import { getPhotoBlobUrl } from '../../storage/blobStorage';

interface ReportFormModalProps {
  isOpen: boolean;
  reportToEdit?: ReportRecord | null;
  workItems: WorkItem[];
  onClose: () => void;
  onSaved: (report: ReportRecord) => void;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  reportToEdit,
  workItems,
  onClose,
  onSaved,
}) => {
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [workItemId, setWorkItemId] = useState('');
  const [reportCode, setReportCode] = useState('');
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [title, setTitle] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [author, setAuthor] = useState('Kỹ sư Giám sát');
  const [workContent, setWorkContent] = useState('');
  const [progressPercentage, setProgressPercentage] = useState<number>(100);
  const [issuesToResolve, setIssuesToResolve] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [notes, setNotes] = useState('');
  const [layoutColumns, setLayoutColumns] = useState<1 | 2 | 4>(2);
  const [preparedBy, setPreparedBy] = useState('Kỹ sư Giám sát');
  const [reviewedBy, setReviewedBy] = useState('Cán bộ Giám sát');
  const [approvedBy, setApprovedBy] = useState('Chỉ huy trưởng');

  // Photo attachments selection
  const [availablePhotos, setAvailablePhotos] = useState<PhotoRecord[]>([]);
  const [selectedPhotoItems, setSelectedPhotoItems] = useState<ReportPhotoItem[]>([]);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [photoThumbMap, setPhotoThumbMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (reportToEdit) {
      setProjectId(reportToEdit.projectId || '');
      setProjectName(reportToEdit.projectName || '');
      setWorkItemId(reportToEdit.workItemId || '');
      setReportCode(reportToEdit.reportCode);
      setReportType(reportToEdit.reportType);
      setTitle(reportToEdit.title);
      setReportDate(reportToEdit.reportDate);
      setAuthor(reportToEdit.author);
      setWorkContent(reportToEdit.workContent);
      setProgressPercentage(reportToEdit.progressPercentage ?? 100);
      setIssuesToResolve(reportToEdit.issuesToResolve || '');
      setRecommendations(reportToEdit.recommendations || '');
      setNotes(reportToEdit.notes || '');
      setLayoutColumns(reportToEdit.layoutColumns || 2);
      setPreparedBy(reportToEdit.signatureInfo?.preparedBy || 'Kỹ sư Giám sát');
      setReviewedBy(reportToEdit.signatureInfo?.reviewedBy || '');
      setApprovedBy(reportToEdit.signatureInfo?.approvedBy || '');
      setSelectedPhotoItems(reportToEdit.photoItems || []);
    } else {
      const now = new Date();
      setProjectId('');
      setProjectName('');
      setWorkItemId('');
      setReportCode(`BC-${now.getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`);
      setReportType('daily');
      setTitle('Báo cáo công việc hiện trường');
      setReportDate(now.toISOString().slice(0, 10));
      setAuthor('Kỹ sư Giám sát');
      setWorkContent('Tiến hành thi công và kiểm tra chất lượng theo đúng hồ sơ thiết kế.');
      setProgressPercentage(100);
      setIssuesToResolve('');
      setRecommendations('');
      setNotes('');
      setLayoutColumns(2);
      setPreparedBy('Kỹ sư Giám sát');
      setReviewedBy('Cán bộ Giám sát');
      setApprovedBy('Chỉ huy trưởng');
      setSelectedPhotoItems([]);
    }
  }, [reportToEdit, isOpen]);

  // Load available photos
  useEffect(() => {
    if (!isOpen) return;
    db.photos
      .reverse()
      .sortBy('createdAt')
      .then(async (photos) => {
        setAvailablePhotos(photos);
        const thumbMap: Record<string, string> = {};
        for (const p of photos) {
          const url = await getPhotoBlobUrl(p.thumbnailBlobId || p.stampedPhotoBlobId);
          if (url) thumbMap[p.id] = url;
        }
        setPhotoThumbMap(thumbMap);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePhotoInReport = (photoId: string) => {
    const exists = selectedPhotoItems.some((item) => item.photoId === photoId);
    if (exists) {
      setSelectedPhotoItems(selectedPhotoItems.filter((item) => item.photoId !== photoId));
    } else {
      const photoRec = availablePhotos.find((p) => p.id === photoId);
      setSelectedPhotoItems([
        ...selectedPhotoItems,
        {
          photoId,
          caption: photoRec?.title || 'Ảnh kiểm tra hiện trường',
          order: selectedPhotoItems.length + 1,
        },
      ]);
    }
  };

  const handleUpdateCaption = (photoId: string, caption: string) => {
    setSelectedPhotoItems(
      selectedPhotoItems.map((item) =>
        item.photoId === photoId ? { ...item, caption } : item
      )
    );
  };

  const handleRemovePhoto = (photoId: string) => {
    setSelectedPhotoItems(selectedPhotoItems.filter((item) => item.photoId !== photoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề báo cáo.');
      return;
    }

    const nowIso = new Date().toISOString();
    const report: ReportRecord = {
      id: reportToEdit ? reportToEdit.id : `rep-${Date.now()}`,
      reportCode: reportCode.trim(),
      reportType,
      projectId: projectId || 'default',
      projectName: projectName.trim() || undefined,
      workItemId: workItemId || undefined,
      title: title.trim(),
      reportDate: reportDate || nowIso.slice(0, 10),
      author: author.trim(),
      workContent: workContent.trim(),
      progressPercentage,
      issuesToResolve: issuesToResolve.trim(),
      recommendations: recommendations.trim(),
      notes: notes.trim(),
      layoutColumns,
      photoItems: selectedPhotoItems,
      signatureInfo: {
        preparedBy: preparedBy.trim(),
        reviewedBy: reviewedBy.trim(),
        approvedBy: approvedBy.trim(),
      },
      createdAt: reportToEdit ? reportToEdit.createdAt : nowIso,
      updatedAt: nowIso,
    };

    await db.reports.put(report);
    onSaved(report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-sm animate-in fade-in">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white sm:text-lg">
                {reportToEdit ? 'Chỉnh sửa Báo cáo' : 'Lập Báo cáo Hiện trường'}
              </h3>
              <p className="text-xs text-slate-400">
                Xuất file PDF chuyên nghiệp hỗ trợ font chữ tiếng Việt
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Top row: Project/Site, Type, Code, Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block font-semibold text-slate-300">
                Tên công trình / Địa điểm
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="VD: Vinhome Central Park, Cầu vượt..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Loại báo cáo</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              >
                <option value="daily">Báo cáo công việc hằng ngày</option>
                <option value="progress">Báo cáo tiến độ</option>
                <option value="inspection">Báo cáo kiểm tra hiện trường</option>
                <option value="safety">Báo cáo an toàn (HSE)</option>
                <option value="defect">Báo cáo lỗi & khắc phục</option>
                <option value="acceptance">Nghiệm thu bàn giao</option>
                <option value="incident">Báo cáo sự cố</option>
                <option value="custom">Báo cáo tùy chỉnh</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Mã báo cáo</label>
              <input
                type="text"
                value={reportCode}
                onChange={(e) => setReportCode(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Ngày lập báo cáo</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300">
                Tiêu đề báo cáo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Nghiệm thu cốt thép sàn tầng 8 phân đoạn 2..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Người lập báo cáo</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          {/* Work Content */}
          <div>
            <label className="block font-semibold text-slate-300">
              Nội dung công việc & Hiện trường
            </label>
            <textarea
              rows={3}
              value={workContent}
              onChange={(e) => setWorkContent(e.target.value)}
              placeholder="Mô tả các hạng mục đã thi công, số lượng nhân công, máy móc..."
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white"
            />
          </div>

          {/* Issues & Recommendations */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-red-400">
                Vấn đề tồn đọng / Lỗi cần khắc phục
              </label>
              <textarea
                rows={2}
                value={issuesToResolve}
                onChange={(e) => setIssuesToResolve(e.target.value)}
                placeholder="Vết nứt bề mặt, thiếu biển báo an toàn..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-sky-400">
                Kiến nghị & Biện pháp giải quyết
              </label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Yêu cầu đội thi công bổ sung giằng thép..."
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          {/* Layout config */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
            <label className="block font-semibold text-white mb-1.5">
              Bố cục ảnh trên trang PDF:
            </label>
            <div className="flex gap-4">
              {[
                { val: 1, label: '1 ảnh / hàng (Chi tiết cỡ lớn)' },
                { val: 2, label: '2 ảnh / hàng (Chuẩn cân đối)' },
                { val: 4, label: '4 ảnh / hàng (Lưới thu nhỏ)' },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pdfLayout"
                    checked={layoutColumns === opt.val}
                    onChange={() => setLayoutColumns(opt.val as any)}
                    className="text-sky-500"
                  />
                  <span className="text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photo Attachments Manager */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-sky-400" />
                  <span>Ảnh đính kèm trong báo cáo ({selectedPhotoItems.length} ảnh)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Chọn ảnh từ thư viện để tự động nhúng vào bản in PDF
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
                className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isPhotoPickerOpen ? 'Đóng bộ chọn' : 'Chọn thêm ảnh'}</span>
              </button>
            </div>

            {/* Picker Grid when opened */}
            {isPhotoPickerOpen && (
              <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-3">
                {availablePhotos.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">
                    Chưa có ảnh nào trong thư viện. Vui lòng chụp thêm ảnh trước.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {availablePhotos.map((photo) => {
                      const isSelected = selectedPhotoItems.some(
                        (i) => i.photoId === photo.id
                      );
                      const thumb = photoThumbMap[photo.id];
                      return (
                        <div
                          key={photo.id}
                          onClick={() => handleTogglePhotoInReport(photo.id)}
                          className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border transition-all ${
                            isSelected
                              ? 'border-sky-500 ring-2 ring-sky-500/60'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-slate-900" />
                          )}
                          {isSelected && (
                            <div className="absolute top-1 right-1 rounded-full bg-sky-500 p-0.5 text-white">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Selected Photo Items List with Captions */}
            {selectedPhotoItems.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedPhotoItems.map((item, idx) => {
                  const thumb = photoThumbMap[item.photoId];
                  return (
                    <div
                      key={item.photoId}
                      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-2"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-950">
                        {thumb && (
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.caption}
                          onChange={(e) =>
                            handleUpdateCaption(item.photoId, e.target.value)
                          }
                          placeholder="Nhập chú thích ảnh..."
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(item.photoId)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                        title="Bỏ ảnh này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Signatures Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-slate-300">
                Người lập (Họ tên)
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300">
                Cán bộ giám sát
              </label>
              <input
                type="text"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300">
                Chỉ huy trưởng
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-950 hover:bg-sky-500"
            >
              <Save className="h-4 w-4" />
              <span>{reportToEdit ? 'Lưu thay đổi' : 'Tạo báo cáo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
