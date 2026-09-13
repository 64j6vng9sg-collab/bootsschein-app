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
  let session = null; // { ids, index, mode, pkgId, correctCount }

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

  function startSession(ids, mode, pkgId) {
    if (!ids || ids.length === 0) return;
    session = { ids: shuffle(ids), index: 0, mode, pkgId, correctCount: 0, answered: null };
    push({ screen: "trainer" });
  }

  function letterFor(i) { return ["A", "B", "C", "D"][i]; }

  function renderTrainer() {
    const modeLabel = session.mode === "wrong" ? "Falsch beantwortete" : session.mode === "wiederholung" ? "Wiederholungsstapel" : "Neue Fragen";
    const pkgTitle = session.pkgId ? PACKAGES.find((p) => p.id === session.pkgId).title : `${modeLabel} – alle Pakete`;
    topbarTitle.textContent = pkgTitle;
    backBtn.style.visibility = "visible";
    homeBtn.style.visibility = "visible";

    if (session.index >= session.ids.length) {
      return renderSummary();
    }

    const q = qById[session.ids[session.index]];
    const answered = session.answered;

    let strip = "";
    for (let i = 0; i < session.ids.length; i++) {
      strip += `<div class="seg ${i < session.index ? "done" : ""}"></div>`;
    }

    let diagramHtml = "";
    if (q.diagram && DIAGRAMS[q.diagram]) {
      diagramHtml = `<div class="diagram-wrap">${DIAGRAMS[q.diagram]}</div>`;
    }

    let imageNoteHtml = "";
    if (q.note) {
      imageNoteHtml = `<div class="image-note">⚠️ ${q.note}</div>`;
    }

    let optionsHtml = "";
    q.options.forEach((opt, i) => {
      let cls = "option";
      if (answered !== null) {
        if (i === q.correct) cls += " correct";
        else if (i === answered) cls += " wrong";
      }
      optionsHtml += `
        <button class="${cls}" data-i="${i}" ${answered !== null ? "disabled" : ""}>
          <span class="letter">${letterFor(i)}</span>
          <span>${opt}</span>
        </button>
      `;
    });

    let sourceHtml = "";
    if (answered !== null) {
      sourceHtml = `<div class="source-note"><b>Quelle:</b> ${q.source}</div>`;
    }

    let footerHtml = "";
    if (answered !== null) {
      const isLast = session.index === session.ids.length - 1;
      footerHtml = `<div class="trainer-footer"><button class="btn btn-primary" id="btn-next">${isLast ? "Ergebnis anzeigen" : "Weiter"}</button></div>`;
    }

    root.innerHTML = `
      <div class="progress-strip">${strip}</div>
      <div class="question-card">
        <span class="category-pill">${CATEGORIES[q.category] || q.category}</span>
        <p class="question-text">${q.q}</p>
        ${imageNoteHtml}
        ${diagramHtml}
        <div class="options">${optionsHtml}</div>
        ${sourceHtml}
      </div>
      ${footerHtml}
    `;

    root.querySelectorAll(".option").forEach((el) => {
      el.addEventListener("click", () => {
        const i = parseInt(el.dataset.i, 10);
        answerQuestion(q, i);
      });
    });
    const nextBtn = document.getElementById("btn-next");
    if (nextBtn) nextBtn.addEventListener("click", nextQuestion);
  }

  function answerQuestion(q, choiceIndex) {
    if (session.answered !== null) return;
    const correct = choiceIndex === q.correct;
    session.answered = choiceIndex;
    if (correct) {
      session.correctCount += 1;
    } else {
      // Falsch beantwortete Fragen werden ans Ende der aktuellen Übungsrunde
      // zurückgestellt, statt zu verschwinden – sie bleiben so lange im
      // Falsch-Stapel, bis sie zweimal in Folge richtig beantwortet wurden.
      session.ids.push(q.id);
    }
    store.recordAnswer(q.id, correct);
    render();
  }

  function nextQuestion() {
    session.index += 1;
    session.answered = null;
    render();
  }

  function renderSummary() {
    topbarTitle.textContent = "Ergebnis";
    const total = session.ids.length;
    const correct = session.correctCount;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const stillWrong = [...new Set(session.ids)].filter((id) => store.stateFor(id).lastResult === "wrong").length;

    root.innerHTML = `
      <div class="empty-state">
        <span class="big-emoji">${pct >= 90 ? "⚓️" : pct >= 60 ? "🧭" : "🌊"}</span>
        <h2>${correct} von ${total} richtig</h2>
        <p>${pct}% dieser Runde korrekt beantwortet.${stillWrong ? ` ${stillWrong} Frage(n) bleiben im Falsch-Stapel.` : " Alle Fragen dieser Runde liegen jetzt im Wiederholungsstapel!"}</p>
      </div>
      <div class="quick-actions">
        <button class="btn btn-primary" id="btn-again">Nochmal üben</button>
        <button class="btn btn-secondary" id="btn-done">Fertig</button>
      </div>
    `;

    document.getElementById("btn-again").addEventListener("click", () => {
      const pool = session.pkgId ? byPkg[session.pkgId] : allIds;
      const bucketFn = session.mode === "wrong" ? store.wrongIds : session.mode === "wiederholung" ? store.wiederholungIds : store.neuIds;
      const ids = bucketFn.call(store, pool);
      if (ids.length === 0) { back(); return; }
      startSession(ids, session.mode, session.pkgId);
    });
    document.getElementById("btn-done").addEventListener("click", () => {
      stack.pop(); // remove trainer
      if (stack.length === 0 || current().screen === "dashboard") { render(); }
      else render();
    });
  }

  function render() {
    const view = current();
    if (view.screen === "dashboard") renderDashboard();
    else if (view.screen === "package") renderPackage(view.pkgId);
    else if (view.screen === "trainer") renderTrainer();
    window.scrollTo(0, 0);
  }

  render();
})();
