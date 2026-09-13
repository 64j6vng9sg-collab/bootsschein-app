/*
 * Fortschritts- und Wiederholungslogik.
 *
 * Regeln:
 * - Eine Frage gilt als "gelernt", sobald sie zweimal in Folge richtig
 *   beantwortet wurde (consecutiveCorrect >= 2).
 * - Wird eine Frage falsch beantwortet, wird consecutiveCorrect auf 0
 *   zurückgesetzt und die Frage landet (erneut) im Wiederholungspaket
 *   des jeweiligen Fragenpakets (lastResult === "wrong").
 * - Sobald die Frage danach wieder richtig beantwortet wird, verlässt sie
 *   das Wiederholungspaket, gilt aber erst nach der zweiten
 *   Folge-richtig-Antwort als sicher gelernt.
 */

const STORAGE_KEY = "sbf-trainer-progress-v1";

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    /* Speicher voll oder gesperrt (privater Modus) – Fortschritt bleibt nur für diese Sitzung erhalten */
  }
}

function emptyState() {
  return { timesSeen: 0, consecutiveCorrect: 0, lastResult: null, learned: false, lastSeenAt: null };
}

class ProgressStore {
  constructor() {
    this.progress = loadProgress();
  }

  stateFor(questionId) {
    return this.progress[questionId] || emptyState();
  }

  recordAnswer(questionId, wasCorrect) {
    const state = this.stateFor(questionId);
    state.timesSeen += 1;
    state.lastSeenAt = Date.now();
    if (wasCorrect) {
      state.consecutiveCorrect += 1;
      state.lastResult = "correct";
      if (state.consecutiveCorrect >= 2) state.learned = true;
    } else {
      state.consecutiveCorrect = 0;
      state.lastResult = "wrong";
      state.learned = false;
    }
    this.progress[questionId] = state;
    saveProgress(this.progress);
    return state;
  }

  reset() {
    this.progress = {};
    saveProgress(this.progress);
  }

  resetPackage(questionIds) {
    questionIds.forEach((id) => delete this.progress[id]);
    saveProgress(this.progress);
  }

  packageStats(questionIds) {
    const total = questionIds.length;
    let processed = 0;
    let wrong = 0;
    let learned = 0;
    questionIds.forEach((id) => {
      const s = this.progress[id];
      if (!s || s.timesSeen === 0) return;
      processed += 1;
      if (s.lastResult === "wrong") wrong += 1;
      if (s.learned) learned += 1;
    });
    return {
      total,
      processed,
      wrong,
      learned,
      percentProcessed: total ? Math.round((processed / total) * 100) : 0,
      percentWrongOfProcessed: processed ? Math.round((wrong / processed) * 100) : 0,
      percentLearned: total ? Math.round((learned / total) * 100) : 0,
    };
  }

  wrongIds(questionIds) {
    return questionIds.filter((id) => {
      const s = this.progress[id];
      return s && s.lastResult === "wrong";
    });
  }

  unlearnedIds(questionIds) {
    return questionIds.filter((id) => {
      const s = this.progress[id];
      return !s || !s.learned;
    });
  }
}

if (typeof module !== "undefined") module.exports = { ProgressStore, STORAGE_KEY };
