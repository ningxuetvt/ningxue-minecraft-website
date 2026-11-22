/* 卡片展示层：点击图片打开无相框大图，拖动 3D 旋转，双击复位 */
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

    function applyRotation() {
        card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }

    function open(src, name) {
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
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function reset() {
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
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        baseX = rotX;
        baseY = rotY;
        card.style.transition = 'none';      // 拖动时立即跟手
        card.classList.add('dragging');
    });

    window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        rotY = baseY + dx * 0.5;             // 横向拖 -> 绕 Y 轴转（不限制，可整圈翻）
        rotX = baseX - dy * 0.5;             // 纵向拖 -> 绕 X 轴转（不限制，可从上方翻到背面）
        applyRotation();
    });

    window.addEventListener('pointerup', () => {
        if (!dragging) return;
        dragging = false;
        if (moved) lastDragEnd = Date.now();  // 拖动过则记录时间，抑制尾随 click
        card.classList.remove('dragging');
    });
    window.addEventListener('pointercancel', () => {
        dragging = false;
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
