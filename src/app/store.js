import { levelToValue, valueToLevel } from './config.js';
import { createDefaults } from './settings.js';
import { DEFAULT_LAYOUT } from './templates.js';
import { dom } from './dom.js';

let opts = createDefaults();
let paletteIdx = 5;
let layoutId = DEFAULT_LAYOUT;
let pages = [];

export const store = {
    get opts()           { return opts; },
    set opts(v)          { opts = v; },
    get paletteIdx()     { return paletteIdx; },
    set paletteIdx(v)    { paletteIdx = v; },
    get layoutId()       { return layoutId; },
    set layoutId(v)      { layoutId = v; },
    get pages()          { return pages; },
    set pages(v)         { pages = v; },
};

export function readDomSettings() {
    opts.h1 = levelToValue('h1', +dom.h1.value);
    opts.h2 = levelToValue('h2', +dom.h2.value);
    opts.h3 = levelToValue('h3', +dom.h3.value);
    opts.bodyFs = levelToValue('bodyFs', +dom.body.value);
    opts.lh = levelToValue('lh', +dom.lh.value);
    opts.bg = dom.bg.value;
    opts.headC = dom.headC.value;
    opts.bodyC = dom.bodyC.value;
    opts.pad = levelToValue('pad', +dom.pad.value);
    opts.my = levelToValue('my', +dom.my.value);
    opts.bw = levelToValue('bw', +dom.bw.value);
    opts.bc = dom.bc.value;
    opts.br = levelToValue('br', +dom.br.value);
    opts.watermark = dom.watermark.value;
    opts.wmStyle = dom.wmStyle?.value || opts.wmStyle || 'badge';
    opts.wmColor = dom.wmColor?.value || opts.wmColor || 'auto';
    opts.wmOpacity = dom.wmOpacity ? (+dom.wmOpacity.value / 100) : (opts.wmOpacity ?? 0.32);
    opts.wmSize = dom.wmSize?.value || opts.wmSize || 'md';
}

export function writeDomSettings() {
    const lh1 = valueToLevel('h1', opts.h1);
    const lh2 = valueToLevel('h2', opts.h2);
    const lh3 = valueToLevel('h3', opts.h3);
    const lbd = valueToLevel('bodyFs', opts.bodyFs);
    const llh = valueToLevel('lh', opts.lh);
    const lpd = valueToLevel('pad', opts.pad);
    const lmy = valueToLevel('my', opts.my);
    const lbw = valueToLevel('bw', opts.bw);
    const lbr = valueToLevel('br', opts.br);

    dom.h1.value = lh1;   dom.h1V.textContent = opts.h1 + 'px';
    dom.h2.value = lh2;   dom.h2V.textContent = opts.h2 + 'px';
    dom.h3.value = lh3;   dom.h3V.textContent = opts.h3 + 'px';
    dom.body.value = lbd; dom.bodyV.textContent = opts.bodyFs + 'px';
    dom.lh.value = llh;   dom.lhV.textContent = String(opts.lh);
    dom.bg.value = opts.bg;
    dom.headC.value = opts.headC;
    dom.bodyC.value = opts.bodyC;
    dom.pad.value = lpd;  dom.padV.textContent = opts.pad + 'px';
    dom.my.value = lmy;   dom.myV.textContent = opts.my + 'px';
    dom.bw.value = lbw;   dom.bwV.textContent = opts.bw + 'px';
    dom.bc.value = opts.bc;
    dom.bc.disabled = opts.bw === 0;
    dom.bc.style.opacity = opts.bw === 0 ? '0.4' : '';
    dom.br.value = lbr;   dom.brV.textContent = opts.br + 'px';
    dom.watermark.value = opts.watermark || '';
    if (dom.wmStyle) dom.wmStyle.value = opts.wmStyle || 'badge';
    if (dom.wmColor) dom.wmColor.value = opts.wmColor || 'auto';
    if (dom.wmOpacity) {
        const pct = Math.round((opts.wmOpacity ?? 0.32) * 100);
        dom.wmOpacity.value = String(pct);
        if (dom.wmOpacityVal) dom.wmOpacityVal.textContent = pct + '%';
    }
    if (dom.wmSize) dom.wmSize.value = opts.wmSize || 'md';
    syncWmSizeButtons(opts.wmSize || 'md');
    syncWmStyleButtons(opts.wmStyle || 'badge');
    syncWmColorButtons(opts.wmColor || 'auto');
}

function syncWmSizeButtons(size) {
    document.querySelectorAll('#mc-wm-size .mc__seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wmSize === size);
    });
}

function syncWmStyleButtons(style) {
    document.querySelectorAll('#mc-wm-styles .mc__wm-style').forEach(btn => {
        btn.classList.toggle('mc__wm-style--active', btn.dataset.wmStyle === style);
    });
}

function syncWmColorButtons(color) {
    document.querySelectorAll('#mc-wm-colors .mc__wm-color').forEach(btn => {
        btn.classList.toggle('mc__wm-color--active', btn.dataset.wmColor === color);
    });
}
