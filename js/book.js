(function () {
  var STORY = window.STORY, READY = window.READY || [];
  var root = document.documentElement;
  function $(id) { return document.getElementById(id); }
  var book = $('book'), air = $('air'), castEl = $('cast'), world = $('world'), fx = $('fx'), veil = $('veil');
  var sideL = book.querySelector('.side.l'), sideR = book.querySelector('.side.r');
  var topL = sideL.querySelector('.top'), topR = sideR.querySelector('.top');
  var castL = topL.querySelector('.cast'), castR = topR.querySelector('.cast');

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function has(name) { return READY.indexOf(name) >= 0; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function sm(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  // ---------- 쪽 만들기 ----------
  // side: 'R' = 낱장의 앞면(오른쪽에 놓임), 'L' = 뒷면(왼쪽에 놓임). gloss: 종이의 윤기 (그림 쪽은 코팅지)
  // 글이 있는 쪽은 key를 붙인다. img/txt/key.jpg 로 구워 둔 것이 있으면(window.BAKED) 글 대신 그 그림을 쓴다.
  var q = {}; location.hash.slice(1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) q[p[0]] = p[1]; });
  var BAKED = q.bake ? [] : (window.BAKED || []), keyed = {};
  function pg(cls, side, html, gloss, key) {
    var p;
    if (key && BAKED.indexOf(key) >= 0) p = el('div', 'pg baked ' + side + (cls.indexOf('plate') >= 0 ? ' plate' : ''), '<div class="art" style="background-image:url(img/txt/' + key + '.jpg)"></div>');
    else p = el('div', 'pg ' + cls + ' ' + side, html);
    p._gloss = gloss || 0; if (key) keyed[key] = p; return p;
  }
  // 문장 단위로 묶어서, 한 문장이 줄 끝에 조금 걸쳤다가 넘어가는 일이 없게 한다 (“...” 같은 말줄임표에서는 끊지 않는다)
  function sentences(t) {
    // 의존명사(수, 줄, 것…)는 앞말에, 그 밖의 한 글자 낱말(길, 제, 그, 한…)은 뒷말에 붙여 둔다
    t = t.replace(/ ([수줄것때적])(?=[ .,!?”’]|$)/g, '\u00A0$1').replace(/(^| |“|‘)([가-힣]) (?=[가-힣“‘<])/g, function (m, pre, ch) { return '수줄것때적'.indexOf(ch) >= 0 ? m : pre + ch + '\u00A0'; });
    t = t.replace(/([’”])(?=[가-힣])/g, '$1\u2060');   // ‘부탁해’도 처럼 따옴표 뒤 조사가 떨어지지 않게
    var list = t.replace(/([가-힣a-zA-Z0-9][.!?]+[”’]?)\s+/g, '$1\u0001').split('\u0001'), merged = [];
    list.forEach(function (s) { var n = merged.length; if (n && merged[n - 1].length <= 5) merged[n - 1] += ' ' + s; else merged.push(s); });   // “네.” 같은 아주 짧은 문장은 다음 문장과 한 덩어리로
    return merged.map(function (s) {
      // 쉼표 앞뒤가 모두 충분히 길면 쉼표에서 줄이 바뀌게 한다
      var parts = s.split(/, /), out = [], cur = '';
      parts.forEach(function (c, i) {
        var piece = c + (i < parts.length - 1 ? ',' : '');
        cur = cur ? cur + ' ' + piece : piece;
        var rest = parts.slice(i + 1).join(', ');
        if (i === parts.length - 1 || (cur.length >= 10 && rest.length >= 10)) { out.push(cur); cur = ''; }
      });
      var inner = out.map(function (c) { return '<span class="c">' + esc(c).replace(/&lt;.+?&gt;/g, '<span class="nb">$&</span>') + '</span>'; }).join(' ');
      return '<span class="s">' + inner + '</span>';
    }).join(' ');
  }
  function paras(lines) { return lines.map(function (l) { return '<p class="' + l[0] + '">' + sentences(l[1]) + '</p>'; }).join(''); }

  function words(s) {
    return pg('paper words', 'L', '<div class="t"><div class="in">' + paras(s.lines) + '</div></div><div class="folio">' + s.n + '</div>', 0, 'w' + s.n);
  }
  function plate(s, side) {
    var half = s.half ? ' half-' + s.half : '';
    if (!has(s.img)) return pg('paper plate wait' + half, side, '<div class="ph"><div><b>' + s.n + '</b>그림 준비 중</div></div>', 0);
    var over = (s.half && s.lines.length) ? '<div class="over">' + paras(s.lines) + '</div>' : '';
    return pg('plate' + half, side, '<div class="art" style="background-image:url(img/' + s.img + '.jpg)"></div><div class="age"></div><div class="rim"></div>' + over, 1, over ? 's' + s.n : null);
  }

  var cover = pg('cover', 'R', '<div class="glint"></div>', .3);
  var back = pg('back', 'L', '<div class="glint"></div>', .3);
  var epi = pg('paper epi', 'L',
    '<div class="orn"></div><div class="in"><span>Oh! hear a pensive captive’s prayer,</span><span>For liberty that sighs;</span>' +
    '<span>And never let thine heart be shut</span><span>Against the prisoner’s cries.</span>' +
    '<div class="src">애나 리티샤 바볼드, 「The Mouse’s Petition」, 1773</div></div>', 0, 'epi');
  var title = pg('paper title', 'R',
    '<h2>The Mouse’s<br>Petition</h2><div class="orn"></div><div class="sub">낭만이와 AI의 이야기</div><div class="by">1조 지음</div>', 0, 'title');
  var colo = pg('paper colo', 'L',
    '<div class="orn"></div><div class="in"><b>The Mouse’s Petition</b>낭만이와 AI의 이야기<br>글·그림 1조<br>그림은 생성형 AI로 만들었습니다.</div>', 0, 'colo');

  // 낱장: [앞면(오른쪽), 뒷면(왼쪽)]
  var leaves = [[cover, pg('endp', 'L', '', .35)], [pg('endp', 'R', '', .35), epi], [title, words(STORY[0])]];
  for (var i = 0; i < 15; i++) leaves.push([plate(STORY[i], 'R'), words(STORY[i + 1])]);
  leaves.push([plate(STORY[15], 'R'), plate(STORY[16], 'L')]);
  leaves.push([plate(STORY[17], 'R'), colo]);
  leaves.push([pg('paper', 'R', ''), pg('endp', 'L', '', .35)]);
  leaves.push([pg('endp', 'R', '', .35), back]);
  var LAST = leaves.length, PAPER = LAST - 2;
  function isHard(k) { return k === 0 || k === LAST - 1; }

  function labelFor(m) {
    if (m <= 0) return '표지';
    if (m === 2) return '속표지';
    if (m >= 3 && m <= 18) return (m - 2) + ' <i>/ 18</i>';
    if (m === 19) return '17 – 18 <i>/ 18</i>';
    if (m === 20) return '판권';
    if (m >= LAST) return '뒤표지';
    return '';
  }

  // 글이 긴 쪽은 글자를 조금씩 줄여 한 쪽에 담는다
  function fitWords() {
    var host = el('div'); host.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;height:600px;--W:600px;visibility:hidden';
    document.body.appendChild(host);
    leaves.forEach(function (lf) {
      var p = lf[1]; if (!p.classList.contains('words')) return;
      var parent = p.parentNode, next = p.nextSibling, inn = p.querySelector('.in');
      host.appendChild(p);
      p.classList.remove('long');
      for (var s = 4.8; s >= 2.6; s -= 0.075) {
        inn.style.fontSize = s.toFixed(3) + 'cqw';
        if (s < 3.6 && !p.classList.contains('long')) { p.classList.add('long'); s = 4.2; continue; }   // 긴 글은 여백을 좁혀 다시 맞춘다
        if (inn.offsetHeight <= 600 * (p.classList.contains('long') ? 0.76 : 0.72)) break;
      }
      if (parent) parent.insertBefore(p, next); else host.removeChild(p);
    });
    document.body.removeChild(host);
  }

  // ---------- 상태 ----------
  // lo보다 앞 낱장은 왼쪽에, hi부터는 오른쪽에 놓여 있다. [lo, hi)는 공중에 떠 있는 낱장.
  var W = 600, T = 40, lo = 0, hi = 0, flying = {}, lastDir = 1, raf = 0;
  var NS = 30, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function layout() {
    W = Math.max(160, Math.floor(Math.min(innerWidth * 0.4, innerHeight * 0.7)));
    T = W * 0.105;
    root.style.setProperty('--W', W + 'px'); root.style.setProperty('--T', T + 'px');
    root.style.setProperty('--dw', Math.max(innerWidth * 1.16, innerHeight * 1.7778 * 1.2) + 'px');
    Fx.size();
    for (var k in flying) build(flying[k]);
    render();
  }
  function thick(count) { return Math.max(3, T * clamp(count, 0, PAPER) / PAPER + 3); }
  function setTop(top, node) {
    var old = top.querySelector(':scope > .pg'); if (old === node) return;
    if (old) top.removeChild(old);
    if (node) top.insertBefore(node, top.firstChild);
  }
  function prog(k) { return k < lo ? 1 : k >= hi ? 0 : flying[k].p; }

  // ---------- 종이 한 장의 자세 ----------
  // 각도는 오른쪽 면에 누운 상태가 0, 왼쪽 면에 누운 상태가 180. 바깥 끝이 먼저 들리고 책등 쪽이 뒤따른다.
  function pose(p, N) {
    if (N === 1) return [180 * p];
    var Ae = 180 * sm(p / LEAD1), As = 180 * sm((p - LEAD) / LEAD1), B = Ae - As;
    var c = p < .5 ? 0.95 - 1.5 * p : 0.9 - 1.56 * (p - .5);
    var sg = 0.22 + 0.5 * Math.pow(Math.sin(Math.PI * p), 2);
    var w = [], sum = 0, i;
    for (i = 1; i < N; i++) { var x = (i / (N - 1) - c) / sg, v = Math.exp(-x * x) + 0.12; w.push(v); sum += v; }
    var a = [As], acc = As;
    for (i = 1; i < N; i++) { acc += B * w[i - 1] / sum; a.push(acc); }
    return a;
  }
  var LEAD = 0.27, LEAD1 = 1 - LEAD, RAD = Math.PI / 180;
  // 빛은 왼쪽 위에서 온다
  function darkF(f) { var d = 0.4 * Math.sin(f * RAD) + 0.92 * Math.cos(f * RAD); return clamp((0.92 - d) / 0.92, 0, 1) * 0.62; }
  function darkB(f) { var d = -0.4 * Math.sin(f * RAD) - 0.92 * Math.cos(f * RAD); return clamp((0.92 - d) / 0.92, 0, 1) * 0.72; }
  function specF(f) { return Math.pow(Math.max(0, Math.cos((f - 32) * RAD)), 50); }
  function specB(f) { return Math.pow(Math.max(0, Math.cos((f - 152) * RAD)), 18); }
  function grad(c, a, b) { return 'linear-gradient(90deg,rgba(' + c + ',' + a.toFixed(3) + '),rgba(' + c + ',' + b.toFixed(3) + '))'; }

  function build(lf) {
    if (lf.el) air.removeChild(lf.el);
    var k = lf.k, N = lf.hard ? 1 : NS, sw = W / N, parent = lf.el = el('div', 'leaf');
    lf.strips = []; lf.sw = sw;
    for (var i = 0; i < N; i++) {
      var s = el('div', 'strip');
      s.style.left = (i === 0 ? 0 : sw) + 'px'; s.style.width = (sw + 0.7) + 'px';
      var f = el('div', 'face f flat'), b = el('div', 'face b flat');
      var fp = leaves[k][0].cloneNode(true), bp = leaves[k][1].cloneNode(true);
      fp.style.left = (-i * sw) + 'px'; bp.style.left = (-(N - 1 - i) * sw) + 'px';
      f.appendChild(fp); b.appendChild(bp);
      var st = { el: s, fs: el('div', 'sh'), fh: el('div', 'hl'), bs: el('div', 'sh'), bh: el('div', 'hl'), fp: fp, bp: bp };
      f.appendChild(st.fs); f.appendChild(st.fh); b.appendChild(st.bs); b.appendChild(st.bh);
      s.appendChild(f); s.appendChild(b); parent.appendChild(s); parent = s;
      lf.strips.push(st);
    }
    lf.gf = leaves[k][0]._gloss; lf.gb = leaves[k][1]._gloss;
    air.appendChild(lf.el);
  }

  // 한 장을 그리고, 그 장이 아래 면에 드리우는 그림자 범위를 돌려준다
  function draw(lf) {
    var N = lf.strips.length, a = pose(lf.p, N), sw = lf.sw, x = 0, z = 0, zmax = 0, sMax = 0, sMin = 0;
    for (var i = 0; i < N; i++) {
      var st = lf.strips[i], prev = i ? a[i - 1] : a[0], next = i < N - 1 ? a[i + 1] : a[i];
      st.el.style.transform = 'rotateY(' + (-(i ? a[i] - a[i - 1] : a[0])).toFixed(3) + 'deg)';
      var f0 = (prev + a[i]) / 2, f1 = (a[i] + next) / 2;
      if (a[i] < 96) {
        st.fs.style.background = grad('14,7,2', darkF(f0), darkF(f1));
        st.fh.style.background = grad('255,238,205', specF(f0) * (0.05 + 0.3 * lf.gf), specF(f1) * (0.05 + 0.3 * lf.gf));
      }
      if (a[i] > 84) {
        st.bs.style.background = grad('14,7,2', darkB(f1), darkB(f0));
        st.bh.style.background = grad('255,238,205', specB(f1) * (0.07 + 0.2 * lf.gb), specB(f0) * (0.07 + 0.2 * lf.gb));
      }
      x += sw * Math.cos(a[i] * RAD); z += sw * Math.sin(a[i] * RAD);
      if (z > zmax) zmax = z;
      var sx = x + 0.38 * z; if (sx > sMax) sMax = sx; if (sx < sMin) sMin = sx;
    }
    if (lf.hard) {   // 은박과 천이 빛을 받는다
      var g = Math.pow(Math.max(0, Math.cos((a[0] - 34) * RAD)), 6), g2 = Math.pow(Math.max(0, Math.cos((a[0] - 150) * RAD)), 6);
      lf.strips[0].fp.style.setProperty('--g', g.toFixed(3)); lf.strips[0].bp.style.setProperty('--g', g2.toFixed(3));
    }
    var onLeft = lf.p > .5;
    lf.el.style.transform = 'translateZ(' + (0.6 + (onLeft ? lf.k - lo : hi - 1 - lf.k) * 0.5).toFixed(2) + 'px)';
    return { lift: clamp(zmax / (0.3 * W), 0, 1), sMax: sMax, sMin: sMin };
  }

  var where = $('where'), prevB = $('prev'), nextB = $('next');
  function render() {
    var k, any = false;
    for (k in flying) any = true;
    sideL.style.display = lo > 0 ? '' : 'none';
    sideR.style.display = hi < LAST ? '' : 'none';
    sideL.style.setProperty('--t', thick(lo - 1) + 'px');
    sideR.style.setProperty('--t', thick(LAST - 1 - hi) + 'px');
    setTop(topL, lo > 0 ? leaves[lo - 1][1] : null);
    setTop(topR, hi < LAST ? leaves[hi][0] : null);

    var shR = null, shL = null;
    for (k = lo; k < hi; k++) { var s = draw(flying[k]); if (k === lo) shL = s; if (k === hi - 1) shR = s; }
    if (shR && shR.sMax > 1 && shR.lift > 0.01) {
      var aR = 0.56 * shR.lift, xs = Math.min(shR.sMax, W * 1.2), soft = W * (0.03 + 0.2 * shR.lift);
      castR.style.background = 'linear-gradient(90deg,rgba(14,7,2,' + aR.toFixed(3) + ') 0,rgba(14,7,2,' + (aR * .8).toFixed(3) + ') ' + Math.max(0, xs - soft).toFixed(1) + 'px,rgba(14,7,2,0) ' + xs.toFixed(1) + 'px)';
    } else castR.style.background = 'none';
    if (shL && shL.sMin < -1 && shL.lift > 0.01) {
      var aL = 0.5 * shL.lift, pos = W + shL.sMin, softL = W * (0.03 + 0.12 * shL.lift);
      castL.style.background = 'linear-gradient(90deg,rgba(14,7,2,0) ' + (pos - softL).toFixed(1) + 'px,rgba(14,7,2,' + (aL * .8).toFixed(3) + ') ' + pos.toFixed(1) + 'px,rgba(14,7,2,' + aL.toFixed(3) + ') 100%)';
    } else castL.style.background = 'none';

    // 닫힌 책은 가운데에, 펼친 책은 책등이 가운데에 오게
    var c0 = sm(prog(0)), cB = sm(prog(LAST - 1));
    book.style.setProperty('--shift', (-W / 2 * (1 - c0) + W / 2 * cB).toFixed(2) + 'px');
    castEl.style.setProperty('--castL', (-W * c0).toFixed(1));
    castEl.style.setProperty('--castW', (W * c0 + W * (1 - cB)).toFixed(1));

    var view = any ? (lastDir > 0 ? hi : lo) : lo;
    var lab = labelFor(view); if (where._v !== lab) { where.innerHTML = lab; where._v = lab; }
    prevB.disabled = view <= 0; nextB.disabled = view >= LAST;
  }

  // ---------- 움직임 ----------
  function ease(u) { return 0.5 * u * u * (3 - 2 * u) + 0.5 * (1 - Math.pow(1 - u, 3)); }
  function aim(lf, to) {
    lf.from = lf.p; lf.to = to; lf.t0 = performance.now(); lf.manual = false;
    var base = reduce ? 320 : lf.hard ? 1700 : 1500;
    lf.dur = Math.max(reduce ? 160 : 300, base * Math.abs(to - lf.p));
  }
  function tick(now) {
    raf = 0;
    var k, lf, moving = false;
    for (k = lo; k < hi; k++) {
      lf = flying[k]; if (lf.manual) { moving = true; continue; }
      var u = clamp((now - lf.t0) / lf.dur, 0, 1);
      lf.p = lf.from + (lf.to - lf.from) * ease(u); lf.done = u >= 1;
      if (!lf.done) moving = true;
    }
    // 앞 장이 뒷 장을 앞지르지 못하게
    for (k = lo; k < hi - 1; k++) {
      var A = flying[k], B = flying[k + 1];
      if (B.p > A.p - 0.035) { if (B.to === 1 && !B.manual) B.p = Math.max(0, A.p - 0.035); else A.p = Math.min(1, B.p + 0.035); }
    }
    while (lo < hi && flying[lo].done && flying[lo].to === 1) { air.removeChild(flying[lo].el); delete flying[lo]; lo++; }
    while (hi > lo && flying[hi - 1].done && flying[hi - 1].to === 0) { air.removeChild(flying[hi - 1].el); delete flying[hi - 1]; hi--; }
    render();
    if (moving || lo < hi) go();
  }
  function go() { if (!raf) raf = requestAnimationFrame(tick); }
  function count() { return hi - lo; }
  function launch(k, p, to) {
    var lf = { k: k, hard: isHard(k), p: p };
    flying[k] = lf; build(lf);
    if (to != null) { aim(lf, to); Sound.turn(lf.hard); } else lf.manual = true;
    return lf;
  }
  function next() {
    lastDir = 1; var k;
    for (k = lo; k < hi; k++) if (flying[k].to === 0 && !flying[k].manual) { aim(flying[k], 1); go(); return; }
    if (hi >= LAST || count() >= 4) return;
    if (count() && flying[hi - 1].p < 0.1) return;
    launch(hi, 0, 1); hi++; go();
  }
  function prev() {
    lastDir = -1; var k;
    for (k = hi - 1; k >= lo; k--) if (flying[k].to === 1 && !flying[k].manual) { aim(flying[k], 0); go(); return; }
    if (lo <= 0 || count() >= 4) return;
    if (count() && flying[lo].p > 0.9) return;
    launch(lo - 1, 1, 0); lo--; go();
  }

  // ---------- 손으로 끌어 넘기기 ----------
  var drag = null;
  function pFromX(x) {
    var spine = air.getBoundingClientRect().left;
    var E = Math.acos(clamp((x - spine) / W, -1, 1)) / Math.PI, a = 0, b = 1;
    for (var i = 0; i < 18; i++) { var m = (a + b) / 2; if (sm(m) < E) a = m; else b = m; }
    return clamp(a * LEAD1, 0.02, 0.98);
  }
  function down(dir) {
    return function (e) {
      if (e.button != null && e.button !== 0) return;
      drag = { dir: dir, x0: e.clientX, x: e.clientX, t: performance.now(), v: 0, lf: null };
      e.preventDefault();
    };
  }
  function move(e) {
    if (!drag) return;
    var now = performance.now();
    if (!drag.lf) {
      if (Math.abs(e.clientX - drag.x0) < 8 || count()) return;
      if (drag.dir > 0 && hi < LAST) { drag.lf = launch(hi, 0, null); hi++; }
      else if (drag.dir < 0 && lo > 0) { drag.lf = launch(lo - 1, 1, null); lo--; }
      else return;
      lastDir = drag.dir; Sound.turn(drag.lf.hard);
    }
    drag.v = (e.clientX - drag.x) / Math.max(1, now - drag.t); drag.x = e.clientX; drag.t = now;
    drag.lf.p = pFromX(e.clientX); go();
  }
  function up() {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.lf) { if (Math.abs(d.x - d.x0) < 8) (d.dir > 0 ? next : prev)(); return; }
    var to = Math.abs(d.v) > 0.35 ? (d.v < 0 ? 1 : 0) : (d.lf.p > 0.5 ? 1 : 0);
    lastDir = to ? 1 : -1; aim(d.lf, to); go();
  }
  topR.addEventListener('pointerdown', down(1)); topL.addEventListener('pointerdown', down(-1));
  addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  prevB.addEventListener('click', prev); nextB.addEventListener('click', next);

  // ---------- 소리: 녹음된 파일만 쓴다 ----------
  var Sound = (function () {
    var cfg = window.AUDIO || {}, on = true, started = false, music = null, pool = [], last = -1;
    (cfg.page || []).forEach(function (src) { var a = new Audio(src); a.preload = 'auto'; pool.push(a); });
    var coverA = cfg.cover ? new Audio(cfg.cover) : null;
    function start() {
      if (started) return; started = true;
      if (cfg.music) { music = new Audio(cfg.music); music.loop = true; music.volume = 0.32; if (on) music.play().catch(function () {}); }
    }
    function turn(hard) {
      start(); if (!on) return;
      var a = hard && coverA ? coverA : null;
      if (!a && pool.length) { last = (last + 1) % pool.length; a = pool[last]; }
      if (!a) return;
      try { a.currentTime = 0; a.volume = hard ? 0.5 : 0.3; a.playbackRate = hard ? 1 : 0.9 + Math.random() * 0.2; a.play().catch(function () {}); } catch (e) {}
    }
    function set(v) {
      on = v; var b = $('sound'); b.setAttribute('aria-pressed', v ? 'true' : 'false');
      if (music) { if (v) music.play().catch(function () {}); else music.pause(); }
    }
    return { turn: turn, set: set, isOn: function () { return on; } };
  })();
  $('sound').addEventListener('click', function () { Sound.set(!Sound.isOn()); });
  function full() {
    var d = document, e = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (e.requestFullscreen || e.webkitRequestFullscreen).call(e);
  }
  $('full').addEventListener('click', full);

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter') { e.preventDefault(); if (!e.repeat || count() < 2) next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); if (!e.repeat || count() < 2) prev(); }
    else if (k === 'f' || k === 'F') full();
    else if (k === 'm' || k === 'M') Sound.set(!Sound.isOn());
  });
  addEventListener('resize', layout);

  // ---------- 카메라: 멀리 비스듬한 곳에서 책 위로 다가온다 ----------
  var camT = 1;
  function cam(t) {
    camT = t;
    var e = 0.25 * sm(t) + 0.75 * (1 - Math.pow(1 - t, 3.4));
    var rx = 63 + (14 - 63) * e, rz = -27 * (1 - e), z = -2000 * (1 - e), y = innerHeight * (0.015 + 0.1 * (1 - e));
    world.style.transform = 'translateY(' + y.toFixed(1) + 'px) translateZ(' + z.toFixed(1) + 'px) rotateX(' + rx.toFixed(3) + 'deg) rotateZ(' + rz.toFixed(3) + 'deg)';
  }
  function intro() {
    var t0 = null, dur = 3800;
    veil.classList.add('off');
    if (reduce) { cam(1); return; }
    cam(0);
    requestAnimationFrame(function step(now) {
      if (t0 === null) t0 = now;
      var u = clamp((now - t0) / dur, 0, 1); cam(u);
      if (u < 1) requestAnimationFrame(step);
    });
  }

  // ---------- 빛 먼지와 금가루 ----------
  var Fx = (function () {
    var ctx = fx.getContext('2d'), dpr = 1, w = 0, h = 0, motes = [], sparks = [], last = 0;
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1); w = innerWidth; h = innerHeight;
      fx.width = w * dpr; fx.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!motes.length) for (var i = 0; i < 44; i++) motes.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.5, vx: (Math.random() - .5) * 0.006, vy: -0.002 - Math.random() * 0.006, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.9 });
    }
    function dot(x, y, r, c, a) {
      ctx.fillStyle = 'rgba(' + c + ',' + (a * 0.16).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(' + c + ',' + a.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
    // 넘어가는 종이의 바깥 끝에서 금가루가 흩날린다
    function emit(lf) {
      var st = lf.strips[lf.strips.length - 1], v = Math.abs(lf.p - (lf.lastP == null ? lf.p : lf.lastP)); lf.lastP = lf.p;
      if (v < 0.0008 || sparks.length > 420) return;
      var r = st.el.getBoundingClientRect(), n = Math.min(5, Math.ceil(v * 420)), dir = lf.to === 0 ? -1 : 1;
      for (var i = 0; i < n; i++) sparks.push({ x: r.left + r.width * Math.random(), y: r.top + r.height * Math.random(), vx: dir * (0.02 + Math.random() * 0.07), vy: -0.015 - Math.random() * 0.05, r: 0.5 + Math.random() * 1.5, t: 0, life: 650 + Math.random() * 950 });
    }
    function loop(now) {
      var dt = Math.min(50, now - (last || now)); last = now;
      ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
      var i, m, s;
      if (!reduce) for (i = 0; i < motes.length; i++) {
        m = motes[i]; m.x += m.vx * dt / 100; m.y += m.vy * dt / 100; m.ph += m.sp * dt / 1000;
        if (m.y < -0.03) { m.y = 1.03; m.x = Math.random(); } if (m.x < -0.03) m.x = 1.03; if (m.x > 1.03) m.x = -0.03;
        var a = (0.1 + 0.2 * (0.5 + 0.5 * Math.sin(m.ph))) * Math.min(1, camT * 1.4);
        dot(m.x * w, m.y * h, m.r, m.x > 0.6 ? '190,212,255' : '255,214,150', a);
      }
      for (var k in flying) if (!reduce) emit(flying[k]);
      for (i = sparks.length - 1; i >= 0; i--) {
        s = sparks[i]; s.t += dt; if (s.t >= s.life) { sparks.splice(i, 1); continue; }
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.00006 * dt; s.vx *= 0.992;
        var u = s.t / s.life; dot(s.x, s.y, s.r * (1 - 0.5 * u), '255,216,140', (1 - u) * (u < 0.1 ? u * 10 : 1) * 0.95);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    return { size: size };
  })();

  // 확인용: 주소 끝에 #n=5 (5번째 펼침), #n=5&hold=0.4 (넘기는 도중 멈춤)
  if (q.n) lo = hi = clamp(parseInt(q.n, 10) || 0, 0, LAST);
  // 굽기: #bake=w5 로 열면 그 쪽 하나만 창에 가득 그린다. #bake=list 는 구울 쪽 이름을 제목에 적는다.
  if (q.bake) {
    document.body.className = 'bake';
    if (q.bake === 'list') { document.title = Object.keys(keyed).join(','); return; }
    var box = el('div'); box.id = 'bakebox'; document.body.appendChild(box);
    var show = function () { fitWords(); box.innerHTML = ''; box.appendChild(keyed[q.bake]); };
    show(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(show);
    return;
  }
  fitWords(); layout();
  if (q.hold && hi < LAST) { launch(hi, parseFloat(q.hold), null); hi++; render(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitWords(); layout(); });
  // #cam=0.3 처럼 쓰면 카메라를 그 지점에 세워 둔다. 쪽을 지정해 열면 들어오는 장면은 건너뛴다.
  if (q.cam != null) { veil.style.display = 'none'; cam(parseFloat(q.cam)); }
  else if (q.n || q.hold) { veil.style.display = 'none'; cam(1); }
  else { cam(0); var im = new Image(); im.onload = im.onerror = function () { setTimeout(intro, 250); }; im.src = 'tex/desk.jpg'; }
  addEventListener('resize', function () { cam(camT); });
  window.__book = { next: next, prev: prev, state: function () { return { lo: lo, hi: hi }; } };
})();
