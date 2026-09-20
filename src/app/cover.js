/**
 * Large-text front/back cover for MDCard (macaron-style).
 * Covers are special cards, not Markdown pages.
 */

/** Weekday → macaron pastel (Sun=0 … Sat=6). Mon–Fri match ndx-daily. */
export const MACARON_BG_BY_DAY = {
    0: '#f2c4cf', // Sun — pink
    1: '#f5d3b8', // Mon — apricot
    2: '#f2c4cf', // Tue — pink
    3: '#d9c7ef', // Wed — lilac
    4: '#c4d8ef', // Thu — sky
    5: '#bfe3dc', // Fri — mint
    6: '#f5d3b8', // Sat — apricot
};

export const MACARON_PRESETS = [
    { id: 'auto', hex: null, label: '按日' },
    { id: 'pink', hex: '#f2c4cf', label: '粉' },
    { id: 'lilac', hex: '#d9c7ef', label: '紫' },
    { id: 'sky', hex: '#c4d8ef', label: '蓝' },
    { id: 'mint', hex: '#bfe3dc', label: '青' },
    { id: 'apricot', hex: '#f5d3b8', label: '杏' },
    { id: 'cream', hex: '#fefcfa', label: '奶油' },
];

const BG_FALLBACK = '#f2c4cf';

/**
 * @param {string} coverBg - preset id or hex
 * @param {Date} [date]
 * @returns {string} CSS color
 */
export function resolveCoverBg(coverBg, date = new Date()) {
    if (!coverBg || coverBg === 'auto') {
        return MACARON_BG_BY_DAY[date.getDay()] || BG_FALLBACK;
    }
    const preset = MACARON_PRESETS.find(p => p.id === coverBg);
    if (preset?.hex) return preset.hex;
    if (/^#[0-9a-fA-F]{6}$/.test(coverBg)) return coverBg;
    return BG_FALLBACK;
}

/**
 * Format date for cover display: 2026.9.20
 * @param {string} coverDate - '', 'auto', 'none', or YYYY-MM-DD
 * @returns {string}
 */
export function formatCoverDate(coverDate) {
    if (coverDate === 'none' || coverDate === 'off') return '';
    let d;
    if (!coverDate || coverDate === 'auto') {
        d = new Date();
    } else {
        const m = String(coverDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!m) d = new Date();
        else d = new Date(+m[1], +m[2] - 1, +m[3]);
    }
    if (Number.isNaN(d.getTime())) d = new Date();
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * @param {{ brand?: string, title?: string, dateLabel?: string, bg?: string, kind?: 'front'|'back' }} opts
 * @returns {string} Inner HTML for cover card body
 */
export function renderCoverInnerHtml(opts) {
    const brand = (opts.brand || '').trim();
    const title = (opts.title || '').trim();
    const dateLabel = (opts.dateLabel || '').trim();
    const kind = opts.kind || 'front';

    const brandHtml = brand
        ? `<div class="mc__cover-brand">${esc(brand)}</div>`
        : '<div class="mc__cover-brand mc__cover-brand--empty"></div>';
    const titleHtml = title
        ? `<div class="mc__cover-title">${esc(title)}</div>`
        : `<div class="mc__cover-title mc__cover-title--empty">${kind === 'back' ? '···' : '···'}</div>`;
    const dateHtml = dateLabel
        ? `<div class="mc__cover-date">${esc(dateLabel)}</div>`
        : '<div class="mc__cover-date mc__cover-date--empty"></div>';

    return `
        <div class="mc__cover mc__cover--${kind}">
            ${brandHtml}
            ${titleHtml}
            ${dateHtml}
        </div>
    `;
}

/**
 * Size and shrink cover text to fit the card.
 * Uses explicit px so dom-to-image export stays consistent.
 * @param {HTMLElement} cardEl
 */
export function fitCoverText(cardEl) {
    const cover = cardEl.querySelector('.mc__cover');
    if (!cover) return;
    const w = cover.clientWidth || cardEl.clientWidth;
    const h = cover.clientHeight || cardEl.clientHeight;
    if (!w || !h) return;

    const minSide = Math.min(w, h);
    const brand = cover.querySelector('.mc__cover-brand');
    const title = cover.querySelector('.mc__cover-title');
    const date = cover.querySelector('.mc__cover-date');
    const isBack = cover.classList.contains('mc__cover--back');

    if (brand) brand.style.fontSize = Math.round(minSide * 0.135) + 'px';
    if (title) title.style.fontSize = Math.round(minSide * (isBack ? 0.18 : 0.22)) + 'px';
    if (date) date.style.fontSize = Math.round(minSide * 0.09) + 'px';

    for (const el of [brand, title, date]) {
        if (!el || !el.textContent.trim()) continue;
        let size = parseFloat(el.style.fontSize) || 16;
        const floor = el === title ? 18 : 12;
        let guard = 80;
        while (el.scrollWidth > w && size > floor && guard-- > 0) {
            size -= 1;
            el.style.fontSize = size + 'px';
        }
    }
}

/**
 * Build front-cover HTML fragment options from settings.
 * @param {object} opts - store.opts
 */
export function frontCoverFromOpts(opts) {
    const dateLabel = formatCoverDate(opts.coverDate);
    return {
        kind: 'front',
        brand: opts.coverBrand || '',
        title: opts.coverTitle || '',
        dateLabel,
        bg: resolveCoverBg(opts.coverBg),
    };
}

/**
 * Build back-cover HTML fragment options from settings.
 * @param {object} opts - store.opts
 */
export function backCoverFromOpts(opts) {
    return {
        kind: 'back',
        brand: opts.backBrand || opts.coverBrand || '',
        title: opts.backText || '',
        dateLabel: opts.backSub || '',
        bg: resolveCoverBg(opts.coverBg),
    };
}
