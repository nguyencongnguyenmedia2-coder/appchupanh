import React, { useState } from 'react';
import { StampTemplate, StampPosition } from '../../models';
import { PRESET_STAMP_TEMPLATES } from '../../models/defaultTemplates';
import { db } from '../../storage/db';
import { Save, RotateCcw, Check, Sliders, Type, Palette, LayoutTemplate } from 'lucide-react';

interface StampTemplateEditorProps {
  initialTemplate: StampTemplate;
  onSaved: (template: StampTemplate) => void;
}

export const StampTemplateEditor: React.FC<StampTemplateEditorProps> = ({
  initialTemplate,
  onSaved,
}) => {
  const [template, setTemplate] = useState<StampTemplate>({ ...initialTemplate });
  const [successMsg, setSuccessMsg] = useState('');

  const handlePresetSelect = (preset: StampTemplate) => {
    setTemplate({
      ...preset,
      id: template.isPreset ? preset.id : template.id,
      name: template.isPreset ? preset.name : template.name,
      isPreset: false,
    });
  };

  const handleSave = async (isDefault: boolean = false) => {
    const toSave: StampTemplate = {
      ...template,
      id: template.isPreset ? `custom-${Date.now()}` : template.id,
      isPreset: false,
      isDefault: isDefault || template.isDefault,
    };

    if (isDefault) {
      // Clear previous default
      const all = await db.stampTemplates.toArray();
      for (const t of all) {
        if (t.isDefault) {
          t.isDefault = false;
          await db.stampTemplates.put(t);
        }
      }
    }

    await db.stampTemplates.put(toSave);
    setSuccessMsg('Đã lưu mẫu đóng dấu thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
    onSaved(toSave);
  };

  const resetToDefault = () => {
    const standard = PRESET_STAMP_TEMPLATES[0];
    setTemplate({ ...standard, id: template.id, isPreset: false });
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          <Check className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Preset Pickers */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <LayoutTemplate className="h-4 w-4 text-sky-400" />
            <span>Mẫu đóng dấu có sẵn (Presets)</span>
          </h4>
          <button
            onClick={resetToDefault}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Khôi phục chuẩn</span>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_STAMP_TEMPLATES.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p)}
              className={`rounded-xl border p-2.5 text-left text-xs font-medium transition-all ${
                template.name === p.name
                  ? 'border-sky-500 bg-sky-500/15 text-sky-400 font-bold'
                  : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Settings Tabs / Accordion */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Layout & Fields */}
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <Sliders className="h-4 w-4 text-amber-400" />
            <span>Vị trí & Các trường thông tin</span>
          </h4>

          {/* Position Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Vị trí đặt dấu trên ảnh
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {(
                [
                  { id: 'bottom-left', label: 'Góc Dưới - Trái' },
                  { id: 'bottom-right', label: 'Góc Dưới - Phải' },
                  { id: 'bottom-bar', label: 'Thanh Dưới đáy' },
                  { id: 'top-left', label: 'Góc Trên - Trái' },
                  { id: 'top-right', label: 'Góc Trên - Phải' },
                  { id: 'top-bar', label: 'Thanh Trên cùng' },
                ] as { id: StampPosition; label: string }[]
              ).map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setTemplate({ ...template, position: pos.id })}
                  className={`rounded-xl border p-2 text-center transition-colors ${
                    template.position === pos.id
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field Toggles */}
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Bật/Tắt các trường hiển thị
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
              {[
                { key: 'showDateTime', label: 'Ngày & Giờ chụp' },
                { key: 'showGps', label: 'Tọa độ GPS & Cao độ' },
                { key: 'showAddress', label: 'Địa chỉ công trình' },
                { key: 'showProject', label: 'Tên & Mã dự án' },
                { key: 'showWorkItem', label: 'Hạng mục thi công' },
                { key: 'showAuthor', label: 'Người chụp ảnh' },
                { key: 'showContractor', label: 'Đơn vị / Tổng thầu' },
                { key: 'showNotes', label: 'Ghi chú hiện trường' },
                { key: 'showPhotoId', label: 'Mã định danh ảnh' },
                { key: 'showIntegrityHash', label: 'Mã băm toàn vẹn (SHA-256)' },
              ].map((field) => {
                const k = field.key as keyof typeof template.fields;
                const isChecked = template.fields[k];
                return (
                  <label
                    key={field.key}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-800/30 p-2.5 hover:bg-slate-800/50"
                  >
                    <span className="text-slate-300">{field.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          fields: { ...template.fields, [k]: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded border-slate-700 text-sky-600 focus:ring-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Styling & Typography */}
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <Palette className="h-4 w-4 text-emerald-400" />
            <span>Màu sắc & Phông chữ</span>
          </h4>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Màu chữ chính
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={template.textColor}
                  onChange={(e) => setTemplate({ ...template, textColor: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-1"
                />
                <span className="font-mono text-xs text-slate-400 uppercase">
                  {template.textColor}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Màu nền khung dấu
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={template.bgColor}
                  onChange={(e) => setTemplate({ ...template, bgColor: e.target.value })}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-1"
                />
                <span className="font-mono text-xs text-slate-400 uppercase">
                  {template.bgColor}
                </span>
              </div>
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Độ trong suốt của nền</span>
              <span className="font-mono text-slate-400">
                {Math.round(template.bgOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={template.bgOpacity}
              onChange={(e) =>
                setTemplate({ ...template, bgOpacity: parseFloat(e.target.value) })
              }
              className="mt-2 w-full accent-sky-500"
            />
          </div>

          {/* Font size */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Cỡ chữ (Scale)</span>
              <span className="font-mono text-slate-400">{template.fontSize}px</span>
            </div>
            <input
              type="range"
              min="14"
              max="28"
              step="1"
              value={template.fontSize}
              onChange={(e) =>
                setTemplate({ ...template, fontSize: parseInt(e.target.value, 10) })
              }
              className="mt-2 w-full accent-sky-500"
            />
          </div>

          {/* Date format & Time format */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300">Định dạng Ngày</label>
              <select
                value={template.dateFormat}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    dateFormat: e.target.value as any,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Việt Nam)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (Mỹ)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Định dạng Giờ</label>
              <select
                value={template.timeFormat}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    timeFormat: e.target.value as any,
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-white"
              >
                <option value="24h">24 giờ (VD: 14:30:15)</option>
                <option value="12h">12 giờ AM/PM</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
        <button
          onClick={() => handleSave(false)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
        >
          <Save className="h-4 w-4" />
          <span>Lưu thành Mẫu Tùy chỉnh</span>
        </button>

        <button
          onClick={() => handleSave(true)}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-950 hover:bg-sky-500"
        >
          <Check className="h-4 w-4" />
          <span>Lưu & Đặt làm Mặc định</span>
        </button>
      </div>
    </div>
  );
};
