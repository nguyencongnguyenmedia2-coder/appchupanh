import React from 'react';
import { Project, WorkItem } from '../../models';
import { FolderKanban, Layers } from 'lucide-react';

interface QuickProjectPickerProps {
  projects: Project[];
  workItems: WorkItem[];
  selectedProjectId?: string;
  selectedWorkItemId?: string;
  onSelectProject: (id: string) => void;
  onSelectWorkItem: (id: string) => void;
}

export const QuickProjectPicker: React.FC<QuickProjectPickerProps> = ({
  projects,
  workItems,
  selectedProjectId,
  selectedWorkItemId,
  onSelectProject,
  onSelectWorkItem,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-950/80 p-2.5 backdrop-blur-md border border-white/10 shadow-lg text-xs">
      {/* Project Selector */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
        <FolderKanban className="h-4 w-4 text-sky-400 shrink-0" />
        <select
          value={selectedProjectId || ''}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full truncate rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:border-sky-500 focus:outline-none"
        >
          <option value="">-- Chưa chọn công trình --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </div>

      {/* Work item Selector */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
        <Layers className="h-4 w-4 text-amber-400 shrink-0" />
        <select
          value={selectedWorkItemId || ''}
          onChange={(e) => onSelectWorkItem(e.target.value)}
          className="w-full truncate rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="">-- Chưa chọn hạng mục --</option>
          {workItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
