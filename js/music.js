/* 音乐栏：点击唱片播放/暂停本地音频，箭头键也可通过 button 聚焦操作 */
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bgm');
    const buttons = document.querySelectorAll('.disc-scene');
    if (!audio || !buttons.length) return;

    let currentBtn = null;

    function setPlaying(btn, on) {
        const row = btn.closest('.music-row');
        if (!row) return;
        const track = btn.dataset.track || '';
        if (on) {
            row.classList.add('playing');
            btn.setAttribute('aria-label', '暫停 ' + track);
        } else {
            row.classList.remove('playing');
            btn.setAttribute('aria-label', '播放 ' + track);
        }
    }

    function clearAll() {
        buttons.forEach((b) => setPlaying(b, false));
    }

    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            // 点当前正在播放的唱片 -> 暂停
            if (currentBtn === btn && !audio.paused) {
                audio.pause();
                setPlaying(btn, false);
                currentBtn = null;
                return;
            }

            // 换歌：先清掉所有播放态
            clearAll();
            audio.src = btn.dataset.src;
            audio.currentTime = 0;

            const p = audio.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    setPlaying(btn, true);
                    currentBtn = btn;
                }).catch(() => {
                    setPlaying(btn, false);
                    currentBtn = null;
                });
            } else {
                setPlaying(btn, true);
                currentBtn = btn;
            }
        });
    });

    // 播放结束自动复位
    audio.addEventListener('ended', () => {
        clearAll();
        currentBtn = null;
    });
});
