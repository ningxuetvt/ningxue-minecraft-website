/* 两个小交互：书架"可以横滑"的提示、复制 IG ID。 */
document.addEventListener('DOMContentLoaded', () => {
    // ---------- 1. 书架横滑提示 ----------
    const shelf = document.querySelector('.bookshelf');
    const hint = document.getElementById('shelfHint');
    if (shelf && hint) {
        const check = () => {
            const scrollable = shelf.scrollWidth > shelf.clientWidth + 8;
            const atStart = shelf.scrollLeft < 8;
            hint.classList.toggle('is-idle', scrollable && atStart);
        };
        check();
        shelf.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check);
    }

    // ---------- 2. 組員介紹下拉 ----------
    const menu = document.getElementById('memberMenu');
    const toggle = document.getElementById('memberToggle');
    if (menu && toggle) {
        const closeMenu = (focusBack) => {
            menu.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            if (focusBack) toggle.focus();
        };
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menu.classList.contains('is-open')) {
                closeMenu();
            } else {
                menu.classList.add('is-open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });
        // 点空白处、按 Esc 都要收起来
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) closeMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
        });
        // 选了某一项就收起，免得下次点开还是展开状态
        menu.querySelectorAll('.member-list a').forEach((a) => {
            a.addEventListener('click', () => closeMenu());
        });
    }

    // ---------- 3. 复制 IG ID ----------
    const btn = document.getElementById('copyIg');
    if (!btn) return;
    const text = btn.dataset.copy || '';

    const flashDone = () => {
        const old = btn.textContent;
        btn.textContent = '已複製 ✓';
        btn.classList.add('done');
        setTimeout(() => {
            btn.textContent = old;
            btn.classList.remove('done');
        }, 1600);
    };

    btn.addEventListener('click', async () => {
        try {
            if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('no api');
            await navigator.clipboard.writeText(text);
            flashDone();
        } catch (e) {
            // file:// 打开或旧浏览器没有 clipboard API，退回 textarea 方案
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;left:-9999px;top:0';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            document.body.removeChild(ta);
            if (ok) flashDone();
            else btn.textContent = text;   // 实在复制不了，就把 ID 摊在按钮上
        }
    });
});
