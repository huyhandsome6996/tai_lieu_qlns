/* ============================================================
   Helper: tạo code-block wrapper + syntax highlight Python
   ============================================================ */

// Bọc tất cả <pre><code> thành code-block có header + copy button
function wrapCodeBlocks() {
    document.querySelectorAll('pre').forEach(pre => {
        // Skip nếu đã được bọc
        if (pre.closest('.code-block')) return;

        const code = pre.querySelector('code');
        if (!code) {
            // <pre> không có <code> (ví dụ: ASCII art diagram) — bọc luôn nhưng không highlight
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block code-block--plain';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
            return;
        }

        // Lấy filename từ data-attr hoặc mặc định
        const filename = pre.dataset.file || code.dataset.file || 'code.py';
        const language = (code.dataset.lang || pre.dataset.lang || 'python').toLowerCase();

        // Tạo wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block';

        // Header
        const header = document.createElement('div');
        header.className = 'code-block__header';
        header.innerHTML = `
            <span class="code-block__filename"></span>
            <button class="code-block__copy" type="button">📋 Copy</button>
        `;
        // Set filename qua textContent để tránh XSS
        header.querySelector('.code-block__filename').textContent = filename;
        wrapper.appendChild(header);

        // Lấy raw code, highlight, đặt lại
        const rawCode = code.textContent;
        const highlighted = highlightPython(rawCode);
        code.innerHTML = highlighted;
        code.dataset.lang = language;

        // Move pre into wrapper
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Copy button handler
        const copyBtn = wrapper.querySelector('.code-block__copy');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(rawCode).then(() => {
                const oldText = copyBtn.textContent;
                copyBtn.textContent = '✅ Đã copy';
                setTimeout(() => { copyBtn.textContent = oldText; }, 1500);
            });
        });
    });
}

/* ============================================================
   Python Syntax Highlighter — TOKEN-BASED (an toàn)
   ============================================================
   Nguyên lý: thay vì regex replace tuần tự (dễ lồng nhau lỗi),
   ta tokenize code thành các phần tử độc lập rồi bọc span cho từng phần.

   Thứ tự ưu tiên:
   1. Triple-quoted strings ("""...""" hoặc '''...''')
   2. Single-line strings ("..." hoặc '...')
   3. Comments (# đến cuối dòng)
   4. Decorators (@name)
   5. Identifiers / keywords / builtins
   6. Numbers
   7. Operators / punctuation
   8. Whitespace

   Mỗi token được escape HTML riêng → không bao giờ bị lồng tag.
*/

const KEYWORDS = new Set([
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not',
    'and', 'or', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
    'with', 'pass', 'break', 'continue', 'lambda', 'yield', 'global', 'nonlocal',
    'None', 'True', 'False', 'self', 'cls', 'is', 'del', 'assert'
]);

const BUILTINS = new Set([
    'print', 'len', 'range', 'int', 'str', 'float', 'list', 'dict',
    'set', 'tuple', 'bool', 'hasattr', 'getattr', 'setattr', 'isinstance',
    'super', 'zip', 'enumerate', 'sorted', 'min', 'max', 'sum', 'abs',
    'open', 'input', 'type', 'id', 'dir', 'vars', 'format', 'map', 'filter'
]);

function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightPython(code) {
    let result = '';
    let i = 0;
    const n = code.length;

    while (i < n) {
        const ch = code[i];
        const next = code[i + 1] || '';

        // --- 1. Triple-quoted string ("""...""" or '''...''') ---
        if ((ch === '"' && next === '"' && code[i + 2] === '"') ||
            (ch === "'" && next === "'" && code[i + 2] === "'")) {
            const quote = ch + ch + ch;
            let end = code.indexOf(quote, i + 3);
            if (end === -1) end = n; // không đóng → đến hết
            else end += 3;
            const str = code.slice(i, end);
            result += `<span class="tok-string">${escapeHtml(str)}</span>`;
            i = end;
            continue;
        }

        // --- 2. Single-line string ("..." or '...') ---
        if (ch === '"' || ch === "'") {
            let j = i + 1;
            while (j < n && code[j] !== '\n') {
                if (code[j] === '\\') { j += 2; continue; } // escape
                if (code[j] === ch) { j++; break; }
                j++;
            }
            const str = code.slice(i, j);
            result += `<span class="tok-string">${escapeHtml(str)}</span>`;
            i = j;
            continue;
        }

        // --- 3. Comment (# to end of line) ---
        if (ch === '#') {
            let j = i;
            while (j < n && code[j] !== '\n') j++;
            const cmt = code.slice(i, j);
            result += `<span class="tok-comment">${escapeHtml(cmt)}</span>`;
            i = j;
            continue;
        }

        // --- 4. Decorator (@name) ---
        if (ch === '@') {
            let j = i + 1;
            while (j < n && /[A-Za-z0-9_.]/.test(code[j])) j++;
            const dec = code.slice(i, j);
            result += `<span class="tok-decorator">${escapeHtml(dec)}</span>`;
            i = j;
            continue;
        }

        // --- 5. Number ---
        if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next))) {
            let j = i;
            // Hex/Oct/Bin
            if (ch === '0' && (next === 'x' || next === 'X' || next === 'o' || next === 'O' || next === 'b' || next === 'B')) {
                j = i + 2;
                while (j < n && /[0-9a-fA-F_]/.test(code[j])) j++;
            } else {
                while (j < n && /[0-9_]/.test(code[j])) j++;
                if (code[j] === '.') {
                    j++;
                    while (j < n && /[0-9_]/.test(code[j])) j++;
                }
                if (code[j] === 'e' || code[j] === 'E') {
                    j++;
                    if (code[j] === '+' || code[j] === '-') j++;
                    while (j < n && /[0-9]/.test(code[j])) j++;
                }
            }
            const num = code.slice(i, j);
            result += `<span class="tok-number">${escapeHtml(num)}</span>`;
            i = j;
            continue;
        }

        // --- 6. Identifier / keyword / builtin ---
        if (/[A-Za-z_]/.test(ch)) {
            let j = i;
            while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
            const word = code.slice(i, j);

            // Look back: nếu trước 'word' có 'class ' hoặc 'def ', mark là class/function name
            const before = result.match(/<span class="tok-keyword">(class|def)<\/span>\s*$/);
            if (before) {
                const kind = before[1] === 'class' ? 'tok-class' : 'tok-function';
                result += `<span class="${kind}">${escapeHtml(word)}</span>`;
            } else if (KEYWORDS.has(word)) {
                result += `<span class="tok-keyword">${escapeHtml(word)}</span>`;
            } else if (BUILTINS.has(word)) {
                result += `<span class="tok-builtin">${escapeHtml(word)}</span>`;
            } else {
                result += escapeHtml(word);
            }
            i = j;
            continue;
        }

        // --- 7. Default: escape và ghi nguyên ---
        result += escapeHtml(ch);
        i++;
    }

    return result;
}

document.addEventListener('DOMContentLoaded', () => {
    wrapCodeBlocks();
});
