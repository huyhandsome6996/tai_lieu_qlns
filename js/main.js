/* ============================================================
   JS cho trang web học
   ============================================================ */

// Danh sách các trang (đồng bộ với sidebar)
const PAGES = [
    { id: 'index',           title: 'Trang chủ',           file: 'index.html',              icon: '🏠' },
    // Nhóm 1: Kiến thức nền
    { id: 'python-co-ban',   title: 'Python cơ bản',        file: 'pages/01-python-co-ban.html',     icon: '🐍', group: 'Kiến thức nền' },
    { id: 'oop',             title: 'OOP — Kế thừa & Đa hình', file: 'pages/02-oop.html',              icon: '🧬', group: 'Kiến thức nền' },
    { id: 'tkinter-co-ban',  title: 'Tkinter cơ bản',       file: 'pages/03-tkinter-co-ban.html',    icon: '🖼️', group: 'Kiến thức nền' },
    { id: 'sqlite-co-ban',   title: 'SQLite cơ bản',        file: 'pages/04-sqlite-co-ban.html',     icon: '💾', group: 'Kiến thức nền' },
    // Nhóm 2: Thuật toán
    { id: 'dslk',            title: 'Danh sách liên kết đôi', file: 'pages/05-dslk.html',             icon: '🔗', group: 'Thuật toán & Cấu trúc dữ liệu' },
    { id: 'merge-sort',      title: 'Merge Sort (sắp xếp trộn)', file: 'pages/06-merge-sort.html',     icon: '🔀', group: 'Thuật toán & Cấu trúc dữ liệu' },
    { id: 'stack-lifo',      title: 'Stack LIFO (Ngăn xếp)', file: 'pages/07-stack-lifo.html',        icon: '📚', group: 'Thuật toán & Cấu trúc dữ liệu' },
    { id: 'queue-fifo',      title: 'Queue FIFO (Hàng đợi)', file: 'pages/08-queue-fifo.html',       icon: '🚶', group: 'Thuật toán & Cấu trúc dữ liệu' },
    // Nhóm 3: 9 chức năng
    { id: 'cn01',            title: 'CN01 — Đăng nhập + phân quyền', file: 'pages/09-cn01-dang-nhap.html', icon: '🔐', group: '9 Chức năng' },
    { id: 'cn02',            title: 'CN02 — Đọc danh sách', file: 'pages/10-cn02-doc-danh-sach.html', icon: '📋', group: '9 Chức năng' },
    { id: 'cn03',            title: 'CN03 — Thêm sản phẩm',  file: 'pages/11-cn03-them-san-pham.html', icon: '➕', group: '9 Chức năng' },
    { id: 'cn04',            title: 'CN04 — Sửa sản phẩm',   file: 'pages/12-cn04-sua-san-pham.html',  icon: '✏️', group: '9 Chức năng' },
    { id: 'cn05',            title: 'CN05 — Xóa sản phẩm',   file: 'pages/13-cn05-xoa-san-pham.html',  icon: '🗑️', group: '9 Chức năng' },
    { id: 'cn06',            title: 'CN06 — Tìm kiếm + Sắp xếp', file: 'pages/14-cn06-tim-sap.html',   icon: '🔍', group: '9 Chức năng' },
    { id: 'cn07',            title: 'CN07 — Thống kê',       file: 'pages/15-cn07-thong-ke.html',      icon: '📊', group: '9 Chức năng' },
    { id: 'cn08',            title: 'CN08 — Undo / Redo',    file: 'pages/16-cn08-undo-redo.html',     icon: '↩️', group: '9 Chức năng' },
    { id: 'cn09',            title: 'CN09 — Giỏ hàng + thanh toán', file: 'pages/17-cn09-gio-hang.html', icon: '🛒', group: '9 Chức năng' },
    // Nhóm 4: Tổng thể
    { id: 'main-flow',       title: 'Tổng thể: main.py + QuanLyTrungTam', file: 'pages/18-main-flow.html', icon: '🎯', group: 'Tổng thể' },
    { id: 'phan-chia',       title: 'Phân chia công việc',   file: 'pages/19-phan-chia-cong-viec.html', icon: '👥', group: 'Tổng thể' },
    { id: 'luong-app',       title: 'Luồng ghép các cn thành app', file: 'pages/20-luong-app.html', icon: '🧩', group: 'Tổng thể' },
    { id: 'tt-ui-dk',        title: 'Chi tiết _tt / _ui / _dk liên kết', file: 'pages/21-tt-ui-dk.html', icon: '🧠', group: 'Tổng thể' },
];

