/*
 * Fortschritts- und Wiederholungslogik.
 *
 * Jede Frage befindet sich pro Fragenpaket jederzeit in genau einem von
 * drei nachverfolgbaren Stapeln:
 *
 * - "Neu"               – noch nie beantwortet (timesSeen === 0).
 * - "Falsch beantwortet" – die letzte Antwort war falsch. Diese Fragen
 *                          bilden eine Warteschlange: Beim Üben wird eine
 *                          erneut falsch beantwortete Frage ans Ende der
 *                          aktuellen Übungsrunde zurückgestellt statt zu
 *                          verschwinden.
 * - "Wiederholungsstapel" – die letzte Antwort war richtig. Fragen
 *                          bleiben hier auch nach dem Verlassen des
 *                          Falsch-Stapels sichtbar und werden nicht
 *                          automatisch entfernt, sondern stehen für
 *                          gelegentliche Wiederholung bereit.
 *
 * Eine Frage gilt zusätzlich als "sicher gelernt" (Badge innerhalb des
 * Wiederholungsstapels), sobald sie zweimal in Folge richtig beantwortet
 * wurde (consecutiveCorrect >= 2). Eine falsch beantwortete Frage aus dem
 * Wiederholungsstapel fällt sofort zurück in den Falsch-Stapel und muss
 * dort erneut zweimal hintereinander richtig beantwortet werden, bevor sie
 * wieder in den Wiederholungsstapel wechselt.
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
    let neu = 0;
    let falsch = 0;
    let wiederholung = 0;
    let learned = 0;
    questionIds.forEach((id) => {
      const s = this.progress[id];
      if (!s || s.timesSeen === 0) {
        neu += 1;
        return;
      }
      processed += 1;
      if (s.lastResult === "wrong") falsch += 1;
      else wiederholung += 1;
      if (s.learned) learned += 1;
    });
    return {
      total,
      processed,
      neu,
      wrong: falsch,
      falsch,
      wiederholung,
      learned,
      percentProcessed: total ? Math.round((processed / total) * 100) : 0,
      percentWrongOfProcessed: processed ? Math.round((falsch / processed) * 100) : 0,
      percentLearned: total ? Math.round((learned / total) * 100) : 0,
    };
  }

  /** Fragen, die noch nie beantwortet wurden. */
  neuIds(questionIds) {
    return questionIds.filter((id) => {
      const s = this.progress[id];
      return !s || s.timesSeen === 0;
    });
  }

  /** Fragen, deren letzte Antwort falsch war (Falsch-Stapel). */
  wrongIds(questionIds) {
    return questionIds.filter((id) => {
      const s = this.progress[id];
      return s && s.lastResult === "wrong";
    });
  }

  /** Fragen, deren letzte Antwort richtig war (Wiederholungsstapel). */
  wiederholungIds(questionIds) {
    return questionIds.filter((id) => {
      const s = this.progress[id];
      return s && s.timesSeen > 0 && s.lastResult === "correct";
    });
  }

  /** Noch nicht "sicher gelernt" (für den klassischen Weiterlernen-Modus: Neu + Falsch + einmal-richtig-aber-nicht-gefestigt). */
  unlearnedIds(questionIds) {
    return questionIds.filter((id) => {
      const s = this.progress[id];
      return !s || !s.learned;
    });
  }
}

if (typeof module !== "undefined") module.exports = { ProgressStore, STORAGE_KEY };
