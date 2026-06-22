import { chromium } from "playwright";

const url = process.env.GAME_URL ?? "http://127.0.0.1:5173/";
const answers = ["0100", "1", "URDL", "STAR", "0300", "LURD", "2", "MOON", "0400", "YES"];

async function gameState(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()));
}

async function waitForPhase(page, phase) {
  await page.waitForFunction(
    (target) => window.render_game_to_text && JSON.parse(window.render_game_to_text()).phase === target,
    phase,
  );
}

async function canvasStats(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return { found: false, visible: 0, varied: 0 };
    const probe = document.createElement("canvas");
    probe.width = 64;
    probe.height = 64;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    let visible = 0;
    let varied = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 0) visible += 1;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 8 || (r + g + b > 40 && r + g + b < 730)) varied += 1;
    }
    return { found: true, width: canvas.width, height: canvas.height, visible, varied };
  });
}

async function enterGame(page, isMobile = false) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".runaway-button");
  const introText = await page.locator(".intro-copy h1").innerText();
  if (!introText.includes("400일")) throw new Error(`Unexpected intro: ${introText}`);

  if (!isMobile) {
    const button = page.locator(".runaway-button");
    const before = await button.boundingBox();
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.waitForTimeout(250);
    const after = await button.boundingBox();
    const moved = Math.hypot(after.x - before.x, after.y - before.y);
    if (moved < 35) throw new Error(`Runaway button did not move enough: ${moved}`);
  }

  await page.waitForTimeout(6500);
  if (isMobile) await page.locator(".runaway-button").tap({ force: true });
  else await page.locator(".runaway-button").click({ force: true });
  await page.waitForSelector("canvas");
  await waitForPhase(page, "game");
  await page.waitForTimeout(900);
}

async function solveAll(page) {
  for (const answer of answers) {
    let opened = false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await page.locator(".interact-button").click({ force: true });
      await page.waitForTimeout(260);
      if (await page.locator(".puzzle-modal").count()) {
        opened = true;
        break;
      }
    }
    if (!opened) throw new Error(`Puzzle did not open for answer ${answer}`);
    await page.locator(".answer-row input").fill(answer);
    await page.locator(".answer-row button").click();
    await page.waitForFunction(() => !document.querySelector(".puzzle-modal"));
    await page.waitForTimeout(160);
  }
  await waitForPhase(page, "ending");
  return gameState(page);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  await enterGame(desktop);
  const desktopState = await gameState(desktop);
  const desktopCanvas = await canvasStats(desktop);
  if (desktopState.cameraMode !== "first-person") throw new Error("Camera mode is not first-person.");
  if (!desktopCanvas.found || desktopCanvas.varied < 2000) throw new Error(`Desktop canvas looks blank: ${JSON.stringify(desktopCanvas)}`);
  const ending = await solveAll(desktop);
  if (ending.phase !== "ending" || ending.solvedPuzzles !== 10) throw new Error(`Ending failed: ${JSON.stringify(ending)}`);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await enterGame(mobile, true);
  const mobileState = await gameState(mobile);
  const mobileCanvas = await canvasStats(mobile);
  if (!mobileCanvas.found || mobileCanvas.varied < 2000) throw new Error(`Mobile canvas looks blank: ${JSON.stringify(mobileCanvas)}`);

  console.log(
    JSON.stringify(
      {
        url,
        desktopState,
        desktopCanvas,
        ending,
        mobileState,
        mobileCanvas,
      },
      null,
      2,
    ),
  );
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
