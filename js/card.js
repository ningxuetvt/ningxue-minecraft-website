/* 卡片展示层：点击图片打开无相框大图，拖动 3D 旋转（松手惯性衰减），双击复位 */
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('cardOverlay');
    const closeBtn = document.getElementById('cardClose');
    const resetBtn = document.getElementById('cardReset');
    const card = document.getElementById('flipCard');
    const cardStage = document.getElementById('cardStage');
    const cardImg = document.getElementById('cardImg');
    const cardName = document.getElementById('cardName');
    const triggers = document.querySelectorAll('.item-frame[data-photo]');
    if (!overlay || !card || !triggers.length) return;

    let rotX = 0, rotY = 0;           // 当前旋转角度
    let dragging = false;
    let moved = false;                // 本次是否真的拖动过
    let lastDragEnd = 0;              // 上次拖动结束时间，抑制尾随 click 误关闭
    let startX = 0, startY = 0, baseX = 0, baseY = 0;

    // 惯性相关：速度单位 度/毫秒，rAF 逐帧累加并按阻尼衰减
    let velX = 0, velY = 0;
    let inertiaRAF = 0;
    let lastMoveX = 0, lastMoveY = 0, lastMoveT = 0;
    const FRICTION = 0.94;            // 每 16.67ms 保留的速度比例（越小停得越快）

    function applyRotation() {
        card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    function stopInertia() {
        if (inertiaRAF) {
            cancelAnimationFrame(inertiaRAF);
            inertiaRAF = 0;
        }
    }

    // 松手后：按当前角速度继续转，逐帧减速直到静止
    function startInertia() {
        stopInertia();
        if (Math.abs(velX) < 0.01 && Math.abs(velY) < 0.01) return;
        let prev = performance.now();
        function step(now) {
            const dt = Math.min(now - prev, 50);   // 限制单帧步进，避免切后台回来跳变
            prev = now;
            rotX += velX * dt;
            rotY += velY * dt;
            const decay = Math.pow(FRICTION, dt / 16.67);
            velX *= decay;
            velY *= decay;
            applyRotation();
            if (Math.abs(velX) > 0.005 || Math.abs(velY) > 0.005) {
                inertiaRAF = requestAnimationFrame(step);
            } else {
                inertiaRAF = 0;
            }
        }
        inertiaRAF = requestAnimationFrame(step);
    }

    function open(src, name) {
        stopInertia();
        cardImg.src = src;
        cardImg.alt = name;
        cardName.textContent = name;
        rotX = 0; rotY = 0;
        card.style.transition = 'transform .35s ease-out';
        applyRotation();
        // 必须先显示遮罩，才能量到卡片真实宽度（display:none 时 clientWidth 为 0）
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        const w = cardStage.clientWidth || 300;
        card.style.setProperty('--w', w + 'px');       // 卡片宽高（正方形）
        card.style.setProperty('--e', '20px');         // 薄盒厚度：正反面相距 20px
    }

    function close() {
        stopInertia();
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function reset() {
        stopInertia();
        rotX = 0; rotY = 0;
        card.style.transition = 'transform .45s ease-out';
        applyRotation();
    }

    // 打开：点击 / 键盘 Enter、空格
    triggers.forEach((el) => {
        el.addEventListener('click', () => open(el.dataset.photo, el.dataset.name));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(el.dataset.photo, el.dataset.name);
            }
        });
    });

    // 拖动旋转：监听整个遮罩，从任意位置按下都能拖，移出也不丢失
    overlay.addEventListener('pointerdown', (e) => {
        if (e.target === closeBtn || e.target === resetBtn) return;   // 按钮不触发拖动
        stopInertia();                       // 重新按下时中断惯性
        velX = 0; velY = 0;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        baseX = rotX;
        baseY = rotY;
        lastMoveX = e.clientX;
        lastMoveY = e.clientY;
        lastMoveT = performance.now();
        card.style.transition = 'none';      // 拖动时立即跟手
        card.classList.add('dragging');
    });

    window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

        // 采样本次移动的瞬时角速度（度/毫秒），指数平滑避免抖动
        const now = performance.now();
        const dt = now - lastMoveT;
        if (dt > 0) {
            const instY = ((e.clientX - lastMoveX) * 0.5) / dt;   // 横向 -> Y 轴
            const instX = (-(e.clientY - lastMoveY) * 0.5) / dt;  // 纵向 -> X 轴
            velY = velY * 0.35 + instY * 0.65;
            velX = velX * 0.35 + instX * 0.65;
        }
        lastMoveX = e.clientX;
        lastMoveY = e.clientY;
        lastMoveT = now;

        rotY = baseY + dx * 0.5;             // 横向拖 -> 绕 Y 轴转（不限制，可整圈翻）
        rotX = baseX - dy * 0.5;             // 纵向拖 -> 绕 X 轴转（不限制，可从上方翻到背面）
        applyRotation();
    });

    window.addEventListener('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        if (moved) {
            lastDragEnd = Date.now();        // 拖动过则记录时间，抑制尾随 click
            // 停顿越久惯性越弱：停顿 300ms 以上才完全停住，避免"拖完顿一下松手"时惯性消失
            const idle = performance.now() - lastMoveT;
            const keep = Math.max(0, 1 - idle / 300);
            velX *= keep;
            velY *= keep;
            startInertia();
        }
        card.classList.remove('dragging');
    });
    window.addEventListener('pointercancel', () => {
        dragging = false;
        stopInertia();
        card.classList.remove('dragging');
    });

    // 复位：按钮 / 双击卡片
    resetBtn.addEventListener('click', reset);
    cardStage.addEventListener('dblclick', reset);

    // 关闭：按钮 / 点遮罩空白处 / Esc
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (Date.now() - lastDragEnd < 350) return;  // 拖动刚结束的 click 不关闭
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
});
