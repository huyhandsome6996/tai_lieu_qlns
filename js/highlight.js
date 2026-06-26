/* ============================================================
   Helper: tạo code-block wrapper + syntax highlight Python
   ============================================================ */

// Bọc tất cả <pre><code> thành code-block có header + copy button
function wrapCodeBlocks() {
    document.querySelectorAll('pre').forEach(pre => {
        // Skip nếu đã được bọc
        if (pre.closest('.code-block')) return;

        const code = pre.querySelector('code');
        if (!code) return;

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
            <span class="code-block__filename">${filename}</span>
            <button class="code-block__copy" type="button">📋 Copy</button>
        `;
        wrapper.appendChild(header);

        // Highlight code
        const rawCode = code.textContent;
        const highlighted = highlightPython(rawCode);
        code.innerHTML = highlighted;
        code.dataset.lang = language;

        // Move pre into wrapper
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
    });
}

// Simple Python syntax highlighter
function highlightPython(code) {
    // Escape HTML first
    code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Comment (whole line starting with #, or after code)
    code = code.replace(/(#.*?)(\n|$)/g, '<span class="tok-comment">$1</span>$2');

    // Triple-quoted strings (docstrings)
    code = code.replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, '<span class="tok-string">$1</span>');

    // Strings (single/double quote)
    code = code.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="tok-string">$1</span>');

    // Decorators
    code = code.replace(/^(\s*)(@\w[\w.]*)/gm, '$1<span class="tok-decorator">$2</span>');

    // Keywords
    const keywords = [
        'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not',
        'and', 'or', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
        'with', 'pass', 'break', 'continue', 'lambda', 'yield', 'global', 'nonlocal',
        'None', 'True', 'False', 'self', 'cls', 'is', 'del', 'assert'
    ];
    const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    code = code.replace(kwRegex, '<span class="tok-keyword">$1</span>');

    // Builtins
    const builtins = ['print', 'len', 'range', 'int', 'str', 'float', 'list', 'dict',
                      'set', 'tuple', 'bool', 'hasattr', 'getattr', 'setattr', 'isinstance',
                      'super', 'zip', 'enumerate', 'sorted', 'min', 'max', 'sum', 'abs',
                      'open', 'input', 'type', 'id', 'dir', 'vars', 'format', 'map', 'filter'];
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    code = code.replace(builtinRegex, '<span class="tok-builtin">$1</span>');

    // Class names (after 'class' keyword)
    code = code.replace(/<span class="tok-keyword">class<\/span>\s+(\w+)/g,
                       '<span class="tok-keyword">class</span> <span class="tok-class">$1</span>');

    // Function names (after 'def' keyword)
    code = code.replace(/<span class="tok-keyword">def<\/span>\s+(\w+)/g,
                       '<span class="tok-keyword">def</span> <span class="tok-function">$1</span>');

    // Numbers
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>');

    return code;
}

document.addEventListener('DOMContentLoaded', () => {
    wrapCodeBlocks();
});
