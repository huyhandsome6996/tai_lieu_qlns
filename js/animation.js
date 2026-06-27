/* ============================================================
   animation.js — Thư viện animation mô phỏng thuật toán
   ============================================================
   Hỗ trợ 4 thuật toán:
     1. DSLK đôi (DoublyLinkedList) — thêm/xóa/tìm node
     2. Merge Sort — chia đôi + trộn
     3. Stack LIFO — push/pop/peek
     4. Queue FIFO — enqueue/dequeue

   Mỗi animation có:
     - Play/Pause
     - Step (chạy từng bước)
     - Reset
     - Speed slider (chậm → nhanh)
   ============================================================ */

(function () {
    'use strict';

    /* ============================================================
       CORE: Animation Engine
       ============================================================ */

    /**
     * Tạo 1 animation engine — tự inject canvas + desc + controls nếu chưa có.
     * @param {Object} opts
     *   - container: element chứa animation
     *   - steps: mảng các bước, mỗi bước = {desc, draw(ctx)}
     *   - speed: ms giữa các bước khi auto-play (mặc định 1200)
     */
    function createAnimation(opts) {
        const container = opts.container;
        const steps = opts.steps || [];

        // Auto-inject structure nếu container trống
        if (!container.querySelector('.anim-canvas')) {
            container.innerHTML = `
                <div class="anim-canvas"></div>
                <div class="anim-desc"></div>
                <div class="anim-controls">
                    <button type="button" class="anim-btn anim-btn-play">▶ Play</button>
                    <button type="button" class="anim-btn anim-btn-pause" disabled>⏸ Pause</button>
                    <button type="button" class="anim-btn anim-btn-step anim-btn--step">⏭ Từng bước</button>
                    <button type="button" class="anim-btn anim-btn-reset anim-btn--reset">↺ Reset</button>
                    <span class="anim-step-counter"></span>
                    <div class="anim-speed-wrap">
                        <span>Tốc độ:</span>
                        <input type="range" min="1" max="100" value="50" class="anim-speed">
                        <span class="anim-speed-label">Vừa</span>
                    </div>
                </div>
            `;
        }

        const canvas = container.querySelector('.anim-canvas');
        const descEl = container.querySelector('.anim-desc');
        const stepCounterEl = container.querySelector('.anim-step-counter');
        const speedSlider = container.querySelector('.anim-speed');
        const btnPlay = container.querySelector('.anim-btn-play');
        const btnPause = container.querySelector('.anim-btn-pause');
        const btnStep = container.querySelector('.anim-btn-step');
        const btnReset = container.querySelector('.anim-btn-reset');

        let currentIdx = 0;
        let timer = null;
        let baseDelay = parseInt(speedSlider ? speedSlider.value : 1200, 10);

        function render() {
            const step = steps[currentIdx];
            if (!step) return;
            if (descEl) descEl.innerHTML = step.desc || '';
            if (stepCounterEl) stepCounterEl.textContent = `Bước ${currentIdx + 1}/${steps.length}`;
            if (step.draw && canvas) step.draw(canvas);
            updateButtons();
        }

        function updateButtons() {
            if (btnStep) btnStep.disabled = currentIdx >= steps.length - 1;
            if (btnReset) btnReset.disabled = currentIdx === 0 && !timer;
            if (btnPlay) btnPlay.disabled = timer !== null;
            if (btnPause) btnPause.disabled = timer === null;
        }

        function nextStep() {
            if (currentIdx < steps.length - 1) {
                currentIdx++;
                render();
            } else {
                pause();
            }
        }

        function play() {
            if (timer) return;
            if (currentIdx >= steps.length - 1) currentIdx = 0; // auto-reset nếu hết
            timer = setInterval(() => {
                nextStep();
            }, baseDelay);
            updateButtons();
        }

        function pause() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            updateButtons();
        }

        function step() {
            pause();
            nextStep();
        }

        function reset() {
            pause();
            currentIdx = 0;
            render();
        }

        function setSpeed(ms) {
            baseDelay = ms;
            if (timer) {
                pause();
                play();
            }
        }

        // Bind events
        if (btnPlay) btnPlay.addEventListener('click', play);
        if (btnPause) btnPause.addEventListener('click', pause);
        if (btnStep) btnStep.addEventListener('click', step);
        if (btnReset) btnReset.addEventListener('click', reset);
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                // Slider 1-100, map sang delay 2000ms - 200ms (đảo ngược)
                const v = parseInt(e.target.value, 10);
                const ms = 2200 - v * 20; // 1 → 2180ms, 100 → 200ms
                setSpeed(ms);
                const label = container.querySelector('.anim-speed-label');
                if (label) {
                    label.textContent = v <= 30 ? 'Chậm' : v <= 70 ? 'Vừa' : 'Nhanh';
                }
            });
        }

        // Initial render
        render();

        return { play, pause, step, reset, setSpeed };
    }

    /* ============================================================
       HELPER: Vẽ Node DSLK
       ============================================================ */

    function drawDslkNode(parent, label, opts = {}) {
        const node = document.createElement('div');
        node.className = 'dslk-node';
        if (opts.highlight) node.classList.add('dslk-node--highlight');
        if (opts.head) node.classList.add('dslk-node--head');
        if (opts.tail) node.classList.add('dslk-node--tail');
        if (opts.dim) node.classList.add('dslk-node--dim');

        const data = document.createElement('div');
        data.className = 'dslk-node__data';
        data.textContent = label;
        node.appendChild(data);

        const ptrs = document.createElement('div');
        ptrs.className = 'dslk-node__ptrs';
        ptrs.innerHTML = '<span class="ptr-prev">←</span><span class="ptr-next">→</span>';
        node.appendChild(ptrs);

        parent.appendChild(node);
        return node;
    }

    function drawDslkArrow(parent, direction = 'next', opts = {}) {
        const arrow = document.createElement('div');
        arrow.className = 'dslk-arrow';
        if (direction === 'next') arrow.textContent = '⇄';
        if (opts.highlight) arrow.classList.add('dslk-arrow--highlight');
        parent.appendChild(arrow);
    }

    /* ============================================================
       ANIMATION 1: DSLK đôi — Thêm node vào cuối
       ============================================================ */

    function initDslkThemVaoCuoi(container) {
        const steps = [
            {
                desc: '<strong>Bước 1:</strong> Ban đầu DSLK rỗng. <code>head = None</code>, <code>cuoi = None</code>, <code>so_luong = 0</code>.',
                draw(c) {
                    c.innerHTML = '<div class="dslk-empty">DSLK rỗng<br><small>head = None, cuoi = None</small></div>';
                }
            },
            {
                desc: '<strong>Bước 2:</strong> Gọi <code>them_vao_cuoi("Sách A")</code>. Tạo Node mới: <code>node_moi = Node("Sách A")</code>, <code>node_moi.truoc = None</code>, <code>node_moi.next = None</code>.',
                draw(c) {
                    c.innerHTML = '';
                    const node = drawDslkNode(c, 'Sách A', { highlight: true });
                }
            },
            {
                desc: '<strong>Bước 3:</strong> Vì <code>self.head is None</code> (danh sách rỗng) → gán <code>head = node_moi</code> VÀ <code>cuoi = node_moi</code>. Node mới VỪA là đầu VỪA là cuối.',
                draw(c) {
                    c.innerHTML = '';
                    drawDslkNode(c, 'Sách A', { head: true, tail: true, highlight: true });
                }
            },
            {
                desc: '<strong>Bước 4:</strong> Tăng <code>so_luong</code> lên 1. Xong thao tác thêm đầu tiên. DSLK giờ có 1 node.',
                draw(c) {
                    c.innerHTML = '';
                    drawDslkNode(c, 'Sách A', { head: true, tail: true });
                    const note = document.createElement('div');
                    note.className = 'dslk-note';
                    note.textContent = 'so_luong = 1';
                    c.appendChild(note);
                }
            },
            {
                desc: '<strong>Bước 5:</strong> Gọi tiếp <code>them_vao_cuoi("Sách B")</code>. Tạo Node mới "Sách B".',
                draw(c) {
                    c.innerHTML = '';
                    drawDslkNode(c, 'Sách A', { head: true });
                    drawDslkArrow(c);
                    drawDslkNode(c, 'Sách B', { highlight: true });
                }
            },
            {
                desc: '<strong>Bước 6:</strong> Vì <code>head != None</code> (đã có node) → gán <code>cuoi.next = node_moi</code> (Sách A trỏ tới Sách B) VÀ <code>node_moi.truoc = cuoi</code> (Sách B trỏ ngược về Sách A).',
                draw(c) {
                    c.innerHTML = '';
                    drawDslkNode(c, 'Sách A', { head: true });
                    drawDslkArrow(c, 'next', { highlight: true });
                    drawDslkNode(c, 'Sách B', { highlight: true });
                }
            },
            {
                desc: '<strong>Bước 7:</strong> Cập nhật <code>cuoi = node_moi</code> (cuối giờ là Sách B). Tăng <code>so_luong = 2</code>. Hoàn thành!',
                draw(c) {
                    c.innerHTML = '';
                    drawDslkNode(c, 'Sách A', { head: true });
                    drawDslkArrow(c);
                    drawDslkNode(c, 'Sách B', { tail: true });
                    const note = document.createElement('div');
                    note.className = 'dslk-note';
                    note.textContent = 'so_luong = 2';
                    c.appendChild(note);
                }
            }
        ];

        return createAnimation({ container, steps });
    }

    /* ============================================================
       ANIMATION 2: Merge Sort
       ============================================================ */

    function initMergeSort(container) {
        // Số liệu ban đầu: [38, 27, 43, 3, 9, 82, 10]
        const initial = [38, 27, 43, 3, 9, 82, 10];

        const steps = [
            {
                desc: '<strong>Bước 1:</strong> Mảng ban đầu cần sắp xếp: <code>[38, 27, 43, 3, 9, 82, 10]</code>. Merge Sort sẽ <strong>chia để trị</strong>: chia đôi → đệ quy sắp xếp từng nửa → trộn lại.',
                draw(c) { drawMergeArray(c, [initial], [0]); }
            },
            {
                desc: '<strong>Bước 2:</strong> <strong>CHIA</strong> mảng thành 2 nửa bằng kỹ thuật Fast/Slow pointer. Nửa trái: <code>[38, 27, 43, 3]</code>. Nửa phải: <code>[9, 82, 10]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [38, 27, 43, 3],
                        [9, 82, 10]
                    ], [0, 1]);
                }
            },
            {
                desc: '<strong>Bước 3:</strong> Đệ quy sắp xếp nửa trái <code>[38, 27, 43, 3]</code>. <strong>CHIA</strong> tiếp thành <code>[38, 27]</code> + <code>[43, 3]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [38, 27],
                        [43, 3],
                        [9, 82, 10]
                    ], [0, 1, 2]);
                }
            },
            {
                desc: '<strong>Bước 4:</strong> Tiếp tục đệ quy với <code>[38, 27]</code> → <strong>CHIA</strong> thành <code>[38]</code> + <code>[27]</code>. Mảng 1 phần tử đã được coi là "sắp xếp rồi".',
                draw(c) {
                    drawMergeArray(c, [
                        [38],
                        [27],
                        [43, 3],
                        [9, 82, 10]
                    ], [0, 1, 2, 3]);
                }
            },
            {
                desc: '<strong>Bước 5:</strong> <strong>TRỘN</strong> <code>[38]</code> + <code>[27]</code> → so sánh 38 vs 27. 27 nhỏ hơn → lấy 27 trước. Còn 38 → lấy sau. Kết quả: <code>[27, 38]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [27, 38],
                        [43, 3],
                        [9, 82, 10]
                    ], [0]);
                }
            },
            {
                desc: '<strong>Bước 6:</strong> Đệ quy nửa phải <code>[43, 3]</code> → <strong>CHIA</strong> thành <code>[43]</code> + <code>[3]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [27, 38],
                        [43],
                        [3],
                        [9, 82, 10]
                    ], [0, 1, 2, 3]);
                }
            },
            {
                desc: '<strong>Bước 7:</strong> <strong>TRỘN</strong> <code>[43]</code> + <code>[3]</code> → 3 nhỏ hơn → lấy 3 trước, 43 sau. Kết quả: <code>[3, 43]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [27, 38],
                        [3, 43],
                        [9, 82, 10]
                    ], [0, 1]);
                }
            },
            {
                desc: '<strong>Bước 8:</strong> <strong>TRỘN</strong> <code>[27, 38]</code> + <code>[3, 43]</code>: so sánh 27 vs 3 → lấy 3. So 27 vs 43 → lấy 27. So 38 vs 43 → lấy 38. Còn 43 → lấy. Kết quả: <code>[3, 27, 38, 43]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [3, 27, 38, 43],
                        [9, 82, 10]
                    ], [0]);
                }
            },
            {
                desc: '<strong>Bước 9:</strong> Đệ quy nửa phải ban đầu <code>[9, 82, 10]</code> → <strong>CHIA</strong> thành <code>[9, 82]</code> + <code>[10]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [3, 27, 38, 43],
                        [9, 82],
                        [10]
                    ], [0, 1, 2]);
                }
            },
            {
                desc: '<strong>Bước 10:</strong> <code>[9, 82]</code> → <strong>CHIA</strong> thành <code>[9]</code> + <code>[82]</code>. Cả 2 đều là mảng 1 phần tử → đã sắp xếp.',
                draw(c) {
                    drawMergeArray(c, [
                        [3, 27, 38, 43],
                        [9],
                        [82],
                        [10]
                    ], [0, 1, 2, 3]);
                }
            },
            {
                desc: '<strong>Bước 11:</strong> <strong>TRỘN</strong> <code>[9]</code> + <code>[82]</code> → 9 nhỏ hơn → lấy trước, 82 → lấy sau. Kết quả: <code>[9, 82]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [3, 27, 38, 43],
                        [9, 82],
                        [10]
                    ], [0, 1]);
                }
            },
            {
                desc: '<strong>Bước 12:</strong> <strong>TRỘN</strong> <code>[9, 82]</code> + <code>[10]</code>: so 9 vs 10 → lấy 9. So 82 vs 10 → lấy 10. Còn 82 → lấy. Kết quả: <code>[9, 10, 82]</code>.',
                draw(c) {
                    drawMergeArray(c, [
                        [3, 27, 38, 43],
                        [9, 10, 82]
                    ], [0, 1]);
                }
            },
            {
                desc: '<strong>Bước 13:</strong> <strong>TRỘN cuối cùng</strong>: <code>[3, 27, 38, 43]</code> + <code>[9, 10, 82]</code>. So từng cặp → lấy nhỏ hơn trước. Kết quả: <code>[3, 9, 10, 27, 38, 43, 82]</code> ✅ Đã sắp xếp!',
                draw(c) {
                    drawMergeArray(c, [
                        [3, 9, 10, 27, 38, 43, 82]
                    ], [0]);
                }
            }
        ];

        return createAnimation({ container, steps });
    }

    function drawMergeArray(canvas, rows, highlightRowIdxs = []) {
        canvas.innerHTML = '';
        rows.forEach((row, idx) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'merge-row';
            if (highlightRowIdxs.includes(idx)) rowEl.classList.add('merge-row--active');

            const arr = document.createElement('div');
            arr.className = 'merge-array';
            row.forEach(v => {
                const cell = document.createElement('div');
                cell.className = 'merge-cell';
                cell.textContent = v;
                arr.appendChild(cell);
            });
            rowEl.appendChild(arr);
            canvas.appendChild(rowEl);
        });
    }

    /* ============================================================
       ANIMATION 3: Stack LIFO (push + pop)
       ============================================================ */

    function initStackLifo(container) {
        const steps = [
            {
                desc: '<strong>Bước 1:</strong> Stack rỗng. <code>dinh = None</code>, <code>so_luong = 0</code>. Sẽ mô phỏng 3 thao tác <code>push</code> rồi 3 thao tác <code>pop</code>.',
                draw(c) { drawStack(c, []); }
            },
            {
                desc: '<strong>Bước 2:</strong> <code>day_vao("Sửa A")</code> (PUSH). Tạo Node mới, <code>node_moi.duoi = self.dinh</code> (= None vì stack rỗng). Gán <code>dinh = node_moi</code>. <code>so_luong = 1</code>.',
                draw(c) { drawStack(c, ['Sửa A']); }
            },
            {
                desc: '<strong>Bước 3:</strong> <code>day_vao("Sửa B")</code> (PUSH). Tạo Node mới, <code>node_moi.duoi = self.dinh</code> (trỏ xuống "Sửa A"). Gán <code>dinh = node_moi</code>. <code>so_luong = 2</code>.',
                draw(c) { drawStack(c, ['Sửa A', 'Sửa B']); }
            },
            {
                desc: '<strong>Bước 4:</strong> <code>day_vao("Sửa C")</code> (PUSH). Tạo Node mới, <code>node_moi.duoi = self.dinh</code> (trỏ xuống "Sửa B"). Gán <code>dinh = node_moi</code>. <code>so_luong = 3</code>. Lưu ý: phần tử ĐẨY VÀO SAU CÙNG nằm TRÊN CÙNG.',
                draw(c) { drawStack(c, ['Sửa A', 'Sửa B', 'Sửa C']); }
            },
            {
                desc: '<strong>Bước 5:</strong> Bấm UNDO → <code>lay_ra()</code> (POP). Lưu <code>data = dinh.data</code> ("Sửa C"). Gán <code>dinh = dinh.duoi</code> (hạ xuống "Sửa B"). Trả về "Sửa C". <code>so_luong = 2</code>.',
                draw(c) { drawStack(c, ['Sửa A', 'Sửa B'], 'pop'); }
            },
            {
                desc: '<strong>Bước 6:</strong> Bấm UNDO tiếp → POP "Sửa B" ra. <code>dinh</code> hạ xuống "Sửa A". Trả về "Sửa B". <code>so_luong = 1</code>.<br><br>Lưu ý <strong>LIFO</strong>: "Sửa C" vào sau cùng nhưng RA trước, "Sửa A" vào đầu tiên sẽ RA cuối cùng.',
                draw(c) { drawStack(c, ['Sửa A'], 'pop'); }
            },
            {
                desc: '<strong>Bước 7:</strong> Bấm UNDO tiếp → POP "Sửa A" ra. <code>dinh = None</code>, <code>so_luong = 0</code>. Stack trở về rỗng.<br><br>Khi user UNDO, "Sửa A" (thao tác đầu tiên) mới bị hoàn tác — đúng theo LIFO.',
                draw(c) { drawStack(c, [], 'pop'); }
            }
        ];

        return createAnimation({ container, steps });
    }

    function drawStack(canvas, items, action = '') {
        canvas.innerHTML = '';
        const stack = document.createElement('div');
        stack.className = 'stack-container';
        if (action === 'pop') stack.classList.add('stack-container--pop');

        // Stack vẽ từ dưới lên (đáy ở dưới, đỉnh ở trên)
        const bottomLabel = document.createElement('div');
        bottomLabel.className = 'stack-label stack-label--bottom';
        bottomLabel.textContent = '↓ Đáy (vào trước, ra sau)';
        stack.appendChild(bottomLabel);

        // Render items từ đáy lên đỉnh
        for (let i = items.length - 1; i >= 0; i--) {
            const node = document.createElement('div');
            node.className = 'stack-node';
            if (i === items.length - 1) {
                node.classList.add('stack-node--top');
                if (action === 'pop') node.classList.add('stack-node--popping');
            }
            const idx = document.createElement('span');
            idx.className = 'stack-node__idx';
            idx.textContent = items.length - i; // 1, 2, 3...
            const data = document.createElement('span');
            data.className = 'stack-node__data';
            data.textContent = items[i];
            node.appendChild(idx);
            node.appendChild(data);
            stack.appendChild(node);
        }

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'stack-empty';
            empty.textContent = 'Stack rỗng (dinh = None)';
            stack.appendChild(empty);
        }

        const topLabel = document.createElement('div');
        topLabel.className = 'stack-label stack-label--top';
        topLabel.textContent = '↑ Đỉnh (vào sau, ra trước) — push/pop đều ở đây';
        stack.appendChild(topLabel);

        canvas.appendChild(stack);
    }

    /* ============================================================
       ANIMATION 4: Queue FIFO (enqueue + dequeue)
       ============================================================ */

    function initQueueFifo(container) {
        const steps = [
            {
                desc: '<strong>Bước 1:</strong> Queue rỗng. <code>dau = None</code>, <code>cuoi_hang = None</code>, <code>so_luong = 0</code>. Sẽ mô phỏng 3 thao tác <code>enqueue</code> (them_vao) rồi thanh toán <code>dequeue</code> (lay_ra).',
                draw(c) { drawQueue(c, []); }
            },
            {
                desc: '<strong>Bước 2:</strong> <code>them_vao("Sách A")</code> (ENQUEUE). Tạo Node mới. Vì queue rỗng → gán <code>dau = cuoi_hang = node_moi</code>. <code>so_luong = 1</code>.',
                draw(c) { drawQueue(c, ['Sách A']); }
            },
            {
                desc: '<strong>Bước 3:</strong> <code>them_vao("Sách B")</code> (ENQUEUE). Tạo Node mới. <code>cuoi_hang.sau = node_moi</code> (Sách A trỏ tới Sách B). Cập nhật <code>cuoi_hang = node_moi</code>. <code>so_luong = 2</code>.',
                draw(c) { drawQueue(c, ['Sách A', 'Sách B']); }
            },
            {
                desc: '<strong>Bước 4:</strong> <code>them_vao("Sách C")</code> (ENQUEUE). Tương tự: Sách B trỏ tới Sách C, <code>cuoi_hang = Sách C</code>. <code>so_luong = 3</code>.<br><br>Lưu ý: phần tử THÊM VÀO ĐẦU TIÊN (Sách A) nằm ở <code>dau</code>.',
                draw(c) { drawQueue(c, ['Sách A', 'Sách B', 'Sách C']); }
            },
            {
                desc: '<strong>Bước 5:</strong> Bấm <strong>Thanh toán</strong> → <code>lay_ra()</code> (DEQUEUE). Lưu <code>data = dau.data</code> ("Sách A"). Gán <code>dau = dau.sau</code> (dịch sang Sách B). Trả về "Sách A". <code>so_luong = 2</code>.',
                draw(c) { drawQueue(c, ['Sách A', 'Sách B', 'Sách C'], 'dequeue'); }
            },
            {
                desc: '<strong>Bước 6:</strong> Thanh toán tiếp → DEQUEUE "Sách B". <code>dau</code> dịch sang Sách C. Trả về "Sách B". <code>so_luong = 1</code>.<br><br>Lưu ý <strong>FIFO</strong>: "Sách A" vào trước → ra trước; "Sách C" vào sau → ra sau cùng.',
                draw(c) { drawQueue(c, ['Sách B', 'Sách C'], 'dequeue'); }
            },
            {
                desc: '<strong>Bước 7:</strong> Thanh toán lần cuối → DEQUEUE "Sách C". <code>dau = None</code>, vì vậy <code>cuoi_hang = None</code> (reset cả 2). <code>so_luong = 0</code>. Queue trở về rỗng.',
                draw(c) { drawQueue(c, ['Sách C'], 'dequeue'); }
            }
        ];

        return createAnimation({ container, steps });
    }

    function drawQueue(canvas, items, action = '') {
        canvas.innerHTML = '';
        const queue = document.createElement('div');
        queue.className = 'queue-container';

        const dauLabel = document.createElement('div');
        dauLabel.className = 'queue-label queue-label--dau';
        dauLabel.innerHTML = '↓ <code>dau</code> (DEQUEUE ở đây — vào trước, ra trước)';
        queue.appendChild(dauLabel);

        const row = document.createElement('div');
        row.className = 'queue-row';

        items.forEach((item, idx) => {
            if (idx > 0) {
                const arrow = document.createElement('div');
                arrow.className = 'queue-arrow';
                arrow.textContent = '→';
                row.appendChild(arrow);
            }
            const node = document.createElement('div');
            node.className = 'queue-node';
            if (idx === 0) {
                node.classList.add('queue-node--dau');
                if (action === 'dequeue') node.classList.add('queue-node--leaving');
            }
            if (idx === items.length - 1) {
                node.classList.add('queue-node--cuoi');
            }
            const idxEl = document.createElement('span');
            idxEl.className = 'queue-node__idx';
            idxEl.textContent = idx + 1;
            const data = document.createElement('span');
            data.className = 'queue-node__data';
            data.textContent = item;
            node.appendChild(idxEl);
            node.appendChild(data);
            row.appendChild(node);
        });

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'queue-empty';
            empty.textContent = 'Queue rỗng (dau = cuoi_hang = None)';
            row.appendChild(empty);
        }

        queue.appendChild(row);

        const cuoiLabel = document.createElement('div');
        cuoiLabel.className = 'queue-label queue-label--cuoi';
        cuoiLabel.innerHTML = '↑ <code>cuoi_hang</code> (ENQUEUE ở đây — vào sau, ra sau)';
        queue.appendChild(cuoiLabel);

        canvas.appendChild(queue);
    }

    /* ============================================================
       AUTO-INIT: Tìm tất cả [data-anim] và khởi tạo
       ============================================================ */

    document.addEventListener('DOMContentLoaded', () => {
        // DSLK
        document.querySelectorAll('[data-anim="dslk-them-cuoi"]').forEach(c => initDslkThemVaoCuoi(c));
        // Merge Sort
        document.querySelectorAll('[data-anim="merge-sort"]').forEach(c => initMergeSort(c));
        // Stack LIFO
        document.querySelectorAll('[data-anim="stack-lifo"]').forEach(c => initStackLifo(c));
        // Queue FIFO
        document.querySelectorAll('[data-anim="queue-fifo"]').forEach(c => initQueueFifo(c));
    });

})();
