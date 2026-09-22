import LAYOUTS from '../templates.js';
import { applyCardVars } from '../settings.js';
import { paginateMarkdown } from '../paginator.js';
import { resolveMarkdown, resolveExternalImages } from '../image-upload.js';
import { renderWatermarkHtml } from '../watermark.js';
import { dom } from '../dom.js';
import { store, readDomSettings } from '../store.js';
import { showToast } from '../toast.js';
import { t } from '../i18n.js';

let refreshSeq = 0;

export async function refresh() {
    const seq = ++refreshSeq;
    readDomSettings();

    let raw = dom.markdown.value;
    try {
        const withLocal = await resolveExternalImages(raw);
        if (seq !== refreshSeq) return;
        if (withLocal !== raw) {
            const start = dom.markdown.selectionStart;
            const end = dom.markdown.selectionEnd;
            dom.markdown.value = withLocal;
            try {
                dom.markdown.selectionStart = start;
                dom.markdown.selectionEnd = end;
            } catch {}
            raw = withLocal;
            if (/!\[[^\]]*\]\(https?:\/\/(localhost|127\.0\.0\.1)/i.test(raw)) {
                showToast(t('toast.localImageHint'));
            }
        }
    } catch (e) {
        console.error(e);
    }
    if (seq !== refreshSeq) return;

    const md = resolveMarkdown(raw);
    const fmt = dom.format.value;
    const layout = LAYOUTS.find(l => l.id === store.layoutId);
    const familyClass = layout ? 'mc--' + layout.family : '';
    const layoutClass = layout ? layout.cssClass : '';

    store.pages = paginateMarkdown(md, fmt, store.opts, () => {
        showToast(t('toast.imageTooLarge'));
    }, layoutClass);

    if (seq !== refreshSeq) return;

    if (store.pages.length === 0) {
        dom.cards.innerHTML = '';
        dom.empty.style.display = '';
        dom.exportPng.disabled = true;
        dom.status.textContent = '';
        return;
    }

    dom.empty.style.display = 'none';
    const total = store.pages.length;
    const wm = renderWatermarkHtml(store.opts.watermark, store.opts.wmStyle);

    dom.cards.innerHTML = store.pages
        .map(
            (html, i) => `
        <div class="mc__card-wrapper">
            <div class="mc__card mc__card--${fmt} ${familyClass} ${layoutClass}">
                <span class="mc__card-badge">${i + 1}/${total}</span>
                <div class="mc__card-body">${html}</div>
                ${wm}
            </div>
        </div>
    `
        )
        .join('');

    dom.cards.querySelectorAll('.mc__card').forEach(el => applyCardVars(el, store.opts));

    dom.exportPng.disabled = false;
    dom.status.textContent = '';
}

export function escHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
