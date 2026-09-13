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

  let stack = [{ screen: "dashboard" }];
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

  function fmtPct(n) { return `${n}%`; }

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

    let html = `
      <div class="hero">
        <h1>Theorie-Trainer</h1>
        <p>SBF See &amp; SBF Binnen – kombinierte Prüfungsvorbereitung</p>
      </div>

      <div class="overview-grid">
        <div class="overview-tile">
          <div class="num">${overall.percentLearned}%</div>
          <div class="lbl">sicher gelernt</div>
        </div>
        <div class="overview-tile">
          <div class="num">${overall.learned}/${overall.total}</div>
          <div class="lbl">Fragen gelernt</div>
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

      <div class="section-label">Fragenpakete</div>
    `;

    PACKAGES.forEach((p) => {
      const ids = byPkg[p.id];
      const s = store.packageStats(ids);
      html += `
        <button class="card pkg-card card-tap" data-pkg="${p.id}">
          <div class="pkg-head">
            <div>
              <div class="pkg-title">${p.title}</div>
              <div class="pkg-subtitle">${p.subtitle}</div>
            </div>
            <div class="pkg-count">${s.processed}/${s.total}</div>
          </div>
          <div class="bar" style="margin-bottom:6px;"><div class="bar-fill" style="width:${s.percentProcessed}%"></div></div>
          <div class="bar" style="height:5px;"><div class="bar-fill wrong" style="width:${s.percentWrongOfProcessed}%"></div></div>
          <div class="stat-row">
            <span><span class="dot" style="background:var(--accent)"></span>${fmtPct(s.percentProcessed)} bearbeitet</span>
            <span><span class="dot" style="background:var(--red)"></span>${fmtPct(s.percentWrongOfProcessed)} akt. falsch</span>
            <span><span class="dot" style="background:var(--green)"></span>${fmtPct(s.percentLearned)} gelernt</span>
          </div>
        </button>
      `;
    });

    html += `
      <div class="disclaimer">
        Hinweis zur Fragenquelle: Alle Fragen sind wortlaut- und nummerngetreu aus den amtlichen Fragenkatalogen
        SBF See und SBF Binnen (ELWIS, Stand 01.08.2023) übernommen. Fragen mit ⚠️-Hinweis beziehen sich im
        Original zusätzlich auf eine Abbildung (Licht, Tafelzeichen, Skizze o. Ä.), die hier nicht dargestellt
        werden kann. Details siehe README.
      </div>
    `;

    root.innerHTML = html;

    root.querySelectorAll(".pkg-card").forEach((el) => {
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
  }

  function renderPackage(pkgId) {
    const p = PACKAGES.find((x) => x.id === pkgId);
    const ids = byPkg[pkgId];
    const s = store.packageStats(ids);
    const neuIds = store.neuIds(ids);
    const wrongIds = store.wrongIds(ids);
    const wdhIds = store.wiederholungIds(ids);

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
      </div>
    `;

    root.innerHTML = html;
    const neuBtn = document.getElementById("btn-neu");
    const wrongBtn = document.getElementById("btn-wrong");
    const wdhBtn = document.getElementById("btn-wdh");
    if (neuBtn) neuBtn.addEventListener("click", () => startSession(neuIds, "neu", pkgId));
    if (wrongBtn) wrongBtn.addEventListener("click", () => startSession(wrongIds, "wrong", pkgId));
    if (wdhBtn) wdhBtn.addEventListener("click", () => startSession(wdhIds, "wiederholung", pkgId));
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
  function makeSlide(qId) {
    slideUid += 1;
    return { slideId: `s${slideUid}`, qId, answered: null };
  }

  function startSession(ids, mode, pkgId) {
    if (!ids || ids.length === 0) return;
    session = { mode, pkgId, slides: shuffle(ids).map(makeSlide), correctCount: 0 };
    push({ screen: "trainer" });
  }

  function slideInnerHtml(slide) {
    const q = qById[slide.qId];
    const diagramHtml = q.diagram && DIAGRAMS[q.diagram] ? `<div class="diagram-wrap">${DIAGRAMS[q.diagram]}</div>` : "";
    const imageNoteHtml = q.note ? `
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
    const optionsHtml = q.options.map((opt, i) => `
      <button class="option" data-i="${i}">
        <span class="letter">${letterFor(i)}</span>
        <span>${opt}</span>
      </button>
    `).join("");
    return `
      <div class="question-card">
        <span class="category-pill">${CATEGORIES[q.category] || q.category}</span>
        <p class="question-text">${q.q}</p>
        ${imageNoteHtml}
        ${diagramHtml}
        <div class="options">${optionsHtml}</div>
        <div class="answer-extra"></div>
      </div>
    `;
  }

  function slideOuterHtml(slide) {
    return `<section class="reel-slide" data-slide-id="${slide.slideId}">${slideInnerHtml(slide)}</section>`;
  }

  function fillAnsweredSlideDom(slideEl, slide) {
    const q = qById[slide.qId];
    slideEl.querySelectorAll(".option").forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.correct) btn.classList.add("correct");
      else if (i === slide.answered) btn.classList.add("wrong");
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
    const correct = session.correctCount;
    const pct = Math.round((correct / answered.length) * 100);
    const uniqueQIds = [...new Set(session.slides.map((s) => s.qId))];
    const stillWrong = uniqueQIds.filter((id) => store.stateFor(id).lastResult === "wrong").length;
    emoji.textContent = pct >= 90 ? "⚓️" : pct >= 60 ? "🧭" : "🌊";
    heading.textContent = `${correct} von ${answered.length} richtig`;
    text.textContent = stillWrong
      ? `${pct}% richtig. ${stillWrong} Frage(n) bleiben im Falsch-Stapel.`
      : `${pct}% richtig. Alle Fragen liegen jetzt im Wiederholungsstapel!`;
  }

  function handleAnswer(slideId, choiceIndex) {
    const slide = session.slides.find((s) => s.slideId === slideId);
    if (!slide || slide.answered !== null) return;
    const q = qById[slide.qId];
    const correct = choiceIndex === q.correct;
    slide.answered = choiceIndex;
    if (correct) session.correctCount += 1;
    store.recordAnswer(q.id, correct);

    const slideEl = root.querySelector(`.reel-slide[data-slide-id="${slideId}"]`);
    if (slideEl) fillAnsweredSlideDom(slideEl, slide);

    if (!correct) {
      // Ans Ende des Feeds zurückstellen statt zu verschwinden.
      const newSlide = makeSlide(q.id);
      session.slides.push(newSlide);
      const summaryEl = root.querySelector(".reel-slide.reel-summary");
      if (summaryEl) summaryEl.insertAdjacentHTML("beforebegin", slideOuterHtml(newSlide));
    }

    updateReelProgress();
    updateReelSummary();
  }

  function renderTrainer() {
    const modeLabel = session.mode === "wrong" ? "Falsch beantwortete" : session.mode === "wiederholung" ? "Wiederholungsstapel" : "Neue Fragen";
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

    // Ein einziger delegierter Klick-Handler für alle (auch später
    // angehängte) Antwort- und "Nächste Frage"-Buttons.
    container.addEventListener("click", (e) => {
      const optBtn = e.target.closest(".option");
      if (optBtn && !optBtn.disabled) {
        const slideEl = optBtn.closest(".reel-slide");
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

  function render() {
    const view = current();
    document.body.classList.toggle("reel-mode", view.screen === "trainer");
    if (view.screen !== "trainer") root.classList.remove("reel-screen");
    if (view.screen === "dashboard") renderDashboard();
    else if (view.screen === "package") renderPackage(view.pkgId);
    else if (view.screen === "trainer") renderTrainer();
    if (view.screen !== "trainer") window.scrollTo(0, 0);
  }

  render();
})();