// ============================================================
// RENDER SIDEBAR
// ============================================================
function buildSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Lấy trang hiện tại từ URL
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const currentDir = window.location.pathname.includes('/pages/') ? '../' : '';

    // Nhóm các trang
    const groups = {};
    PAGES.forEach(p => {
        const g = p.group || 'Trang chính';
        if (!groups[g]) groups[g] = [];
        groups[g].push(p);
    });

    let html = '';
    for (const [groupName, pages] of Object.entries(groups)) {
        html += `<div class="sidebar__group">`;
        html += `<div class="sidebar__group-title">${groupName}</div>`;
        for (const p of pages) {
            const href = p.id === 'index' ? 'index.html' : p.file;
            const fullHref = (p.id === 'index' ? '' : (window.location.pathname.includes('/pages/') ? '../' : '')) + href;
            const active = (window.location.pathname.endsWith(p.file) || (p.id === 'index' && (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')))) ? 'active' : '';
            html += `<a href="${fullHref}" class="sidebar__link ${active}">`;
            html += `<span class="sidebar__link-icon">${p.icon}</span>`;
            html += `<span>${p.title}</span>`;
            html += `</a>`;
        }
        html += `</div>`;
    }

    document.querySelector('.sidebar').innerHTML = html;
}

// ============================================================
// Copy code button
// ============================================================
function attachCopyButtons() {
    document.querySelectorAll('.code-block__copy').forEach(btn => {
        btn.addEventListener('click', async () => {
            const code = btn.closest('.code-block').querySelector('code');
            const text = code.innerText;
            try {
                await navigator.clipboard.writeText(text);
                const originalText = btn.innerText;
                btn.innerText = '✓ Đã copy!';
                setTimeout(() => { btn.innerText = originalText; }, 1500);
            } catch (err) {
                console.error('Copy failed:', err);
                alert('Không copy được. Hãy copy thủ công.');
            }
        });
    });
}

// ============================================================
// Mobile menu toggle
// ============================================================
function attachMenuToggle() {
    const toggle = document.querySelector('.header__menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        // Close on link click (mobile)
        sidebar.querySelectorAll('.sidebar__link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }
}

// ============================================================
// Search (simple filter on sidebar)
// ============================================================
function attachSearch() {
    const searchInput = document.querySelector('.header__search input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        document.querySelectorAll('.sidebar__link').forEach(link => {
            const text = link.innerText.toLowerCase();
            if (!q || text.includes(q)) {
                link.style.display = '';
            } else {
                link.style.display = 'none';
            }
        });
        // Hide group titles if no children visible
        document.querySelectorAll('.sidebar__group').forEach(group => {
            const visible = group.querySelectorAll('.sidebar__link:not([style*="display: none"])').length;
            group.style.display = visible > 0 ? '' : 'none';
        });
    });
}

// ============================================================
// Page navigation (prev/next)
// ============================================================
function renderPageNav() {
    const nav = document.querySelector('.page-nav');
    if (!nav) return;

    // Find current page index
    const currentPath = window.location.pathname;
    let currentIdx = -1;
    for (let i = 0; i < PAGES.length; i++) {
        if (currentPath.endsWith(PAGES[i].file) ||
            (PAGES[i].id === 'index' && (currentPath.endsWith('/') || currentPath.endsWith('index.html')))) {
            currentIdx = i;
            break;
        }
    }
    if (currentIdx === -1) return;

    const isInPagesDir = currentPath.includes('/pages/');
    const prefix = isInPagesDir ? '' : 'pages/';

    const prev = currentIdx > 0 ? PAGES[currentIdx - 1] : null;
    const next = currentIdx < PAGES.length - 1 ? PAGES[currentIdx + 1] : null;

    let html = '';
    if (prev) {
        const href = prev.id === 'index' ? (isInPagesDir ? '../index.html' : 'index.html') : prefix + prev.file.replace('pages/', '');
        html += `<a href="${href}" class="page-nav__link">
            <span class="page-nav__link-label">← Bài trước</span>
            ${prev.title}
        </a>`;
    } else {
        html += `<span></span>`;
    }
    if (next) {
        const href = next.id === 'index' ? (isInPagesDir ? '../index.html' : 'index.html') : prefix + next.file.replace('pages/', '');
        html += `<a href="${href}" class="page-nav__link page-nav__link--next">
            <span class="page-nav__link-label">Bài tiếp theo →</span>
            ${next.title}
        </a>`;
    }
    nav.innerHTML = html;
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    buildSidebar();
    attachCopyButtons();
    attachMenuToggle();
    attachSearch();
    renderPageNav();
});
