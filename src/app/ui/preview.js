import LAYOUTS from '../templates.js';
import { applyCardVars } from '../settings.js';
import { paginateMarkdown } from '../paginator.js';
import { resolveMarkdown, resolveExternalImages } from '../image-upload.js';
import { renderWatermarkHtml } from '../watermark.js';
import {
    renderCoverInnerHtml,
    frontCoverFromOpts,
    backCoverFromOpts,
    fitCoverText,
} from '../cover.js';
import { dom } from '../dom.js';
import { store, readDomSettings } from '../store.js';
import { showToast } from '../toast.js';
import { t } from '../i18n.js';

let refreshSeq = 0;

function wrapCard(fmt, familyClass, layoutClass, badge, bodyHtml, wm, extraClass = '', coverBg = '') {
    const dataBg = coverBg ? ` data-cover-bg="${coverBg}"` : '';
    return `
        <div class="mc__card-wrapper">
            <div class="mc__card mc__card--${fmt} ${familyClass} ${layoutClass} ${extraClass}"${dataBg}>
                <span class="mc__card-badge">${badge}</span>
                <div class="mc__card-body">${bodyHtml}</div>
                ${wm}
            </div>
        </div>
    `;
}

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

    const frontOn = !!store.opts.coverEnabled;
    const backOn = !!store.opts.backEnabled;
    const contentCount = store.pages.length;
    const total = contentCount + (frontOn ? 1 : 0) + (backOn ? 1 : 0);

    if (total === 0) {
        dom.cards.innerHTML = '';
        dom.empty.style.display = '';
        dom.exportPng.disabled = true;
        dom.status.textContent = '';
        return;
    }

    dom.empty.style.display = 'none';
    const wm = renderWatermarkHtml(store.opts.watermark, store.opts.wmStyle);
    const parts = [];
    let pageIdx = 0;

    if (frontOn) {
        pageIdx += 1;
        const front = frontCoverFromOpts(store.opts);
        parts.push(
            wrapCard(
                fmt,
                familyClass,
                layoutClass,
                `${pageIdx}/${total}`,
                renderCoverInnerHtml(front),
                '',
                'mc__card--cover',
                front.bg
            )
        );
    }

    for (const html of store.pages) {
        pageIdx += 1;
        parts.push(wrapCard(fmt, familyClass, layoutClass, `${pageIdx}/${total}`, html, wm));
    }

    if (backOn) {
        pageIdx += 1;
        const back = backCoverFromOpts(store.opts);
        parts.push(
            wrapCard(
                fmt,
                familyClass,
                layoutClass,
                `${pageIdx}/${total}`,
                renderCoverInnerHtml(back),
                '',
                'mc__card--cover mc__card--back',
                back.bg
            )
        );
    }

    dom.cards.innerHTML = parts.join('');

    dom.cards.querySelectorAll('.mc__card').forEach(el => {
        applyCardVars(el, store.opts);
        if (el.dataset.coverBg) {
            el.style.setProperty('--c-bg', el.dataset.coverBg);
            fitCoverText(el);
        }
    });

    dom.exportPng.disabled = false;
    dom.status.textContent = '';
}

export function escHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
