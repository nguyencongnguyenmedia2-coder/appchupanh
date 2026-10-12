import { describe, it, expect } from 'vitest';
import { formatDateTime } from '../src/services/image/stampEngine';
import { PRESET_STAMP_TEMPLATES, DEFAULT_WORK_ITEMS } from '../src/models/defaultTemplates';

describe('Stamp Formatting & Presets', () => {
  it('formats dates in DD/MM/YYYY format correctly', () => {
    const iso = '2026-10-12T14:30:15.000Z';
    const formatted = formatDateTime(iso, 'DD/MM/YYYY', '24h', true);
    expect(formatted).toContain('12/10/2026');
  });

  it('formats dates in YYYY-MM-DD format correctly', () => {
    const iso = '2026-10-12T14:30:15.000Z';
    const formatted = formatDateTime(iso, 'YYYY-MM-DD', '24h', false);
    expect(formatted).toContain('2026-10-12');
  });

  it('contains all 8 required preset templates', () => {
    expect(PRESET_STAMP_TEMPLATES.length).toBe(8);
    const ids = PRESET_STAMP_TEMPLATES.map((t) => t.id);
    expect(ids).toContain('preset-standard');
    expect(ids).toContain('preset-site');
    expect(ids).toContain('preset-progress');
    expect(ids).toContain('preset-quality');
    expect(ids).toContain('preset-safety');
    expect(ids).toContain('preset-acceptance');
    expect(ids).toContain('preset-gps');
    expect(ids).toContain('preset-corporate');
  });

  it('contains standard construction work items', () => {
    expect(DEFAULT_WORK_ITEMS).toContain('Móng');
    expect(DEFAULT_WORK_ITEMS).toContain('Cốt thép');
    expect(DEFAULT_WORK_ITEMS).toContain('Cốp pha');
    expect(DEFAULT_WORK_ITEMS).toContain('Bê tông');
    expect(DEFAULT_WORK_ITEMS).toContain('Hoàn thiện');
    expect(DEFAULT_WORK_ITEMS).toContain('An toàn lao động (HSE)');
  });
});
