const { chromium } = require("playwright");

const BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:8766/index.html";

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(BASE_URL);
  await page.waitForSelector("#btn-splash-start");
  await page.screenshot({ path: "/tmp/shot-splash.png" });
  await page.locator("#btn-splash-start").click();

  await page.waitForSelector(".pkg-card");
  await page.screenshot({ path: "/tmp/shot-dashboard.png" });

  const pkgCount = await page.locator(".pkg-card[data-pkg]").count();
  console.log("Pakete auf Dashboard:", pkgCount);

  await page.locator(".pkg-card").first().click();
  await page.waitForSelector("#btn-neu");
  await page.screenshot({ path: "/tmp/shot-package.png" });

  await page.locator("#btn-neu").click();
  await page.waitForSelector(".reel-slide .option");
  await page.screenshot({ path: "/tmp/shot-trainer.png" });

  // Regression check: die Position der richtigen Antwort muss variieren,
  // darf also nicht immer auf Buchstabe A liegen.
  const correctPositions = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll(".reel-slide:not(.reel-summary)")).slice(0, 15);
    return slides.map((s) => {
      const opts = Array.from(s.querySelectorAll(".option"));
      return opts.findIndex((o) => o.dataset.i === "0");
    });
  });
  const distinctPositions = new Set(correctPositions).size;
  console.log("Positionen der jeweils korrekten Antwort (erste 15 Karten):", correctPositions, "- unterschiedliche Positionen:", distinctPositions);

  // Lesezeichen umschalten und Persistenz prüfen
  const bookmarkBtn = page.locator(".reel-slide .bookmark-btn").first();
  await bookmarkBtn.click();
  const bookmarkActive = await bookmarkBtn.evaluate((el) => el.classList.contains("active"));
  console.log("Lesezeichen aktiv nach Klick:", bookmarkActive);

  const slideCountBefore = await page.locator(".reel-slide").count();

  // richtige Antwort auf der ersten Karte anklicken
  const firstSlide = page.locator(".reel-slide").first();
  const correctIdx = await page.evaluate(() => {
    const text = document.querySelector(".reel-slide .question-text").textContent.trim();
    const q = QUESTIONS.find((x) => x.q.trim() === text);
    return q.correct;
  });
  await firstSlide.locator(`.option[data-i="${correctIdx}"]`).click();
  await page.waitForSelector(".reel-slide .source-note");
  await page.screenshot({ path: "/tmp/shot-answered.png" });

  const slideCountAfterCorrect = await page.locator(".reel-slide").count();
  console.log("Karten vor/nach richtiger Antwort (sollte gleich bleiben):", slideCountBefore, slideCountAfterCorrect);

  // zweite Karte bewusst falsch beantworten -> muss eine neue Karte anhängen
  const secondSlide = page.locator(".reel-slide").nth(1);
  const correctIdx2 = await page.evaluate(() => {
    const slides = document.querySelectorAll(".reel-slide:not(.reel-summary)");
    const text = slides[1].querySelector(".question-text").textContent.trim();
    const q = QUESTIONS.find((x) => x.q.trim() === text);
    return q.correct;
  });
  await secondSlide.locator(`.option[data-i="${(correctIdx2 + 1) % 4}"]`).click();
  await page.waitForTimeout(150);
  const slideCountAfterWrong = await page.locator(".reel-slide").count();
  console.log("Karten nach falscher Antwort (sollte +1 sein):", slideCountAfterWrong, "erwartet:", slideCountAfterCorrect + 1);

  // zurück nach Hause testen
  await page.locator("#btn-home").click();
  await page.waitForSelector(".pkg-card");
  await page.screenshot({ path: "/tmp/shot-home-again.png" });
  console.log("reel-mode nach Home verlassen:", await page.evaluate(() => document.body.classList.contains("reel-mode")));

  // Fortschritt persistiert?
  const stored = await page.evaluate(() => localStorage.getItem("sbf-trainer-progress-v1"));
  console.log("LocalStorage gesetzt:", !!stored && stored.length > 5);

  console.log("Konsolen-/Seitenfehler:", errors);

  await browser.close();
})();
