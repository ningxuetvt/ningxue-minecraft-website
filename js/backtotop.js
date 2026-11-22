// 右下角「返回顶端」按钮：滚动一段后显示，点击平滑回到顶部
(function () {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    function update() {
        if (window.scrollY > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();
