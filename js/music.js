/* 音乐栏：点唱片机播放，再点一下暂停。
   状态写在 .track 上：is-loading / is-playing / is-paused / is-error
   —— 换了首歌就整条重置，暂停后继续播不会从头再来。 */
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('bgm');
    const tracks = Array.from(document.querySelectorAll('.track'));
    if (!audio || !tracks.length) return;

    let current = null;      // 当前曲目（暂停也保留，续播才接得上）
    let timer = 0;           // 进度刷新定时器
    let switching = false;   // 正在换源，避免 pause 事件把状态写乱

    const pad = (n) => (n < 10 ? '0' + n : String(n));
    const fmt = (s) => (isFinite(s) && s > 0 ? Math.floor(s / 60) + ':' + pad(Math.floor(s % 60)) : '0:00');

    function bar(track, pct) {
        const fill = track.querySelector('.fill');
        if (fill) fill.style.setProperty('--p', pct.toFixed(2) + '%');
    }

    function setState(track, state) {
        track.classList.remove('is-playing', 'is-paused', 'is-loading', 'is-error');
        if (state) track.classList.add('is-' + state);
        track.setAttribute('aria-label', (state === 'is-playing' ? '暫停 ' : '播放 ') + track.dataset.track);
    }

    function resetTrack(track) {
        setState(track, null);
        bar(track, 0);
        const cur = track.querySelector('.cur');
        if (cur) cur.textContent = '0:00';
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = 0;
        }
    }

    function startTimer() {
        stopTimer();
        timer = setInterval(() => {
            if (!current) return;
            const d = audio.duration;
            if (isFinite(d) && d > 0) {
                bar(current, Math.min(100, (audio.currentTime / d) * 100));
                const cur = current.querySelector('.cur');
                if (cur) cur.textContent = fmt(audio.currentTime);
            }
        }, 250);
    }

    function fail(track, err) {
        // 浏览器拦了自动播放（省电模式 / 无手势）不是文件坏了，别吓用户
        if (err && err.name === 'NotAllowedError') {
            setState(track, null);
            const c = track.querySelector('.cur');
            if (c) c.textContent = '點一下播放';
            stopTimer();
            return;
        }
        setState(track, 'error');
        const cur = track.querySelector('.cur');
        if (cur) cur.textContent = '載入失敗';
        stopTimer();
    }

    tracks.forEach((track) => {
        track.addEventListener('click', () => {
            // 同一首歌：暂停 / 续播（续播不再重置 currentTime，也不会重新下载）
            if (current === track) {
                if (audio.paused) {
                    setState(track, 'loading');
                    audio.play().then(() => {
                        setState(track, 'playing');
                        startTimer();
                    }).catch((err) => fail(track, err));
                } else {
                    audio.pause();
                    setState(track, 'paused');
                    stopTimer();
                }
                return;
            }

            // 换歌：先把上一首的状态清干净
            if (current) resetTrack(current);
            switching = true;
            current = track;
            audio.src = track.dataset.src;
            try { audio.currentTime = 0; } catch (e) { /* 新源尚未加载，个别浏览器会抛 InvalidState */ }
            bar(track, 0);
            const cur = track.querySelector('.cur');
            if (cur) cur.textContent = '載入中…';
            setState(track, 'loading');

            audio.play().then(() => {
                switching = false;
                setState(track, 'playing');
                startTimer();
            }).catch((err) => {
                switching = false;
                fail(track, err);
            });
        });
    });

    // 元数据到位后，用真实时长纠正文字（硬编码的只是兜底）
    audio.addEventListener('loadedmetadata', () => {
        if (!current) return;
        const dur = current.querySelector('.dur');
        if (dur && isFinite(audio.duration)) dur.textContent = fmt(audio.duration);
    });

    audio.addEventListener('playing', () => {
        if (!current) return;
        setState(current, 'playing');
        startTimer();
    });

    audio.addEventListener('pause', () => {
        if (switching || !current || audio.ended) return;
        setState(current, 'paused');
        stopTimer();
    });

    audio.addEventListener('ended', () => {
        if (!current) return;
        resetTrack(current);
        current = null;
        stopTimer();
    });

    audio.addEventListener('error', () => {
        if (switching || !current) return;
        fail(current, audio.error);
    });

    // 页面切到后台就停掉进度定时器，回来再接着算
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopTimer();
        else if (current && !audio.paused) startTimer();
    });
});
