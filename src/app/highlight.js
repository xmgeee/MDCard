export const HIGHLIGHT_COLORS = [
    { id: 'yellow', hex: '#ffe58f', label: '黄' },
    { id: 'red', hex: '#ffccc7', label: '红' },
    { id: 'green', hex: '#d9f7be', label: '绿' },
    { id: 'blue', hex: '#bae0ff', label: '蓝' },
    { id: 'orange', hex: '#ffd8bf', label: '橙' },
    { id: 'purple', hex: '#efdbff', label: '紫' },
    { id: 'pink', hex: '#ffd6e7', label: '粉' },
];

const NAMED = new Set(HIGHLIGHT_COLORS.map(c => c.id));

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * ==文字== → 黄底高亮
 * ==文字=={red} / ==文字=={#ffe58f} → 指定颜色
 * 注意：单独一行的 === 仍是分页符，在 paginate 里先拆分再处理。
 */
export function preprocessHighlights(md) {
    return String(md || '').replace(/==([^=\n]+?)==(?:\{([#A-Za-z0-9]+)\})?/g, (_, text, color) => {
        const c = String(color || 'yellow').toLowerCase();
        const body = escHtml(text.trim());
        if (/^#[0-9a-f]{3,8}$/i.test(c)) {
            return `<mark class="md-hl" style="background:${c}">${body}</mark>`;
        }
        const name = NAMED.has(c) ? c : 'yellow';
        return `<mark class="md-hl md-hl--${name}">${body}</mark>`;
    });
}

/** 去掉选区外侧已有的 ==…== / ==…=={color} */
export function unwrapHighlight(text) {
    const m = String(text || '').match(/^==([\s\S]+?)==(?:\{[^}]+\})?$/);
    return m ? m[1] : String(text || '');
}

/**
 * 给 textarea 当前选区套上高亮语法；无选区时插入占位文案。
 * @param {HTMLTextAreaElement} textarea
 * @param {string|null} color  null = 清除高亮；'yellow' 等为上色
 * @param {string} [placeholder]
 */
export function applyHighlightToSelection(textarea, color, placeholder = '高亮文字') {
    if (!textarea) return false;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    let from = start;
    let to = end;
    let selected = value.slice(from, to);

    // 无选区：尝试向两侧扩展到整段 ==…==
    if (!selected) {
        const expanded = expandHighlightAround(value, start);
        if (expanded) {
            from = expanded.from;
            to = expanded.to;
            selected = value.slice(from, to);
        }
    }

    if (!selected) {
        selected = placeholder;
    }

    const plain = unwrapHighlight(selected);
    let next;
    if (color == null) {
        next = plain;
    } else {
        const suffix = color === 'yellow' ? '' : `{${color}}`;
        next = `==${plain}==${suffix}`;
    }

    textarea.value = value.slice(0, from) + next + value.slice(to);
    textarea.focus();
    textarea.selectionStart = from;
    textarea.selectionEnd = from + next.length;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

function expandHighlightAround(value, caret) {
    const left = value.lastIndexOf('==', caret);
    if (left < 0) return null;
    const right = value.indexOf('==', caret);
    if (right < 0 || right === left) return null;
    // 形如 ==text== 或 ==text=={red}
    let end = right + 2;
    const after = value.slice(end);
    const colorM = after.match(/^\{[^}]+\}/);
    if (colorM) end += colorM[0].length;
    const chunk = value.slice(left, end);
    if (!/^==[\s\S]+?==(?:\{[^}]+\})?$/.test(chunk)) return null;
    // 避免吃到分页 ===
    if (chunk === '===') return null;
    return { from: left, to: end };
}
