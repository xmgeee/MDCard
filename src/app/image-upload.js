const imageMap = new Map();
const urlToId = new Map();
let nextId = 1;

export function exportImages() {
    return Array.from(imageMap.entries());
}

export function importImages(entries) {
    imageMap.clear();
    urlToId.clear();
    if (!entries || !entries.length) {
        nextId = 1;
        return;
    }
    let maxId = 0;
    for (const [id, url] of entries) {
        imageMap.set(id, url);
        if (id > maxId) maxId = id;
    }
    nextId = maxId + 1;
}

export function getImageUrl(ref) {
    return imageMap.get(ref) || '';
}

export function resolveMarkdown(md) {
    return md.replace(/!\[([^\]]*)\]\((img:\d+)\)/g, (match, alt, ref) => {
        const id = Number(ref.slice(4));
        const url = imageMap.get(id);
        return url ? `![${alt}](${url})` : match;
    });
}

/**
 * 把 Markdown 里的 http(s) 图片链接拉成本地 dataURL，并改写为 img:N
 *（CodiMD / 外链粘贴后可预览、可导出）
 */
export async function resolveExternalImages(md) {
    const re = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi;
    const matches = [...String(md || '').matchAll(re)];
    if (!matches.length) return md;

    const uniqueUrls = [];
    const seen = new Set();
    for (const m of matches) {
        const url = m[2];
        if (seen.has(url)) continue;
        seen.add(url);
        uniqueUrls.push(url);
    }

    const resolved = new Map();
    await Promise.all(
        uniqueUrls.map(async url => {
            if (urlToId.has(url)) {
                resolved.set(url, urlToId.get(url));
                return;
            }
            const dataUrl = await fetchImageAsDataUrl(url);
            if (!dataUrl) {
                resolved.set(url, null);
                return;
            }
            const id = nextId++;
            imageMap.set(id, dataUrl);
            urlToId.set(url, id);
            resolved.set(url, id);
        })
    );

    return md.replace(re, (full, alt, url) => {
        const id = resolved.get(url);
        if (id == null) return full;
        return `![${alt}](img:${id})`;
    });
}

async function fetchImageAsDataUrl(url) {
    try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
            const blob = await res.blob();
            if (blob.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)) {
                return await blobToDataUrl(blob);
            }
        }
    } catch {
        /* fall through */
    }

    try {
        const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//i.test(url);
        if (isLocal) return null;
        const res = await fetch(`/api/img-proxy?url=${encodeURIComponent(url)}`);
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob.type.startsWith('image/') && blob.type !== 'application/octet-stream') {
            return null;
        }
        return await blobToDataUrl(blob);
    } catch {
        return null;
    }
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function setupImageUpload(textarea, onInsert, validateImage) {
    textarea.addEventListener('paste', e => {
        const files = extractImageFiles(e.clipboardData);
        if (files.length > 0) {
            e.preventDefault();
            handleFiles(files, textarea, onInsert, validateImage);
        }
    });

    textarea.addEventListener('drop', e => {
        const files = extractImageFiles(e.dataTransfer);
        if (files.length > 0) {
            e.preventDefault();
            handleFiles(files, textarea, onInsert, validateImage);
        }
    });

    textarea.addEventListener('dragover', e => {
        if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
        }
    });
}

function extractImageFiles(dataTransfer) {
    if (!dataTransfer || !dataTransfer.files) return [];
    const files = [];
    for (const f of dataTransfer.files) {
        if (f.type.startsWith('image/')) files.push(f);
    }
    return files;
}

async function handleFiles(files, textarea, onInsert, validateImage) {
    for (const file of files) {
        const raw = await readFileAsDataUrl(file);
        if (validateImage) {
            const ok = await validateImage(raw);
            if (!ok) continue;
        }
        const id = nextId++;
        imageMap.set(id, raw);
        insertImageMarkdown(textarea, id, onInsert);
    }
}

function readFileAsDataUrl(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function insertImageMarkdown(textarea, id, onInsert) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const md = `![image](img:${id})\n`;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + md + after;
    textarea.selectionStart = textarea.selectionEnd = start + md.length;
    textarea.focus();
    if (onInsert) onInsert();
}
