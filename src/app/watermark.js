export const WATERMARK_STYLES = [
    {
        id: 'plain',
        name: '纯文字',
        desc: '轻量署名',
    },
    {
        id: 'badge',
        name: '胶囊',
        desc: '圆角底',
    },
    {
        id: 'outline',
        name: '描边',
        desc: '线框标签',
    },
    {
        id: 'solid',
        name: '实心',
        desc: '高对比底',
    },
    {
        id: 'dot',
        name: '圆点',
        desc: '左侧圆点',
    },
];

export const WATERMARK_PRESETS = [
    'MDCard',
    '纳指手记',
    '仅供参考',
    '@你的账号',
];

/** 水印颜色：auto 随背景深浅，其余为固定色 */
export const WATERMARK_COLORS = [
    { id: 'auto', hex: null, label: '自动' },
    { id: 'ink', hex: '#1a1a1a', label: '墨黑' },
    { id: 'white', hex: '#ffffff', label: '白色' },
    { id: 'slate', hex: '#64748b', label: '灰蓝' },
    { id: 'blue', hex: '#2563eb', label: '蓝色' },
    { id: 'red', hex: '#dc2626', label: '红色' },
    { id: 'amber', hex: '#d97706', label: '琥珀' },
    { id: 'teal', hex: '#0d9488', label: '青绿' },
];

export function resolveWatermarkRgb(colorId, bgHex) {
    const preset = WATERMARK_COLORS.find(c => c.id === colorId);
    if (preset?.hex) return hexToRgbTriplet(preset.hex);
    // auto：亮底用黑，暗底用白
    return bgLuminance(bgHex) > 0.5 ? '0,0,0' : '255,255,255';
}

function hexToRgbTriplet(hex) {
    const s = String(hex || '').replace('#', '');
    if (s.length < 6) return '0,0,0';
    return `${parseInt(s.slice(0, 2), 16)},${parseInt(s.slice(2, 4), 16)},${parseInt(s.slice(4, 6), 16)}`;
}

function bgLuminance(hex) {
    const s = String(hex || '#ffffff').replace('#', '');
    const r = parseInt(s.slice(0, 2), 16) || 0;
    const g = parseInt(s.slice(2, 4), 16) || 0;
    const b = parseInt(s.slice(4, 6), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** 水印统一在右下角，仅样式不同 */
export function renderWatermarkHtml(text, style = 'badge') {
    const t = esc(text);
    if (!t) return '';
    const s = WATERMARK_STYLES.some(x => x.id === style) ? style : 'badge';

    if (s === 'dot') {
        return `<div class="mc__card-watermark mc__wm mc__wm--dot"><i></i><span>${t}</span></div>`;
    }
    return `<div class="mc__card-watermark mc__wm mc__wm--${s}">${t}</div>`;
}

function esc(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
