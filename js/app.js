(function () {
  "use strict";

  const store = new ProgressStore();
  const byPkg = {};
  PACKAGES.forEach((p) => (byPkg[p.id] = QUESTIONS.filter((q) => q.pkg === p.id).map((q) => q.id)));
  const qById = {};
  QUESTIONS.forEach((q) => (qById[q.id] = q));

  const root = document.getElementById("app-screen");
  const topbarTitle = document.getElementById("topbar-title");
  const backBtn = document.getElementById("btn-back");
  const homeBtn = document.getElementById("btn-home");
  const topbar = document.getElementById("topbar");

  let stack = [{ screen: "splash" }];
  let session = null; // { mode, pkgId, slides: [{slideId, qId, answered}], correctCount }

  function current() { return stack[stack.length - 1]; }

  function push(view) {
    stack.push(view);
    render();
  }
  function goHome() {
    session = null;
    stack = [{ screen: "dashboard" }];
    render();
  }
  function back() {
    if (stack.length > 1) stack.pop();
    else stack = [{ screen: "dashboard" }];
    if (current().screen !== "trainer") session = null;
    render();
  }

  function icon(name) {
    const icons = {
      home: '<path d="M4 11.5 12 4l8 7.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      chevronLeft: '<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none">${icons[name] || ""}</svg>`;
  }
  backBtn.innerHTML = icon("chevronLeft");
  homeBtn.innerHTML = icon("home");

  backBtn.addEventListener("click", back);
  homeBtn.addEventListener("click", goHome);
  root.parentElement.addEventListener("scroll", () => {}, { passive: true });
  window.addEventListener("scroll", () => {
    topbar.classList.toggle("scrolled", window.scrollY > 2);
  });

  // ---------------------------------------------------------------
  // Persistente Etappenanzeige (ganz oben in der Leiste): ein Segelschiff
  // bewegt sich von links nach rechts entlang einer Route mit Insel-
  // Etappen. Die Position richtet sich ausschließlich nach der Anzahl
  // Fragen, die mindestens einmal RICHTIG beantwortet wurden (monoton
  // wachsend – eine spätere falsche Antwort lässt das Schiff nicht
  // zurückfallen). Beim Überqueren einer Etappe bzw. beim vollständigen
  // Abschluss gibt es eine kurze Erfolgsmeldung (Toast) + Konfetti.
  // ---------------------------------------------------------------
  const MILESTONES = [20, 40, 60, 80, 100];
  const MILESTONE_KEY = "sbf-trainer-milestone-idx-v1";
  const PKG_CELEBRATED_KEY = "sbf-trainer-pkg-celebrated-v1";

  function loadMilestoneIdx() {
    try { return parseInt(localStorage.getItem(MILESTONE_KEY) || "0", 10); } catch (e) { return 0; }
  }
  function saveMilestoneIdx(n) {
    try { localStorage.setItem(MILESTONE_KEY, String(n)); } catch (e) { /* ignore */ }
  }
  function loadCelebratedPkgs() {
    try { return new Set(JSON.parse(localStorage.getItem(PKG_CELEBRATED_KEY) || "[]")); } catch (e) { return new Set(); }
  }
  function saveCelebratedPkgs(set) {
    try { localStorage.setItem(PKG_CELEBRATED_KEY, JSON.stringify([...set])); } catch (e) { /* ignore */ }
  }

  function globalCorrectPercent() {
    const total = allIds.length;
    if (!total) return 0;
    return (store.everCorrectIds(allIds).length / total) * 100;
  }

  function topProgressHtml(percent) {
    const p = Math.max(0, Math.min(100, percent));
    const startX = 22, endX = 298;
    const x = startX + ((endX - startX) * p) / 100;
    const islands = MILESTONES.map((m) => {
      const ix = startX + ((endX - startX) * m) / 100;
      const reached = p >= m;
      const flag = m === 100 ? `<path d="M0 -5 L7 -5 L0 -12 Z" fill="${reached ? "var(--amber)" : "var(--ink-muted)"}"/><line x1="0" y1="-5" x2="0" y2="4" stroke="${reached ? "var(--amber)" : "var(--ink-muted)"}" stroke-width="1.4"/>` : "";
      return `<g transform="translate(${ix},19)">
        <circle r="4" fill="${reached ? "var(--green)" : "var(--bg-elevated)"}" stroke="${reached ? "var(--green)" : "var(--ink-muted)"}" stroke-width="1.5"/>
        ${flag}
      </g>`;
    }).join("");
    return `
      <div class="topbar-progress-inner" role="img" aria-label="${Math.round(p)}% der Fragen richtig beantwortet">
        <svg viewBox="0 0 320 40" class="topbar-progress-svg" aria-hidden="true">
          <line x1="${startX}" y1="19" x2="${endX}" y2="19" stroke="var(--line)" stroke-width="3" stroke-linecap="round"/>
          <line x1="${startX}" y1="19" x2="${x}" y2="19" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
          ${islands}
          <g transform="translate(${x},10)">
            <path d="M-10 18 Q0 25 10 18 L8 22 Q0 28 -8 22 Z" fill="var(--accent)"/>
            <path d="M1 16 L1 1 L11 15 Z" fill="var(--ink)"/>
            <line x1="1" y1="1" x2="1" y2="16" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/>
          </g>
        </svg>
        <span class="topbar-progress-label">${Math.round(p)}%</span>
      </div>
    `;
  }

  function renderTopProgress() {
    const el = document.getElementById("topbar-progress");
    if (!el) return;
    el.innerHTML = topProgressHtml(globalCorrectPercent());
  }

  let toastTimer = null;
  function showToast(message) {
    let el = document.getElementById("app-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    clearTimeout(toastTimer);
    requestAnimationFrame(() => el.classList.add("show"));
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  // Konfetti bleibt den zwei wirklich großen Momenten vorbehalten
  // (Paket abgeschlossen, alles geschafft) und fällt bewusst dezent aus,
  // damit die App nicht überladen wirkt – kein Feuerwerk bei jeder Etappe.
  function showConfetti(big) {
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    const colors = ["var(--accent)", "var(--green)", "var(--amber)"];
    const count = big ? 26 : 16;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${1.3 + Math.random() * 0.9}s`;
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 2400);
  }

  function checkMilestones() {
    const percent = globalCorrectPercent();
    const achieved = MILESTONES.filter((m) => percent >= m).length;
    const lastIdx = loadMilestoneIdx();
    if (achieved > lastIdx) {
      saveMilestoneIdx(achieved);
      const reachedPercent = MILESTONES[achieved - 1];
      if (reachedPercent >= 100) {
        showConfetti(true);
        showToast("Alle Fragen mindestens einmal richtig beantwortet");
      } else {
        showToast(`${reachedPercent}% richtig beantwortet`);
      }
    }
  }

  function checkPackageCompletion(pkgId) {
    if (!pkgId) return;
    const ids = byPkg[pkgId];
    if (!ids || !ids.every((id) => store.stateFor(id).everCorrect)) return;
    const celebrated = loadCelebratedPkgs();
    if (celebrated.has(pkgId)) return;
    celebrated.add(pkgId);
    saveCelebratedPkgs(celebrated);
    const p = PACKAGES.find((x) => x.id === pkgId);
    showConfetti(false);
    showToast(`Paket „${p.title}“ abgeschlossen`);
  }

  function overallStats() {
    const all = QUESTIONS.map((q) => q.id);
    return store.packageStats(all);
  }

  const allIds = QUESTIONS.map((q) => q.id);
  function globalWrongCount() {
    return store.wrongIds(allIds).length;
  }
  function globalWiederholungCount() {
    return store.wiederholungIds(allIds).length;
  }

  const PKG_ICON = { basis: "⚓", see: "🌊", binnen: "🚢", segeln: "⛵" };

  // ---------------------------------------------------------------
  // Tages-Streak (Duolingo-Prinzip: tägliche Praxis, verlustaversiv
  // sichtbar gemacht). Zählt hoch, sobald an einem neuen Kalendertag
  // mindestens eine Frage beantwortet wird; bricht bei einer Lücke ab.
  // ---------------------------------------------------------------
  const STREAK_KEY = "sbf-trainer-streak-v1";
  function todayStr(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function loadStreak() {
    try { return JSON.parse(localStorage.getItem(STREAK_KEY) || "null") || { count: 0, lastDate: null }; }
    catch (e) { return { count: 0, lastDate: null }; }
  }
  function saveStreak(s) {
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function bumpStreak() {
    const s = loadStreak();
    const today = todayStr();
    if (s.lastDate === today) return;
    const yStr = todayStr(new Date(Date.now() - 86400000));
    saveStreak({ count: s.lastDate === yStr ? s.count + 1 : 1, lastDate: today });
  }
  function currentStreak() {
    return loadStreak().count;
  }

  // ---------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------
  function renderDashboard() {
    topbarTitle.textContent = "SBF-Trainer";
    backBtn.style.visibility = "hidden";
    homeBtn.style.visibility = "hidden";

    const overall = overallStats();
    const wrongGlobal = globalWrongCount();
    const wdhGlobal = globalWiederholungCount();
    const bookmarkGlobal = store.bookmarkedIds(allIds).length;
    const streak = currentStreak();

    let html = `
      <div class="hero">
        <div class="hero-top-row">
          <div>
            <h1>Theorie-Trainer</h1>
            <p>SBF See &amp; SBF Binnen – kombinierte Prüfungsvorbereitung</p>
          </div>
          ${streak > 0 ? `<div class="streak-badge">🔥<span>${streak}</span></div>` : ""}
        </div>
      </div>

      <div class="card overview-card">
        <div class="overview-big">
          <div class="overview-big-num">${overall.processed}<span class="overview-big-total">/${overall.total}</span></div>
          <div class="overview-big-lbl">Fragen insgesamt beantwortet</div>
        </div>
        <div class="overview-grid overview-grid-3">
          <div class="overview-tile">
            <div class="num">${overall.neu}</div>
            <div class="lbl">🆕 neu</div>
          </div>
          <div class="overview-tile">
            <div class="num" style="color:var(--red)">${wrongGlobal}</div>
            <div class="lbl">falsch aktuell</div>
          </div>
          <div class="overview-tile">
            <div class="num" style="color:var(--green)">${overall.learned}</div>
            <div class="lbl">sicher gelernt</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="btn btn-primary" id="qa-wrong" ${wrongGlobal === 0 ? "disabled" : ""}>
          Falsch beantwortete üben – alle Pakete (${wrongGlobal})
        </button>
        <button class="btn btn-secondary" id="qa-wdh" ${wdhGlobal === 0 ? "disabled" : ""}>
          Wiederholungsstapel üben – alle Pakete (${wdhGlobal})
        </button>
      </div>

      <div class="section-label">Deine Fragenpakete</div>
    `;

    PACKAGES.forEach((p) => {
      const ids = byPkg[p.id];
      const s = store.packageStats(ids);
      html += `
        <button class="card pkg-card card-tap" data-pkg="${p.id}">
          <div class="pkg-head">
            <div>
              <div class="pkg-title"><span class="pkg-icon">${PKG_ICON[p.id] || "📘"}</span>${p.title}</div>
              <div class="pkg-subtitle">${p.subtitle}</div>
            </div>
            <div class="pkg-count">${s.processed}/${s.total}</div>
          </div>
          <div class="bar" style="margin-bottom:6px;"><div class="bar-fill" style="width:${s.percentProcessed}%"></div></div>
          <div class="bar" style="height:5px;"><div class="bar-fill wrong" style="width:${s.percentWrongOfProcessed}%"></div></div>
          <div class="stat-row">
            <span><span class="dot" style="background:var(--accent)"></span>${s.processed} bearbeitet</span>
            <span><span class="dot" style="background:var(--red)"></span>${s.wrong} falsch</span>
            <span><span class="dot" style="background:var(--green)"></span>${s.learned} gelernt</span>
          </div>
        </button>
      `;
    });

    html += `
      <button class="card pkg-card pkg-card-bookmarks card-tap" id="pkg-bookmarks" ${bookmarkGlobal === 0 ? "disabled" : ""}>
        <div class="pkg-head">
          <div>
            <div class="pkg-title"><span class="pkg-icon">🔖</span>Markierte Fragen</div>
            <div class="pkg-subtitle">Deine Lesezeichen aus allen Paketen</div>
          </div>
          <div class="pkg-count">${bookmarkGlobal}</div>
        </div>
      </button>
    `;

    html += `
      <div class="disclaimer">
        Hinweis zur Fragenquelle: Alle Fragen sind wortlaut- und nummerngetreu aus den amtlichen Fragenkatalogen
        SBF See und SBF Binnen (ELWIS, Stand 01.08.2023) übernommen. Fragen mit ⚠️-Hinweis beziehen sich im
        Original zusätzlich auf eine Abbildung (Licht, Tafelzeichen, Skizze o. Ä.), die hier nicht dargestellt
        werden kann. Details siehe README.
      </div>
    `;

    root.innerHTML = html;

    root.querySelectorAll(".pkg-card[data-pkg]").forEach((el) => {
      el.addEventListener("click", () => push({ screen: "package", pkgId: el.dataset.pkg }));
    });
    const qaWrong = document.getElementById("qa-wrong");
    if (qaWrong) {
      qaWrong.addEventListener("click", () => startSession(store.wrongIds(allIds), "wrong", null));
    }
    const qaWdh = document.getElementById("qa-wdh");
    if (qaWdh) {
      qaWdh.addEventListener("click", () => startSession(store.wiederholungIds(allIds), "wiederholung", null));
    }
    const pkgBookmarks = document.getElementById("pkg-bookmarks");
    if (pkgBookmarks) {
      pkgBookmarks.addEventListener("click", () => push({ screen: "bookmarks" }));
    }
  }

  // ---------------------------------------------------------------
  // Übersicht der markierten Fragen, aufgeschlüsselt nach Herkunfts-
  // paket – die "Hauptstapel"-Ansicht für Lesezeichen.
  // ---------------------------------------------------------------
  function renderBookmarksOverview() {
    topbarTitle.textContent = "Markierte Fragen";
    backBtn.style.visibility = "visible";
    homeBtn.style.visibility = "visible";

    const allBookmarks = store.bookmarkedIds(allIds);
    const perPkg = PACKAGES.map((p) => ({
      p,
      ids: store.bookmarkedIds(byPkg[p.id]),
    }));

    let html = `
      <div class="hero" style="padding-top:10px;">
        <h1 style="font-size:24px;">🔖 Markierte Fragen</h1>
        <p>Alle Fragen, die du mit einem Lesezeichen versehen hast</p>
      </div>

      <div class="quick-actions">
        <button class="btn btn-primary" id="btn-bookmarks-all" ${allBookmarks.length === 0 ? "disabled" : ""}>
          Alle markierten Fragen üben (${allBookmarks.length})
        </button>
      </div>

      <div class="section-label">Nach Fragenpaket</div>
    `;

    if (allBookmarks.length === 0) {
      html += `
        <div class="empty-state">
          <span class="big-emoji">🔖</span>
          <h2>Noch keine Lesezeichen</h2>
          <p>Tippe beim Üben auf das Lesezeichen-Symbol einer Frage, um sie hier wiederzufinden.</p>
        </div>
      `;
    } else {
      perPkg.forEach(({ p, ids }) => {
        html += `
          <button class="card pkg-card card-tap" data-bookmark-pkg="${p.id}" ${ids.length === 0 ? "disabled" : ""}>
            <div class="pkg-head">
              <div>
                <div class="pkg-title"><span class="pkg-icon">${PKG_ICON[p.id] || "📘"}</span>Markierte Fragen – ${p.title}</div>
                <div class="pkg-subtitle">${p.subtitle}</div>
              </div>
              <div class="pkg-count">${ids.length}</div>
            </div>
          </button>
        `;
      });
    }

    root.innerHTML = html;

    const allBtn = document.getElementById("btn-bookmarks-all");
    if (allBtn) allBtn.addEventListener("click", () => startSession(allBookmarks, "bookmarks", null));
    root.querySelectorAll(".pkg-card[data-bookmark-pkg]").forEach((el) => {
      el.addEventListener("click", () => {
        const pkgId = el.dataset.bookmarkPkg;
        startSession(store.bookmarkedIds(byPkg[pkgId]), "bookmarks", pkgId);
      });
    });
  }

  function renderPackage(pkgId) {
    const p = PACKAGES.find((x) => x.id === pkgId);
    const ids = byPkg[pkgId];
    const s = store.packageStats(ids);
    const neuIds = store.neuIds(ids);
    const wrongIds = store.wrongIds(ids);
    const wdhIds = store.wiederholungIds(ids);
    const bookmarkIds = store.bookmarkedIds(ids);

    topbarTitle.textContent = p.title;
    backBtn.style.visibility = "visible";
    homeBtn.style.visibility = "visible";

    const cats = {};
    ids.forEach((id) => {
      const q = qById[id];
      cats[q.category] = cats[q.category] || { total: 0, learned: 0 };
      cats[q.category].total += 1;
      if (store.stateFor(id).learned) cats[q.category].learned += 1;
    });

    let html = `
      <div class="hero" style="padding-top:10px;">
        <h1 style="font-size:24px;">${p.title}</h1>
        <p>${p.subtitle}</p>
      </div>

      <div class="overview-grid">
        <div class="overview-tile"><div class="num">${s.percentProcessed}%</div><div class="lbl">bearbeitet</div></div>
        <div class="overview-tile"><div class="num">${s.percentLearned}%</div><div class="lbl">sicher gelernt</div></div>
      </div>

      <div class="card">
        <div class="bar" style="margin-bottom:8px;"><div class="bar-fill" style="width:${s.percentProcessed}%"></div></div>
        <div class="bar" style="height:5px; margin-bottom:8px;"><div class="bar-fill wrong" style="width:${s.percentWrongOfProcessed}%"></div></div>
        <div class="bar" style="height:5px;"><div class="bar-fill learned" style="width:${s.percentLearned}%"></div></div>
        <div class="stat-row" style="margin-top:12px;">
          <span><strong>${s.processed}</strong>/${s.total} bearbeitet</span>
          <span><strong>${wrongIds.length}</strong> akt. falsch</span>
          <span><strong>${s.learned}</strong> gelernt</span>
        </div>
      </div>

      <div class="section-label">Kategorien in diesem Paket</div>
      <div class="card">
        ${Object.entries(cats).map(([cat, c]) => `
          <div class="stat-row" style="justify-content:space-between; margin:8px 0;">
            <span>${CATEGORIES[cat] || cat}</span>
            <span><strong>${c.learned}</strong>/${c.total} gelernt</span>
          </div>
        `).join("")}
      </div>

      <div class="section-label">Fragenstapel</div>
      <div class="card">
        <div class="stat-row" style="justify-content:space-between; margin:8px 0;">
          <span>🆕 Neu (unbeantwortet)</span><span><strong>${neuIds.length}</strong></span>
        </div>
        <div class="stat-row" style="justify-content:space-between; margin:8px 0;">
          <span><span class="dot" style="background:var(--red)"></span>Falsch beantwortet</span><span><strong>${wrongIds.length}</strong></span>
        </div>
        <div class="stat-row" style="justify-content:space-between; margin:8px 0;">
          <span><span class="dot" style="background:var(--green)"></span>Wiederholungsstapel</span><span><strong>${wdhIds.length}</strong></span>
        </div>
        <div class="stat-row" style="justify-content:space-between; margin:8px 0;">
          <span>🔖 Markierte Fragen</span><span><strong>${bookmarkIds.length}</strong></span>
        </div>
      </div>

      <div class="quick-actions" style="margin-top:20px;">
        <button class="btn btn-primary" id="btn-neu" ${neuIds.length === 0 ? "disabled" : ""}>
          Neue Fragen lernen (${neuIds.length})
        </button>
        <button class="btn btn-secondary" id="btn-wrong" ${wrongIds.length === 0 ? "disabled" : ""}>
          Falsch beantwortete üben (${wrongIds.length})
        </button>
        <button class="btn btn-secondary" id="btn-wdh" ${wdhIds.length === 0 ? "disabled" : ""}>
          Wiederholungsstapel üben (${wdhIds.length})
        </button>
        <button class="review-link" id="btn-wdh-review" ${wdhIds.length === 0 ? "disabled" : ""}>
          👁 Nur ansehen – ohne erneute Wertung
        </button>
        <button class="btn btn-secondary" id="btn-bookmarks" ${bookmarkIds.length === 0 ? "disabled" : ""}>
          🔖 Markierte Fragen üben (${bookmarkIds.length})
        </button>
      </div>
    `;

    root.innerHTML = html;
    const neuBtn = document.getElementById("btn-neu");
    const wrongBtn = document.getElementById("btn-wrong");
    const wdhBtn = document.getElementById("btn-wdh");
    const wdhReviewBtn = document.getElementById("btn-wdh-review");
    const bookmarksBtn = document.getElementById("btn-bookmarks");
    if (neuBtn) neuBtn.addEventListener("click", () => startSession(neuIds, "neu", pkgId));
    if (wrongBtn) wrongBtn.addEventListener("click", () => startSession(wrongIds, "wrong", pkgId));
    if (wdhBtn) wdhBtn.addEventListener("click", () => startSession(wdhIds, "wiederholung", pkgId));
    if (wdhReviewBtn) wdhReviewBtn.addEventListener("click", () => startReview(wdhIds, pkgId));
    if (bookmarksBtn) bookmarksBtn.addEventListener("click", () => startSession(bookmarkIds, "bookmarks", pkgId));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function letterFor(i) { return ["A", "B", "C", "D"][i]; }

  // ---------------------------------------------------------------
  // Trainer – vertikaler Wisch-Feed (Reel-Stil): jede Frage ist eine
  // eigene Vollbild-Karte in einem snap-scrollenden Feed. Nach oben
  // wischen zeigt die nächste Frage, egal ob die aktuelle beantwortet
  // wurde oder nicht – so lässt sich frei "durchrotieren". Eine falsch
  // beantwortete Frage wird nicht ersetzt, sondern als neue Karte ans
  // Ende des Feeds angehängt (Falsch-Stapel bleibt dadurch am Ende
  // erreichbar, ohne die bereits gescrollte Position zu verlieren).
  // ---------------------------------------------------------------

  let slideUid = 0;
  function makeSlide(qId, opts = {}) {
    slideUid += 1;
    const q = qById[qId];
    const order = shuffle(Array.from({ length: q.options.length }, (_, i) => i));
    return { slideId: `s${slideUid}`, qId, answered: opts.answered ?? null, order, reviewOnly: !!opts.reviewOnly };
  }

  function startSession(ids, mode, pkgId) {
    if (!ids || ids.length === 0) return;
    session = { mode, pkgId, slides: shuffle(ids).map((id) => makeSlide(id)), correctCount: 0 };
    push({ screen: "trainer" });
  }

  // Nur-Ansehen-Modus: Karten sind sofort im ausgewerteten Zustand (die
  // zuletzt gegebene Antwort ist markiert), lassen sich aber nicht erneut
  // beantworten – dient dem Durchsehen bereits richtig beantworteter
  // Fragen, ohne den Fortschritt (Falsch-/Wiederholungsstapel) zu ändern.
  function startReview(ids, pkgId) {
    if (!ids || ids.length === 0) return;
    const slides = shuffle(ids).map((id) => {
      const state = store.stateFor(id);
      const q = qById[id];
      const answered = state.lastChoice !== null && state.lastChoice !== undefined ? state.lastChoice : q.correct;
      return makeSlide(id, { answered, reviewOnly: true });
    });
    session = { mode: "review", pkgId, slides, correctCount: 0 };
    push({ screen: "trainer" });
  }

  const BOOKMARK_ICON = `<svg viewBox="0 0 24 24" fill="none"><path class="bm-path" d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="currentColor" fill-opacity="0"/></svg>`;

  function slideInnerHtml(slide) {
    const q = qById[slide.qId];
    const bookmarked = store.isBookmarked(slide.qId);
    const bookmarkHtml = `
      <button class="bookmark-btn${bookmarked ? " active" : ""}" data-bookmark-q="${slide.qId}" aria-label="Lesezeichen">
        ${BOOKMARK_ICON}
      </button>
    `;
    const photoHtml = q.image ? `<div class="photo-wrap"><img class="question-photo" src="${q.image}" alt="Original-Abbildung zur Frage" loading="lazy"></div>` : "";
    const diagramHtml = !q.image && q.diagram && DIAGRAMS[q.diagram] ? `<div class="diagram-wrap">${DIAGRAMS[q.diagram]}</div>` : "";
    const imageNoteHtml = !q.image && !q.diagram && q.note ? `
      <div class="image-frame">
        <svg class="image-frame-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="8" cy="10" r="1.6" fill="currentColor"/>
          <path d="M4 17 L9 12 L13 16 L16 13 L20 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="image-frame-label">Originalabbildung erforderlich</span>
        <span class="image-frame-note">${q.note}</span>
      </div>
    ` : "";
    const optionsHtml = slide.order.map((origIdx, pos) => `
      <button class="option" data-i="${origIdx}">
        <span class="letter">${letterFor(pos)}</span>
        <span class="option-text">${q.options[origIdx]}</span>
        <span class="option-mark" aria-hidden="true"></span>
      </button>
    `).join("");
    return `
      <div class="question-card">
        <div class="card-head-row">
          <span class="category-pill">${CATEGORIES[q.category] || q.category}</span>
          ${bookmarkHtml}
        </div>
        ${imageNoteHtml}
        ${photoHtml}
        ${diagramHtml}
        <p class="question-text">${q.q}</p>
        <div class="options">${optionsHtml}</div>
        <div class="answer-extra"></div>
      </div>
    `;
  }

  function slideOuterHtml(slide) {
    return `<section class="reel-slide" data-slide-id="${slide.slideId}">${slideInnerHtml(slide)}</section>`;
  }

  const CHECK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const CROSS_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;

  function fillAnsweredSlideDom(slideEl, slide) {
    const q = qById[slide.qId];
    const optionsEl = slideEl.querySelector(".options");
    if (optionsEl) optionsEl.classList.add("answered");
    slideEl.querySelectorAll(".option").forEach((btn) => {
      const origIdx = parseInt(btn.dataset.i, 10);
      btn.disabled = true;
      const mark = btn.querySelector(".option-mark");
      if (origIdx === q.correct) {
        btn.classList.add("correct");
        if (mark) mark.innerHTML = CHECK_ICON;
      } else if (origIdx === slide.answered) {
        btn.classList.add("wrong");
        if (mark) mark.innerHTML = CROSS_ICON;
      } else {
        btn.classList.add("muted");
      }
    });
    const extra = slideEl.querySelector(".answer-extra");
    if (extra) {
      extra.innerHTML = `
        <div class="source-note"><b>Quelle:</b> ${q.source}</div>
        <button class="btn btn-primary btn-scroll-next" type="button">Nächste Frage ↓</button>
      `;
    }
  }

  function updateReelProgress() {
    const stripEl = document.getElementById("reel-progress-strip");
    if (!stripEl) return;
    stripEl.innerHTML = session.slides.map((s) => {
      if (s.answered === null) return `<div class="seg"></div>`;
      const q = qById[s.qId];
      return `<div class="seg ${s.answered === q.correct ? "done" : "done-wrong"}"></div>`;
    }).join("");
  }

  function updateReelSummary() {
    const heading = document.getElementById("summary-heading");
    const text = document.getElementById("summary-text");
    const emoji = document.getElementById("summary-emoji");
    if (!heading) return;
    const answered = session.slides.filter((s) => s.answered !== null);
    if (answered.length === 0) return;
    const correct = answered.filter((s) => s.answered === qById[s.qId].correct).length;
    const pct = Math.round((correct / answered.length) * 100);
    const uniqueQIds = [...new Set(session.slides.map((s) => s.qId))];
    const stillWrong = uniqueQIds.filter((id) => store.stateFor(id).lastResult === "wrong").length;
    emoji.textContent = pct >= 90 ? "⚓️" : pct >= 60 ? "🧭" : "🌊";
    heading.textContent = `${correct} von ${answered.length} richtig`;
    text.textContent = stillWrong
      ? `${pct}% richtig. ${stillWrong} Frage(n) bleiben im Falsch-Stapel.`
      : `${pct}% richtig. Alle Fragen liegen jetzt im Wiederholungsstapel!`;
  }

  const AUTO_ADVANCE_DELAY = 1100;

  function scheduleAutoAdvance(slideEl) {
    const container = document.getElementById("reel-container");
    const scrollTopAtAnswer = container ? container.scrollTop : 0;
    setTimeout(() => {
      if (!slideEl.isConnected || !container) return;
      // Nur automatisch weiterwischen, wenn der Nutzer nicht zwischenzeitlich
      // selbst schon weiter- oder zurückgescrollt hat (frei durchrotieren
      // bleibt jederzeit möglich).
      if (Math.abs(container.scrollTop - scrollTopAtAnswer) > 30) return;
      const next = slideEl.nextElementSibling;
      if (next) next.scrollIntoView({ behavior: "smooth", block: "start" });
    }, AUTO_ADVANCE_DELAY);
  }

  function handleAnswer(slideId, choiceIndex) {
    const slide = session.slides.find((s) => s.slideId === slideId);
    if (!slide || slide.answered !== null) return;
    const q = qById[slide.qId];
    const correct = choiceIndex === q.correct;
    slide.answered = choiceIndex;
    if (correct) session.correctCount += 1;
    store.recordAnswer(q.id, correct, choiceIndex);
    bumpStreak();

    const slideEl = root.querySelector(`.reel-slide[data-slide-id="${slideId}"]`);
    if (slideEl) fillAnsweredSlideDom(slideEl, slide);

    if (!correct) {
      // Ans Ende des Feeds zurückstellen statt zu verschwinden.
      const newSlide = makeSlide(q.id);
      session.slides.push(newSlide);
      const summaryEl = root.querySelector(".reel-slide.reel-summary");
      if (summaryEl) summaryEl.insertAdjacentHTML("beforebegin", slideOuterHtml(newSlide));
    }

    if (slideEl) scheduleAutoAdvance(slideEl);

    updateReelProgress();
    updateReelSummary();
    renderTopProgress();
    if (correct) {
      checkMilestones();
      checkPackageCompletion(session.pkgId);
    }
  }

  const MODE_LABELS = {
    wrong: "Falsch beantwortete",
    wiederholung: "Wiederholungsstapel",
    neu: "Neue Fragen",
    review: "Ansicht (Wiederholungsstapel)",
    bookmarks: "Lesezeichen",
  };

  function renderTrainer() {
    const modeLabel = MODE_LABELS[session.mode] || "Fragen";
    const pkgTitle = session.pkgId ? PACKAGES.find((p) => p.id === session.pkgId).title : `${modeLabel} – alle Pakete`;
    topbarTitle.textContent = pkgTitle;
    backBtn.style.visibility = "visible";
    homeBtn.style.visibility = "visible";

    root.classList.add("reel-screen");
    document.body.classList.add("reel-mode");

    const slidesHtml = session.slides.map(slideOuterHtml).join("");

    root.innerHTML = `
      <div class="reel-progress-strip" id="reel-progress-strip"></div>
      <div class="reel-container" id="reel-container">
        ${slidesHtml}
        <section class="reel-slide reel-summary" data-slide-id="summary">
          <div class="empty-state">
            <span class="big-emoji" id="summary-emoji">🧭</span>
            <h2 id="summary-heading">Weiter geht's</h2>
            <p id="summary-text">Antworten oben auswählen – das Ergebnis erscheint hier, sobald alles beantwortet ist.</p>
          </div>
          <div class="quick-actions">
            <button class="btn btn-secondary" id="btn-done">Fertig</button>
          </div>
        </section>
        <div class="swipe-hint" id="swipe-hint">↑ Nach oben wischen für die nächste Frage</div>
      </div>
    `;

    updateReelProgress();

    const container = document.getElementById("reel-container");

    // Nur-Ansehen-Karten (z. B. Lesezeichen aus dem Wiederholungsstapel)
    // sind schon beim Einblenden ausgewertet, ohne dass geklickt wurde.
    session.slides.forEach((s) => {
      if (s.answered === null) return;
      const slideEl = container.querySelector(`.reel-slide[data-slide-id="${s.slideId}"]`);
      if (slideEl) fillAnsweredSlideDom(slideEl, s);
    });
    updateReelSummary();

    // Ein einziger delegierter Klick-Handler für alle (auch später
    // angehängte) Antwort-, Lesezeichen- und "Nächste Frage"-Buttons.
    container.addEventListener("click", (e) => {
      const bookmarkBtn = e.target.closest(".bookmark-btn");
      if (bookmarkBtn) {
        const qId = bookmarkBtn.dataset.bookmarkQ;
        const active = store.toggleBookmark(qId);
        bookmarkBtn.classList.toggle("active", active);
        return;
      }
      const optBtn = e.target.closest(".option");
      if (optBtn && !optBtn.disabled) {
        const slideEl = optBtn.closest(".reel-slide");
        const slide = session.slides.find((s) => s.slideId === slideEl.dataset.slideId);
        if (slide && slide.reviewOnly) return;
        handleAnswer(slideEl.dataset.slideId, parseInt(optBtn.dataset.i, 10));
        return;
      }
      const nextBtn = e.target.closest(".btn-scroll-next");
      if (nextBtn) {
        const slideEl = nextBtn.closest(".reel-slide");
        if (slideEl && slideEl.nextElementSibling) {
          slideEl.nextElementSibling.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }
      if (e.target.closest("#btn-done")) {
        stack.pop(); // Trainer verlassen
        render();
      }
    });

    let hintDismissed = false;
    container.addEventListener("scroll", () => {
      if (hintDismissed) return;
      hintDismissed = true;
      const hint = document.getElementById("swipe-hint");
      if (hint) hint.classList.add("hint-hide");
    }, { passive: true });
  }

  // ---------------------------------------------------------------
  // Eröffnungsbildschirm: ein Boot segelt in den Hafen ein, "Start"
  // führt zum Dashboard.
  // ---------------------------------------------------------------
  function renderSplash() {
    root.innerHTML = `
      <div class="splash">
        <div class="splash-scene">
          <svg viewBox="0 0 320 200" class="splash-svg" aria-hidden="true">
            <path d="M0 152 Q20 146 40 152 T80 152 T120 152 T160 152 T200 152 T240 152 T280 152 T320 152"
                  stroke="var(--accent)" stroke-width="2" fill="none" opacity="0.35"/>
            <rect x="0" y="158" width="320" height="42" fill="var(--accent)" opacity="0.1"/>
            <!-- Kleiner Leuchtturm markiert den Zielhafen -->
            <g class="splash-harbor">
              <line x1="252" y1="152" x2="252" y2="140" stroke="var(--ink-muted)" stroke-width="3" stroke-linecap="round"/>
              <line x1="266" y1="152" x2="266" y2="140" stroke="var(--ink-muted)" stroke-width="3" stroke-linecap="round"/>
              <rect x="248" y="136" width="22" height="6" rx="1" fill="var(--ink-muted)"/>
              <rect x="291" y="106" width="14" height="34" rx="1.5" fill="var(--ink-muted)"/>
              <rect x="291" y="118" width="14" height="7" fill="var(--red)"/>
              <path d="M289 106 L307 106 L298 94 Z" fill="var(--red)"/>
              <circle cx="298" cy="100" r="2.6" fill="var(--amber)"/>
            </g>
            <g class="splash-boat">
              <path d="M244 150 Q260 160 276 150 L272 158 Q260 166 248 158 Z" fill="var(--accent)"/>
              <path d="M262 148 L262 100 L288 146 Z" fill="var(--ink)"/>
              <path d="M258 148 L258 112 L244 146 Z" fill="var(--ink)" opacity="0.75"/>
              <line x1="262" y1="100" x2="262" y2="150" stroke="var(--ink)" stroke-width="2"/>
            </g>
          </svg>
        </div>
        <h1>SBF-Trainer</h1>
        <p>Theorie-Prüfungsvorbereitung für SBF See &amp; SBF Binnen – lerne in kleinen Etappen bis zum Ziel.</p>
        <button class="btn btn-primary" id="btn-splash-start">Start</button>
      </div>
    `;
    const btn = document.getElementById("btn-splash-start");
    if (btn) btn.addEventListener("click", goHome);
  }

  function triggerScreenAnim() {
    root.classList.remove("screen-anim");
    void root.offsetWidth;
    root.classList.add("screen-anim");
  }

  function render() {
    const view = current();
    document.body.classList.toggle("reel-mode", view.screen === "trainer");
    if (view.screen !== "trainer") root.classList.remove("reel-screen");
    topbar.style.display = view.screen === "splash" ? "none" : "";
    if (view.screen === "splash") renderSplash();
    else if (view.screen === "dashboard") renderDashboard();
    else if (view.screen === "package") renderPackage(view.pkgId);
    else if (view.screen === "bookmarks") renderBookmarksOverview();
    else if (view.screen === "trainer") renderTrainer();
    if (view.screen !== "splash") renderTopProgress();
    if (view.screen !== "trainer") window.scrollTo(0, 0);
    triggerScreenAnim();
  }

  render();
})();
