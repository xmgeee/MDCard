import { FORMATS, DEFAULTS } from './config.js';
import { resolveWatermarkRgb } from './watermark.js';

/**
 * Create a fresh copy of the default card settings.
 * @returns {typeof DEFAULTS} A new object with all default values
 */
export function createDefaults() {
    return { ...DEFAULTS };
}

/**
 * Shallow-clone a settings object.
 * @param {typeof DEFAULTS} s - Settings object to clone
 * @returns {typeof DEFAULTS} Shallow copy
 */
export function cloneSettings(s) {
    return { ...s };
}

/**
 * Apply card style settings as CSS custom properties on a card element.
 * Sets background, text colors, font sizes, spacing, border, and watermark color.
 * @param {HTMLElement} cardEl - The card container element
 * @param {typeof DEFAULTS} s - Style settings object
 */
export function applyCardVars(cardEl, s) {
    const opacity = clamp(s.wmOpacity ?? 0.32, 0.12, 0.6);
    const ink = resolveWatermarkRgb(s.wmColor || 'auto', s.bg);
    const sizeMap = { sm: '0.7', md: '0.85', lg: '1.05' };
    const sizeScale = sizeMap[s.wmSize] || sizeMap.md;
    const map = {
        '--c-bg': s.bg,
        '--c-head': s.headC,
        '--c-body': s.bodyC,
        '--c-h1': s.h1 + 'px',
        '--c-h2': s.h2 + 'px',
        '--c-h3': s.h3 + 'px',
        '--c-body-fs': s.bodyFs + 'px',
        '--c-lh': String(s.lh),
        '--c-pad': s.pad + 'px',
        '--c-my': s.my + 'px',
        '--c-bw': s.bw + 'px',
        '--c-bc': s.bc,
        '--c-br': s.br + 'px',
        '--wm-opacity': String(opacity),
        '--wm-scale': sizeScale,
        '--mc-watermark-c': `rgba(${ink},${opacity})`,
    };
    for (const [prop, val] of Object.entries(map)) {
        cardEl.style.setProperty(prop, val);
    }
}

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, Number(n) || min));
}

/**
 * Calculate the available content height for a card, minus padding and borders.
 * @param {string} fmt - Format key from FORMATS
 * @param {typeof DEFAULTS} s - Style settings object
 * @returns {number} Available height in CSS pixels
 */
export function availableHeight(fmt, s) {
    const cfg = FORMATS[fmt];
    const borderOff = s.bw * 2;
    const padOff = (s.pad * 2) + (s.my * 2);
    let watermarkOff = 0;
    if (s.watermark) {
        watermarkOff = 22;
    }
    return cfg.ph - padOff - borderOff - watermarkOff;
}
