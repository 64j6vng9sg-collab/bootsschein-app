const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto("http://127.0.0.1:8765/index.html");
  await page.waitForSelector(".pkg-card");
  await page.screenshot({ path: "/tmp/shot-dashboard.png" });

  const pkgCount = await page.locator(".pkg-card").count();
  console.log("Pakete auf Dashboard:", pkgCount);

  await page.locator(".pkg-card").first().click();
  await page.waitForSelector("#btn-learn");
  await page.screenshot({ path: "/tmp/shot-package.png" });

  await page.locator("#btn-learn").click();
  await page.waitForSelector(".option");
  await page.screenshot({ path: "/tmp/shot-trainer.png" });

  // richtige Antwort anklicken (Frage per Text aus globaler QUESTIONS-Liste finden)
  const correctIdx = await page.evaluate(() => {
    const text = document.querySelector(".question-text").textContent.trim();
    const q = QUESTIONS.find((x) => x.q.trim() === text);
    return q.correct;
  });
  await page.locator(".option").nth(correctIdx).click();
  await page.waitForSelector(".source-note");
  await page.screenshot({ path: "/tmp/shot-answered.png" });

  await page.locator("#btn-next").click();
  await page.waitForTimeout(200);

  // zurück nach Hause testen
  await page.locator("#btn-home").click();
  await page.waitForSelector(".pkg-card");
  await page.screenshot({ path: "/tmp/shot-home-again.png" });

  // Fortschritt persistiert?
  const stored = await page.evaluate(() => localStorage.getItem("sbf-trainer-progress-v1"));
  console.log("LocalStorage gesetzt:", !!stored && stored.length > 5);

  console.log("Konsolen-/Seitenfehler:", errors);

  await browser.close();
})();
