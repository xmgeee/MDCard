import { describe, it, expect, vi } from 'vitest';
import {
  resolveCoverBg,
  formatCoverDate,
  renderCoverInnerHtml,
  frontCoverFromOpts,
  backCoverFromOpts,
  MACARON_PRESETS,
} from '../src/app/cover.js';
import { DEFAULTS } from '../src/app/config.js';
import { createDefaults } from '../src/app/settings.js';

describe('cover', () => {
  describe('resolveCoverBg', () => {
    it('returns weekday macaron color for auto', () => {
      const wed = new Date(2026, 8, 16); // Wed
      expect(resolveCoverBg('auto', wed)).toBe('#d9c7ef');
    });

    it('returns preset hex', () => {
      expect(resolveCoverBg('mint')).toBe('#bfe3dc');
    });

    it('accepts raw hex', () => {
      expect(resolveCoverBg('#abcdef')).toBe('#abcdef');
    });

    it('falls back for unknown id', () => {
      expect(resolveCoverBg('nope')).toBe('#f2c4cf');
    });
  });

  describe('formatCoverDate', () => {
    it('formats auto as Y.M.D', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 20));
      expect(formatCoverDate('auto')).toBe('2026.9.20');
      vi.useRealTimers();
    });

    it('hides date when none', () => {
      expect(formatCoverDate('none')).toBe('');
    });

    it('parses explicit YYYY-MM-DD', () => {
      expect(formatCoverDate('2025-01-02')).toBe('2025.1.2');
    });
  });

  describe('renderCoverInnerHtml', () => {
    it('escapes html and includes three rows', () => {
      const html = renderCoverInnerHtml({
        brand: '<b>纳指</b>',
        title: '闷着',
        dateLabel: '2026.9.20',
        kind: 'front',
      });
      expect(html).toContain('&lt;b&gt;纳指&lt;/b&gt;');
      expect(html).toContain('闷着');
      expect(html).toContain('2026.9.20');
      expect(html).toContain('mc__cover--front');
    });
  });

  describe('front/back from opts', () => {
    it('builds front cover from defaults-like opts', () => {
      const opts = {
        ...createDefaults(),
        coverBrand: '纳指',
        coverTitle: '闷着',
        coverDate: 'none',
        coverBg: 'pink',
      };
      const front = frontCoverFromOpts(opts);
      expect(front.brand).toBe('纳指');
      expect(front.title).toBe('闷着');
      expect(front.dateLabel).toBe('');
      expect(front.bg).toBe('#f2c4cf');
    });

    it('back cover reuses brand when empty', () => {
      const opts = {
        ...DEFAULTS,
        coverBrand: '纳指',
        backBrand: '',
        backText: '完',
        backSub: 'MDCard',
        coverBg: 'sky',
      };
      const back = backCoverFromOpts(opts);
      expect(back.brand).toBe('纳指');
      expect(back.title).toBe('完');
      expect(back.dateLabel).toBe('MDCard');
      expect(back.bg).toBe('#c4d8ef');
    });
  });

  it('exposes macaron presets including auto', () => {
    expect(MACARON_PRESETS.some(p => p.id === 'auto')).toBe(true);
    expect(DEFAULTS).toHaveProperty('coverEnabled', false);
    expect(DEFAULTS).toHaveProperty('backEnabled', false);
  });
});
