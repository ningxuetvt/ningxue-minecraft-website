// 书架封面翻转：桌面端靠 CSS :hover；触屏设备改为点一下翻出封面，再点一下才打开链接
(function () {
    var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (canHover) return;

    var books = document.querySelectorAll('.book');
    var active = null;

    books.forEach(function (book) {
        book.addEventListener('click', function (e) {
            // 已翻开的是这本 -> 放行跳转
            if (active === book) return;
            // 其它情况：阻止跳转，改为翻出封面
            e.preventDefault();
            if (active) active.classList.remove('is-open');
            book.classList.add('is-open');
            active = book;
        });
    });

    // 点击书架外空白处收起封面
    document.addEventListener('click', function (e) {
        if (active && !active.contains(e.target)) {
            active.classList.remove('is-open');
            active = null;
        }
    });
})();
