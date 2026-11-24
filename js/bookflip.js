// 书架封面翻转：桌面宽屏保留 CSS hover；窄屏把封面移到不受滚动裁切的上层播放原版飞出动画
(function () {
    var mq = window.matchMedia('(max-width:640px)');
    if (!mq.matches) return;   // 桌面宽屏：保留原 hover 飞出，不接管

    var layer = document.getElementById('flyingLayer');
    var books = document.querySelectorAll('.book');
    var active = null;
    var clone = null;
    var fadeTimer = null;   // 克隆淡出后移除 DOM 并恢复原书的定时器

    // 清空浮层里的克隆（含正在淡出的旧克隆），确保浮层内至多一个封面
    function clearClones() {
        if (!layer) return;
        var leftovers = layer.querySelectorAll('.flying-cover');
        for (var i = 0; i < leftovers.length; i++) {
            if (leftovers[i].parentNode) leftovers[i].parentNode.removeChild(leftovers[i]);
        }
    }

    // 把所有原书恢复成书脊状态
    function restoreBooks() {
        books.forEach(function (b) { b.classList.remove('fly-source'); });
    }

    // 与 CSS 中 .book-cover 一致：78×112，初始贴书脊侧转收拢，飞出后翻正放大 10%
    var CW = 78, CH = 112;
    var T_IN = 'perspective(760px) translateY(14px) rotateY(-92deg) scale(.35)';
    var T_OUT = 'perspective(760px) translateY(-46px) rotateY(-10deg) rotateZ(-3deg) scale(1.1)';

    function fly(book) {
        if (active === book) return;
        close();
        // 立刻清掉仍在淡出的旧克隆，避免快速切换时浮层出现两个封面
        if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
        clearClones();
        restoreBooks();
        var img = book.querySelector('.book-cover img');
        if (!img || !layer) return;
        var r = book.getBoundingClientRect();

        clone = document.createElement('a');
        clone.className = 'flying-cover';
        clone.href = book.getAttribute('href');
        clone.target = '_blank';
        clone.rel = 'noopener noreferrer';
        clone.setAttribute('aria-label', book.getAttribute('title') || img.alt || '');
        var ci = document.createElement('img');
        ci.src = img.src;
        ci.alt = img.alt || '';
        clone.appendChild(ci);

        // 复刻 .book-cover 相对书脊的位置：left:50% margin-left:-39px; bottom:-6px
        clone.style.left = (r.left + r.width / 2 - CW / 2) + 'px';
        clone.style.top = (r.bottom + 6 - CH) + 'px';
        clone.style.width = CW + 'px';
        clone.style.height = CH + 'px';
        clone.style.transformOrigin = '50% 85%';
        clone.style.transform = T_IN;
        clone.style.opacity = '0';
        clone.style.transition = 'transform .42s cubic-bezier(.2,.85,.25,1), opacity .25s ease';
        layer.appendChild(clone);

        book.classList.add('fly-source');
        active = book;

        // 双帧确保初始样式已渲染，再触发过渡动画
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (clone) {
                    clone.style.transform = T_OUT;
                    clone.style.opacity = '1';
                }
            });
        });
    }

    function close() {
        if (!active) return;
        var book = active;
        var c = clone;
        active = null;
        clone = null;
        if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
        if (c) {
            c.style.pointerEvents = 'none';   // 收起淡出期间不再响应点击，交互只在弹出时生效
            c.style.transform = T_IN;
            c.style.opacity = '0';
            // 克隆淡出并移除后才让原书恢复可见，消除“原书 + 克隆”双可见窗口
            fadeTimer = setTimeout(function () {
                fadeTimer = null;
                clearClones();
                book.classList.remove('fly-source');
            }, 450);
        } else {
            book.classList.remove('fly-source');
        }
    }

    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    books.forEach(function (book) {
        if (canHover) {
            book.addEventListener('mouseenter', function () { fly(book); });
            book.addEventListener('mouseleave', function () { close(); });
        }
        book.addEventListener('click', function (e) {
            // 窄屏：第一次点飞出封面；再点同一本放行跳转
            if (active === book) return;
            e.preventDefault();
            fly(book);
        });
    });

    // 点击空白处 / Esc 收起封面
    document.addEventListener('click', function (e) {
        if (active && !active.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });
    // 滚动后上层封面的定位会与书脱节，直接收起
    window.addEventListener('scroll', close, { passive: true });
    var shelf = document.querySelector('.bookshelf');
    if (shelf) shelf.addEventListener('scroll', close, { passive: true });
})();
