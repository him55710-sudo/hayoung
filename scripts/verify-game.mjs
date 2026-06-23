import { chromium } from "playwright";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const url = process.env.GAME_URL ?? "http://127.0.0.1:5173/";
const answers = ["0100", "1", "URDL", "STAR", "0300", "LURD", "2", "MOON", "0500", "YES"];
const debug = process.env.DEBUG_GAME_VERIFY === "1";
const debugLogPath = "output/playwright/verify-debug.log";
const minCanvasVariation = 1500;

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
  let timeoutId;
  await Promise.race([
    promise.finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    }),
    new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        log(`${label} close timed out; continuing cleanup`);
        resolve(undefined);
      }, 10000);
    }),
  ]);
  if (timeoutId) clearTimeout(timeoutId);
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

async function clickGraphicsQuality(page, expectedQuality) {
  const qualityButton = page.locator(".icon-actions button[data-quality]");
  const count = await qualityButton.count();
  if (count !== 1) throw new Error(`Expected one graphics quality button, got ${count}`);
  await qualityButton.click({ force: true });
  await page.waitForFunction(
    (quality) => {
      const button = document.querySelector(".icon-actions button[data-quality]");
      const state = JSON.parse(window.render_game_to_text());
      return button?.getAttribute("data-quality") === quality && state.graphicsQuality === quality;
    },
    expectedQuality,
    { timeout: 15000 },
  );
}

async function enterGame(page, isMobile = false) {
  log(`enter ${isMobile ? "mobile" : "desktop"}`);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  log(`goto ${isMobile ? "mobile" : "desktop"}`);
  await page.waitForSelector(".runaway-button");
  log(`intro ready ${isMobile ? "mobile" : "desktop"}`);
  const introText = await page.locator(".intro-copy h1").innerText();
  if (!introText.includes("500일")) throw new Error(`Unexpected intro: ${introText}`);

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
  if (isMobile) await clickSelector(page, ".runaway-button");
  else await page.locator(".runaway-button").click({ force: true });
  log(`start clicked ${isMobile ? "mobile" : "desktop"}`);
  await page.waitForSelector("canvas", { state: "attached" });
  log(`canvas attached ${isMobile ? "mobile" : "desktop"}`);
  await waitForPhase(page, "game");
  await page.waitForTimeout(900);
  log(`entered ${isMobile ? "mobile" : "desktop"}`);
}

async function verifyGraphicsQuality(page, initialCanvas) {
  const initialState = await gameState(page);
  if (initialState.graphicsQuality !== "cinematic") {
    throw new Error(`Expected cinematic graphics by default: ${JSON.stringify(initialState)}`);
  }

  await clickGraphicsQuality(page, "balanced");
  const balancedState = await gameState(page);

  await clickGraphicsQuality(page, "performance");
  await page.waitForTimeout(180);
  const performanceState = await gameState(page);
  const performanceCanvas = await canvasStats(page);

  if (!performanceState.performanceMode) {
    throw new Error(`Performance graphics mode not exposed: ${JSON.stringify(performanceState)}`);
  }
  if (performanceState.cinematicAtmosphere !== "reduced in performance mode") {
    throw new Error(`Performance mode did not reduce atmosphere metadata: ${JSON.stringify(performanceState)}`);
  }
  if (performanceCanvas.width >= initialCanvas.width || performanceCanvas.height >= initialCanvas.height) {
    throw new Error(`Performance mode did not reduce render buffer: ${JSON.stringify({ initialCanvas, performanceCanvas })}`);
  }

  await clickGraphicsQuality(page, "cinematic");

  return {
    initial: {
      quality: initialState.graphicsQuality,
      renderScaleCap: initialState.renderScaleCap,
      canvas: initialCanvas,
    },
    balanced: {
      quality: balancedState.graphicsQuality,
      renderScaleCap: balancedState.renderScaleCap,
    },
    performance: {
      quality: performanceState.graphicsQuality,
      renderScaleCap: performanceState.renderScaleCap,
      canvas: performanceCanvas,
    },
  };
}

async function solveAll(page) {
  for (const [index, answer] of answers.entries()) {
    log(`solve ${answer}`);
    let opened = false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      log(`attempt ${answer} ${attempt}`);
      const clearCount = await page.locator(".room-clear-button").count();
      if (clearCount) {
        await clickSelector(page, ".room-clear-button");
        await page.waitForTimeout(420);
      }
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
    if ((index + 1) % 2 === 0 && index < answers.length - 1) {
      await page.waitForSelector(".room-clear-panel", { timeout: 15000 });
      const roomClearButtonCount = await page.locator(".room-clear-button").count();
      if (!roomClearButtonCount) throw new Error(`Room clear CTA missing after answer ${answer}`);
    }
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
    if (!desktopState.cinematicAtmosphere?.includes("volumetric")) throw new Error(`Cinematic atmosphere metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopState.cinematicCamera?.includes("FOV")) throw new Error(`Cinematic camera metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopState.screenPostFx?.includes("vignette")) throw new Error(`Screen post-FX metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopState.collisionModel?.includes("console")) throw new Error(`Collision metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopState.hudBehavior?.includes("calm HUD")) throw new Error(`HUD behavior metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopState.environmentDetail?.includes("lived-in escape room")) throw new Error(`Environment detail metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopState.transitionVfx?.includes("transition veil")) throw new Error(`Transition VFX metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopState.objectiveTracker?.includes("case-file HUD")) throw new Error(`Objective tracker metadata missing: ${JSON.stringify(desktopState)}`);
    if (!desktopCanvas.found || desktopCanvas.varied < minCanvasVariation) throw new Error(`Desktop canvas looks blank: ${JSON.stringify(desktopCanvas)}`);
    const graphicsCheck = await verifyGraphicsQuality(desktop, desktopCanvas);
    const ending = await solveAll(desktop);
    if (ending.phase !== "ending" || ending.solvedPuzzles !== 10) throw new Error(`Ending failed: ${JSON.stringify(ending)}`);

    log("park desktop");
    await desktop.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => undefined);
    await settleClose("desktop", desktop.close({ runBeforeUnload: false }).catch(() => undefined));
    desktop = undefined;

    mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await enterGame(mobile, true);
    log("mobile state");
    const mobileState = await gameState(mobile);
    log("mobile canvas stats");
    const mobileCanvas = await canvasStats(mobile);
    if (!mobileCanvas.found || mobileCanvas.varied < minCanvasVariation) throw new Error(`Mobile canvas looks blank: ${JSON.stringify(mobileCanvas)}`);
    log("mobile canvas ok");
    await mobile.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 5000 }).catch(() => undefined);

    const result = {
      url,
      desktopState,
      desktopCanvas,
      graphicsCheck,
      ending,
      mobileState,
      mobileCanvas,
    };
    mkdirSync("output/playwright", { recursive: true });
    writeFileSync("output/playwright/verify-result.json", JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await Promise.all(
      [desktop, mobile]
        .filter(Boolean)
        .map((page, index) => settleClose(`page ${index + 1}`, page.close({ runBeforeUnload: false }).catch(() => undefined))),
    );
    await settleClose("browser", browser.close());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
