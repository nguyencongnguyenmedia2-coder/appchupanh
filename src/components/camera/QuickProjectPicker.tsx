import React from 'react';
import { WorkItem } from '../../models';
import { Layers, Building2 } from 'lucide-react';

interface QuickProjectPickerProps {
  workItems: WorkItem[];
  selectedWorkItemId?: string;
  onSelectWorkItem: (id: string) => void;
  customProjectName?: string;
  onUpdateProjectName?: (name: string) => void;
}

export const QuickProjectPicker: React.FC<QuickProjectPickerProps> = ({
  workItems,
  selectedWorkItemId,
  onSelectWorkItem,
  customProjectName = '',
  onUpdateProjectName,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-950/80 p-2.5 backdrop-blur-md border border-white/10 shadow-lg text-xs">
      {/* Work item Selector */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
        <Layers className="h-4 w-4 text-amber-400 shrink-0" />
        <select
          value={selectedWorkItemId || ''}
          onChange={(e) => onSelectWorkItem(e.target.value)}
          className="w-full truncate rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="">-- Hạng mục thi công --</option>
          {workItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* Optional Project / Site name input */}
      {onUpdateProjectName && (
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
          <Building2 className="h-4 w-4 text-sky-400 shrink-0" />
          <input
            type="text"
            value={customProjectName}
            onChange={(e) => onUpdateProjectName(e.target.value)}
            placeholder="Tên công trình / Vị trí (Tùy chọn)..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
