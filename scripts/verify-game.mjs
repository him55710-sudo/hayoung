import { chromium } from "playwright";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const url = process.env.GAME_URL ?? "http://127.0.0.1:5173/";
const answers = ["0100", "1", "URDL", "STAR", "0300", "LURD", "2", "MOON", "0400", "YES"];
const debug = process.env.DEBUG_GAME_VERIFY === "1";
const debugLogPath = "output/playwright/verify-debug.log";

if (debug) {
  mkdirSync(dirname(debugLogPath), { recursive: true });
  writeFileSync(debugLogPath, "");
}

function log(...args) {
  if (debug) appendFileSync(debugLogPath, `[verify] ${args.join(" ")}\n`);
}

async function gameState(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text()));
}

async function waitForPhase(page, phase) {
  await page.waitForFunction(
    (target) => window.render_game_to_text && JSON.parse(window.render_game_to_text()).phase === target,
    phase,
    { timeout: 15000 },
  );
}

async function settleClose(label, promise) {
  await Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => {
        log(`${label} close timed out; continuing cleanup`);
        resolve(undefined);
      }, 10000);
    }),
  ]);
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

async function clickSelector(page, selector) {
  await page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);
    if (!(element instanceof HTMLElement)) {
      throw new Error(`Missing clickable selector: ${targetSelector}`);
    }
    element.click();
  }, selector);
}

async function enterGame(page, isMobile = false) {
  log(`enter ${isMobile ? "mobile" : "desktop"}`);
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
  log(`entered ${isMobile ? "mobile" : "desktop"}`);
}

async function solveAll(page) {
  for (const answer of answers) {
    log(`solve ${answer}`);
    let opened = false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      log(`attempt ${answer} ${attempt}`);
      await clickSelector(page, ".interact-button");
      await page.waitForTimeout(260);
      const modalCount = await page.locator(".puzzle-modal").count();
      log(`attempt ${answer} ${attempt} modal ${modalCount}`);
      if (modalCount) {
        opened = true;
        break;
      }
    }
    if (!opened) throw new Error(`Puzzle did not open for answer ${answer}`);
    await page.locator(".answer-row input").fill(answer);
    await page.waitForTimeout(80);
    log(`submit ${answer}`);
    await clickSelector(page, ".answer-row button");
    await page.waitForFunction(() => !document.querySelector(".puzzle-modal"), null, { timeout: 15000 });
    await page.waitForTimeout(160);
    log(`solved ${answer}`);
  }
  await waitForPhase(page, "ending");
  return gameState(page);
}

async function main() {
  log("launch browser");
  const browser = await chromium.launch({ headless: true });
  log("browser launched");
  let desktop;
  let mobile;
  try {
    log("new desktop page");
    desktop = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
    await enterGame(desktop);
    const desktopState = await gameState(desktop);
    const desktopCanvas = await canvasStats(desktop);
    if (desktopState.cameraMode !== "first-person") throw new Error("Camera mode is not first-person.");
    if (!desktopCanvas.found || desktopCanvas.varied < 2000) throw new Error(`Desktop canvas looks blank: ${JSON.stringify(desktopCanvas)}`);
    const ending = await solveAll(desktop);
    if (ending.phase !== "ending" || ending.solvedPuzzles !== 10) throw new Error(`Ending failed: ${JSON.stringify(ending)}`);

    mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
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
  } finally {
    await Promise.all(
      [desktop, mobile]
        .filter(Boolean)
        .map((page, index) => settleClose(`page ${index + 1}`, page.close({ runBeforeUnload: false }).catch(() => undefined))),
    );
    await settleClose("browser", browser.close());
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
