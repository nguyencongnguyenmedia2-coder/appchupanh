import React, { useState, useEffect } from 'react';
import { Stamp, Plus, Check } from 'lucide-react';
import { StampTemplate } from '../models';
import { db } from '../storage/db';
import { PRESET_STAMP_TEMPLATES } from '../models/defaultTemplates';
import { StampTemplateEditor } from '../components/stamping/StampTemplateEditor';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<StampTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<StampTemplate | null>(null);

  const loadTemplates = async () => {
    const list = await db.stampTemplates.toArray();
    setTemplates(list);
    if (!activeTemplate && list.length > 0) {
      const def = list.find((t) => t.isDefault) || list[0];
      setActiveTemplate(def);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <Stamp className="h-6 w-6 text-sky-400" />
          <span>Quản lý Mẫu Đóng dấu (Stamp Templates)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tùy chỉnh vị trí, màu sắc, font chữ, độ trong suốt và các trường thông tin đóng dấu lên ảnh
        </p>
      </div>

      {/* Editor Component */}
      {activeTemplate && (
        <StampTemplateEditor
          initialTemplate={activeTemplate}
          onSaved={(savedT) => {
            setActiveTemplate(savedT);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
};
