import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Save } from 'lucide-react';
import { Project, ProjectStatus } from '../../models';
import { db } from '../../storage/db';

interface ProjectFormModalProps {
  isOpen: boolean;
  projectToEdit?: Project | null;
  onClose: () => void;
  onSaved: (project: Project) => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  projectToEdit,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [investor, setInvestor] = useState('');
  const [contractor, setContractor] = useState('');
  const [manager, setManager] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setCode(projectToEdit.code);
      setInvestor(projectToEdit.investor || '');
      setContractor(projectToEdit.contractor || '');
      setManager(projectToEdit.manager || '');
      setAddress(projectToEdit.address || '');
      setStartDate(projectToEdit.startDate || '');
      setExpectedEndDate(projectToEdit.expectedEndDate || '');
      setDescription(projectToEdit.description || '');
      setStatus(projectToEdit.status || 'in_progress');
      setNotes(projectToEdit.notes || '');
    } else {
      setName('');
      setCode('');
      setInvestor('');
      setContractor('');
      setManager('');
      setAddress('');
      setStartDate(new Date().toISOString().slice(0, 10));
      setExpectedEndDate('');
      setDescription('');
      setStatus('in_progress');
      setNotes('');
    }
    setError('');
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên công trình');
      return;
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: projectToEdit ? projectToEdit.id : `proj-${Date.now()}`,
      name: name.trim(),
      code: code.trim() || `DA-${Math.floor(Math.random() * 9000 + 1000)}`,
      investor: investor.trim(),
      contractor: contractor.trim(),
      manager: manager.trim(),
      address: address.trim(),
      startDate: startDate || now.slice(0, 10),
      expectedEndDate: expectedEndDate || '',
      description: description.trim(),
      status,
      notes: notes.trim(),
      createdAt: projectToEdit ? projectToEdit.createdAt : now,
      updatedAt: now,
    };

    await db.projects.put(project);
    onSaved(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {projectToEdit ? 'Chỉnh sửa Công trình' : 'Thêm Công trình Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Tên công trình <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cầu Vượt An Phú, Tòa Nhà Landmark..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mã công trình
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: SG-2026, CT-08..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Trạng thái thi công
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="planning">Chuẩn bị thi công</option>
                <option value="in_progress">Đang thi công</option>
                <option value="paused">Tạm dừng</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Chủ đầu tư
              </label>
              <input
                type="text"
                value={investor}
                onChange={(e) => setInvestor(e.target.value)}
                placeholder="VD: Tập đoàn Novaland..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Tổng thầu / Đơn vị thi công
              </label>
              <input
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="VD: Coteccons, Hòa Bình..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Chỉ huy trưởng / Người phụ trách
              </label>
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="VD: Kỹ sư Nguyễn Văn A..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Địa chỉ công trình
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Số 12 Đại lộ Mai Chí Thọ, P. An Phú, TP. Thủ Đức..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Ngày dự kiến hoàn thành
              </label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mô tả quy mô công trình
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Quy mô tầng hầm, diện tích sàn, tiến độ sơ bộ..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Ghi chú thêm
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Yêu cầu an toàn, tiêu chuẩn KCS..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-950 hover:bg-sky-500"
            >
              <Save className="h-4 w-4" />
              <span>{projectToEdit ? 'Lưu thay đổi' : 'Tạo công trình'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
