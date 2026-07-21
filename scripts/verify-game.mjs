/**
 * 500일의 방 — Room 1 실제 추억 퍼즐 체인 자동 검증.
 *
 * 검증 흐름:
 *  시작 화면 → 네 버튼 도망 → 6초 입장 → 1인칭 진입 → 현수 음성 →
 *  선행 조건 잠금 → VITA500 → 액자 정렬/색상 → 바이올린 키링 →
 *  인생의 회전목마 → 놀이공원 그림 → 9번 칸 → 살치살 → 현수의 스테이크 →
 *  Room 1 문 개방 → 힌트 계약서 3단계 → 저장/이어하기 → 엔딩 → 모바일.
 */

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";

const port = 5173;
const url = process.env.GAME_URL ?? `http://127.0.0.1:${port}/`;
const shouldStartServer = !process.env.GAME_URL;
const debug = process.env.DEBUG_GAME_VERIFY === "1";
const debugLogPath = "output/playwright/verify-debug.log";
const minCanvasVariation = 1200;

if (debug) {
  mkdirSync(dirname(debugLogPath), { recursive: true });
  writeFileSync(debugLogPath, "");
}

function log(...args) {
  if (debug) appendFileSync(debugLogPath, `[verify] ${args.join(" ")}\n`);
}

let server = null;

async function startDevServer() {
  if (!shouldStartServer) {
    return;
  }
  server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    stdio: debug ? "inherit" : "ignore",
  });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log("dev server ready");
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("dev server did not become ready");
}

function stopDevServer() {
  if (server && !server.killed) {
    server.kill("SIGTERM");
  }
}

/**
 * 소프트웨어 WebGL(SwiftShader) 환경에서는 렌더 프레임이 매우 길어져
 * page.evaluate가 무기한 대기할 수 있다. 모든 evaluate를 타임아웃 레이스로
 * 감싸 어떤 단계도 조용히 멈추지 않게 한다.
 */
async function ev(page, pageFunction, arg, label, timeout = 30000) {
  let timer;
  try {
    return await Promise.race([
      page.evaluate(pageFunction, arg),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`evaluate timed out: ${label}`)), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function gameState(page) {
  return ev(page, () => JSON.parse(window.render_game_to_text()), undefined, "render_game_to_text");
}

async function debugState(page) {
  return ev(page, () => JSON.parse(window.hayoungDebugState()), undefined, "hayoungDebugState");
}

async function waitFor(page, predicate, label, timeout = 20000) {
  const started = Date.now();
  for (;;) {
    let value = null;
    try {
      value = await ev(
        page,
        () => (window.hayoungDebugState ? JSON.parse(window.hayoungDebugState()) : null),
        undefined,
        `poll ${label}`,
        10000,
      );
    } catch {
      value = null;
    }
    if (value && predicate(value)) {
      return value;
    }
    if (Date.now() - started > timeout) {
      throw new Error(`Timed out waiting for ${label}`);
    }
    await page.waitForTimeout(200);
  }
}

async function waitForPhase(page, phase) {
  await page.waitForFunction(
    (target) => window.render_game_to_text && JSON.parse(window.render_game_to_text()).phase === target,
    phase,
    { timeout: 20000 },
  );
}

async function waitForSelector(page, selector, timeout = 15000) {
  await page.waitForFunction((target) => Boolean(document.querySelector(target)), selector, { timeout });
}

async function waitForAbsence(page, selector, timeout = 15000) {
  await page.waitForFunction((target) => !document.querySelector(target), selector, { timeout });
}

async function clickSelector(page, selector) {
  await ev(
    page,
    (target) => {
      const element = document.querySelector(target);
      if (!(element instanceof HTMLElement)) {
        throw new Error(`Missing clickable selector: ${target}`);
      }
      element.click();
    },
    selector,
    `click ${selector}`,
  );
}

async function setInputValue(page, selector, value) {
  await ev(
    page,
    ({ target, next }) => {
      const input = document.querySelector(target);
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`Missing input selector: ${target}`);
      }
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (!setter) {
        throw new Error("Native input value setter missing");
      }
      setter.call(input, next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    { target: selector, next: value },
    `set input ${selector}`,
  );
}

async function submitAnswer(page, inputSelector, value) {
  await setInputValue(page, inputSelector, value);
  await clickSelector(page, ".memory-modal .memory-answer-submit");
}

async function openStation(page, stationId) {
  await ev(page, (id) => window.hayoungDebugOpenStation(id), stationId, `open station ${stationId}`);
}

async function waitForSolved(page, puzzleId) {
  await waitFor(page, (state) => state.completedPuzzleIds.includes(puzzleId), `puzzle ${puzzleId} solved`, 15000);
  await waitForAbsence(page, ".memory-modal");
}

async function canvasStats(page) {
  return ev(page, () => {
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
  }, undefined, "canvasStats", 60000);
}

async function runawayTranslateDistance(page) {
  return ev(page, () => {
    const button = document.querySelector(".runaway-button");
    if (!(button instanceof HTMLElement)) return 0;
    const translate = button.style.translate || getComputedStyle(button).translate;
    if (!translate || translate === "none") return 0;
    const [x = 0, y = 0] = translate
      .split(/\s+/)
      .map((part) => Number.parseFloat(part))
      .filter((value) => Number.isFinite(value));
    return Math.hypot(x, y);
  }, undefined, "runawayTranslateDistance");
}

function expect(condition, label, failures) {
  if (condition) {
    log(`PASS ${label}`);
    return true;
  }
  failures.push(label);
  log(`FAIL ${label}`);
  return false;
}

async function main() {
  await startDevServer();

  // 프로젝트에 고정된 Playwright 버전과 로컬 브라우저 캐시가 어긋나도 동작하도록
  // 미리 설치된 Chromium 경로(CHROMIUM_PATH 또는 /opt/pw-browsers/chromium)를 우선 사용한다.
  const executablePath = process.env.CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const failures = [];
  const pageErrors = [];
  let desktop = null;
  let mobile = null;

  const watchdog = setTimeout(() => {
    console.error("verification watchdog fired after 300s — dumping state and exiting");
    console.error(JSON.stringify({ failures, pageErrors }, null, 2));
    process.exit(1);
  }, 300000);

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    context.setDefaultTimeout(20000);
    context.setDefaultNavigationTimeout(30000);
    desktop = await context.newPage();
    desktop.on("pageerror", (error) => pageErrors.push(`desktop: ${error.message}`));

    // 1. 시작 화면 — 소프트웨어 WebGL 환경에서도 안정적으로 돌도록 저부하 모드로 검증한다.
    await desktop.goto(`${url}?gfx=performance`, { waitUntil: "domcontentloaded" });
    await waitForSelector(desktop, ".theme-select-heading h1");
    let state = await gameState(desktop);
    expect(state.phase === "intro", "1. 시작 화면 표시", failures);
    expect(state.puzzleChain?.length === 8, "1b. Room 1 퍼즐 체인 8개 정의", failures);

    // 2. 테마 선택 + 네 버튼 도망
    await clickSelector(desktop, ".theme-card");
    await waitForSelector(desktop, ".runaway-button");
    await ev(desktop, () => {
      const button = document.querySelector(".runaway-button");
      button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true, view: window }));
      button.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, view: window }));
    }, undefined, "runaway hover");
    const evadeDistance = await runawayTranslateDistance(desktop);
    expect(evadeDistance > 20, `2. 네 버튼 도망 동작 (이동 ${Math.round(evadeDistance)}px)`, failures);

    // 3. 6초 후 입장 가능
    await desktop.waitForTimeout(6400);
    await desktop.waitForFunction(() => document.querySelector(".runaway-button.is-ready"), null, { timeout: 8000 });
    await clickSelector(desktop, ".runaway-button");
    await waitForPhase(desktop, "game");
    expect(true, "3. 6초 후 입장 및 게임 진입", failures);

    // 4. 현수 음성 오버레이 + 1인칭 캔버스
    await waitForSelector(desktop, ".voice-overlay");
    await clickSelector(desktop, ".voice-skip");
    await waitForAbsence(desktop, ".voice-overlay");
    await desktop.waitForTimeout(700);
    await ev(desktop, () => window.advanceTime?.(300), undefined, "advanceTime desktop", 60000);
    const desktopCanvas = await canvasStats(desktop);
    expect(desktopCanvas.found && desktopCanvas.varied > minCanvasVariation, `4. 데스크톱 WebGL 렌더 (varied ${desktopCanvas.varied})`, failures);

    // 5. 선행 조건: 잠긴 스테이션은 열리지 않는다
    await openStation(desktop, "station-steak-table");
    await desktop.waitForTimeout(400);
    let snapshot = await debugState(desktop);
    expect(snapshot.activePuzzleId === null, "5. 무작위 접근 차단 (스테이크 테이블 잠김)", failures);
    await openStation(desktop, "station-memory-wall");
    await desktop.waitForTimeout(400);
    snapshot = await debugState(desktop);
    expect(snapshot.activePuzzleId === null, "5b. 액자 벽은 편지 전에 잠김", failures);

    // 5c. 힌트 계약서 3단계 (위치 → 연결 → 정답 직전)
    await clickSelector(desktop, '.icon-actions button[title="힌트 계약서"]');
    await waitForSelector(desktop, ".hint-sheet");
    for (let i = 0; i < 3; i += 1) {
      await clickSelector(desktop, ".hint-issue-button");
      await desktop.waitForTimeout(250);
    }
    snapshot = await debugState(desktop);
    expect(snapshot.hintsUsed === 3 && snapshot.hintContracts.length === 3, "5c. 힌트 계약서 3단계 발급", failures);
    const receipts = await ev(desktop, () => document.querySelectorAll(".hint-receipt").length, undefined, "hint receipts");
    expect(receipts === 3, "5d. 힌트 영수증 3장 표시", failures);
    await clickSelector(desktop, ".hint-sheet .close-button");
    await waitForAbsence(desktop, ".hint-sheet");
    const penaltyCardVisible = await ev(desktop, () => Boolean(document.querySelector(".penalty-card")), undefined, "penalty card");
    expect(penaltyCardVisible, "5e. 벌칙 계약 카드 HUD 유지", failures);

    // 6. VITA500 편지
    await openStation(desktop, "station-gift-table");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-vita500"]');
    await submitAnswer(desktop, '[data-testid="vita-answer-input"]', "오로나민C");
    await desktop.waitForTimeout(400);
    snapshot = await debugState(desktop);
    expect(!snapshot.completedPuzzleIds.includes("room1-vita500"), "6. VITA500 오답 거부", failures);
    await submitAnswer(desktop, '[data-testid="vita-answer-input"]', "비타500");
    await waitForSolved(desktop, "room1-vita500");
    expect(true, "6b. VITA500 정답 인식 (한글 표기 허용)", failures);

    // 7. 액자 시간순 정렬 + 색상 순서
    await openStation(desktop, "station-memory-wall");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-memory-frames"]');
    for (const key of ["hongdae", "jatjeol", "philippines", "birthday"]) {
      await clickSelector(desktop, `.frame-card[data-frame="${key}"]`);
    }
    await clickSelector(desktop, ".frame-check-button");
    await desktop.waitForTimeout(400);
    const wrongOrderStep = await ev(desktop, () => document.querySelector(".frame-sequence-body")?.dataset.step, undefined, "frame step");
    expect(wrongOrderStep === "arrange", "7. 잘못된 액자 순서 거부", failures);
    for (const key of ["jatjeol", "birthday", "philippines", "hongdae"]) {
      await clickSelector(desktop, `.frame-card[data-frame="${key}"]`);
    }
    await clickSelector(desktop, ".frame-check-button");
    await desktop.waitForFunction(() => document.querySelector(".frame-sequence-body")?.dataset.step === "colors", null, { timeout: 6000 });
    expect(true, "7b. 올바른 액자 순서 인식", failures);
    for (const color of ["yellow", "green", "blue", "red"]) {
      await clickSelector(desktop, `.color-key[data-color="${color}"]`);
      await desktop.waitForTimeout(120);
    }
    await waitForSolved(desktop, "room1-memory-frames");
    snapshot = await debugState(desktop);
    expect(snapshot.inventoryItemIds.includes("violin-keyring"), "8. 노랑→초록→파랑→빨강 인식 + 바이올린 키링 획득", failures);

    // 9. 바이올린 키링 장착 (오사용 → 실패)
    await openStation(desktop, "station-violin-case");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-violin-keyring"]');
    await clickSelector(desktop, '.keyring-target[data-target="music-box"]');
    await desktop.waitForTimeout(400);
    snapshot = await debugState(desktop);
    expect(!snapshot.completedPuzzleIds.includes("room1-violin-keyring"), "9. 키링을 잘못된 물체에 사용하면 실패", failures);
    await clickSelector(desktop, '.keyring-item[data-item="violin-keyring"]');
    await clickSelector(desktop, '.keyring-target[data-target="violin-doll"]');
    await waitForSolved(desktop, "room1-violin-keyring");
    expect(true, "9b. 바이올린 인형에 키링 장착 → 연주 시작", failures);

    // 10. 인생의 회전목마
    await openStation(desktop, "station-music-cabinet");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-merry-go-round-song"]');
    await clickSelector(desktop, ".song-play-button");
    await submitAnswer(desktop, '[data-testid="song-answer-input"]', "캐논");
    await desktop.waitForTimeout(400);
    snapshot = await debugState(desktop);
    expect(!snapshot.completedPuzzleIds.includes("room1-merry-go-round-song"), "10. 잘못된 곡 제목 거부", failures);
    await submitAnswer(desktop, '[data-testid="song-answer-input"]', "인생의 회전목마");
    await waitForSolved(desktop, "room1-merry-go-round-song");
    snapshot = await debugState(desktop);
    expect(snapshot.inventoryItemIds.includes("carousel-model"), "10b. 정답 인식 + 회전목마 모형 획득", failures);

    // 11. 놀이공원 그림에 회전목마 삽입
    await openStation(desktop, "station-carousel-painting");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-carousel-painting"]');
    await clickSelector(desktop, '.keyring-item[data-item="carousel-model"]');
    await clickSelector(desktop, ".painting-slot");
    await waitForSolved(desktop, "room1-carousel-painting");
    snapshot = await debugState(desktop);
    expect(snapshot.inspectedClueIds.includes("guro-pyeongsang"), "11. 회전목마 삽입 → 구로평상 단서 획득", failures);

    // 12. 구로평상과 9번 칸
    await openStation(desktop, "station-floor-grid");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-guro-pyeongsang-nine"]');
    await clickSelector(desktop, '.floor-cell[data-cell="5"]');
    await desktop.waitForTimeout(400);
    snapshot = await debugState(desktop);
    expect(!snapshot.completedPuzzleIds.includes("room1-guro-pyeongsang-nine"), "12. 잘못된 타일 거부", failures);
    await clickSelector(desktop, '.floor-cell[data-cell="9"]');
    await waitForSolved(desktop, "room1-guro-pyeongsang-nine");
    expect(true, "12b. 9번 칸 정답 인식", failures);

    // 13. 살치살
    await openStation(desktop, "station-beef-wall");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-salchisal"]');
    await clickSelector(desktop, '.beef-region[data-region="deungsim"]');
    await desktop.waitForTimeout(300);
    const placedEarly = await ev(desktop, () => document.querySelector(".beef-body")?.dataset.placed, undefined, "beef placed");
    expect(placedEarly === "false", "13. 잘못된 부위에 조각이 붙지 않음", failures);
    await clickSelector(desktop, '.beef-region[data-region="salchisal"]');
    await desktop.waitForFunction(() => document.querySelector(".beef-body")?.dataset.placed === "true", null, { timeout: 6000 });
    await submitAnswer(desktop, '[data-testid="beef-answer-input"]', "살치살");
    await waitForSolved(desktop, "room1-salchisal");
    expect(true, "13b. 살치살 위치 배치 + 이름 정답 인식", failures);

    // 14. 두 스테이크 중 선택
    await openStation(desktop, "station-steak-table");
    await waitForSelector(desktop, '.memory-modal[data-puzzle="room1-hyunsu-steak"]');
    await clickSelector(desktop, '.steak-card[data-steak="alpero"]');
    await desktop.waitForTimeout(400);
    snapshot = await debugState(desktop);
    const alperoRejected =
      !snapshot.completedPuzzleIds.includes("room1-hyunsu-steak") && snapshot.selectedSteak === "alpero";
    expect(alperoRejected, "14. 알페로 선택 시 실패 + 재도전 가능", failures);
    const wrongLineShown = await ev(desktop, () =>
      Boolean(document.querySelector(".memory-error")?.textContent?.includes("기다린 답")),
    undefined, "steak wrong line");
    expect(wrongLineShown, "14b. 현수의 장난스러운 오답 문구 표시", failures);
    await clickSelector(desktop, '.steak-card[data-steak="hyunsu"]');
    await waitForSolved(desktop, "room1-hyunsu-steak");
    expect(true, "14c. 현수의 스테이크 선택 시 성공", failures);

    // 15. Room 1 문 개방 + 클리어 오버레이
    state = await gameState(desktop);
    expect(state.room1Complete === true && state.exitDoorOpen === true, "15. Room 1 완료 + 출구 문 개방", failures);
    await waitForSelector(desktop, ".room-clear-panel");
    const clearCopy = await ev(desktop, () => document.querySelector(".room-clear-panel h2")?.textContent ?? "", undefined, "clear copy");
    expect(clearCopy.includes("첫 100일의 기억"), "15b. Room 1 클리어 문구", failures);

    // 16. 힌트 계약서 3단계
    await clickSelector(desktop, ".room-clear-button");
    await waitFor(desktop, (snap) => snap.currentRoomId === 2, "room 2 진입");
    state = await gameState(desktop);
    expect(state.comingSoonNotice === "다음 기억을 준비 중입니다.", "16. Room 2 준비 중 안내", failures);

    // 17. 저장 / 이어하기
    log("step 17: reloading for save/continue check");
    await desktop.goto(`${url}?gfx=performance&reload=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
    log("step 17: reloaded");
    await waitForSelector(desktop, ".continue-chip");
    log("step 17: continue chip visible");
    await clickSelector(desktop, ".continue-chip");
    await waitForPhase(desktop, "game");
    log("step 17: back in game");
    snapshot = await debugState(desktop);
    expect(
      snapshot.currentRoomId === 2 && snapshot.completedPuzzleIds.length === 8 && snapshot.hintsUsed === 3,
      "17. 저장 및 이어하기 (Room 2 · 기억 8/8 · 힌트 기록 복원)",
      failures,
    );

    // 19. 키보드 이동
    const beforeMove = await ev(desktop, () => window.hayoungCameraState?.z ?? null, undefined, "camera before");
    await desktop.keyboard.down("w");
    await ev(desktop, () => window.advanceTime?.(400), undefined, "advanceTime move", 60000);
    await desktop.keyboard.up("w");
    const afterMove = await ev(desktop, () => window.hayoungCameraState?.z ?? null, undefined, "camera after");
    expect(beforeMove !== null && afterMove !== null && afterMove < beforeMove, "19. 키보드 W 전진 이동", failures);

    // 20. 그래픽 품질 순환
    await clickSelector(desktop, '.icon-actions button[data-quality]');
    await desktop.waitForTimeout(300);
    state = await gameState(desktop);
    expect(state.graphicsQuality === "cinematic", "20. 그래픽 품질 모드 순환 (performance → cinematic)", failures);

    // 21. 엔딩
    await ev(desktop, () => window.hayoungDebugCompleteGame(), undefined, "complete game");
    await waitForPhase(desktop, "ending");
    await waitForSelector(desktop, ".ending-letter");
    const endingChecks = await ev(desktop, () => ({
      title: document.querySelector(".ending-copy h2")?.textContent ?? "",
      cards: document.querySelectorAll(".memory-card").length,
    }), undefined, "ending checks");
    expect(
      endingChecks.title.includes("다음 방도 우리 둘이 같이 열자") && endingChecks.cards === 6,
      "21. 엔딩 편지 + 6개 사진 타임라인",
      failures,
    );

    // 22. 모바일
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    mobile = await mobileContext.newPage();
    mobile.on("pageerror", (error) => pageErrors.push(`mobile: ${error.message}`));
    await mobile.goto(`${url}?play=1&gfx=performance`, { waitUntil: "domcontentloaded" });
    await waitForPhase(mobile, "game");
    await mobile.waitForTimeout(900);
    await ev(mobile, () => window.advanceTime?.(300), undefined, "advanceTime mobile", 60000);
    const mobileCanvas = await canvasStats(mobile);
    const mobileControls = await ev(mobile, () => ({
      pad: Boolean(document.querySelector(".mobile-pad")),
      look: Boolean(document.querySelector(".look-pad")),
      interact: Boolean(document.querySelector(".interact-button")),
      hint: Boolean(document.querySelector('.icon-actions button[title="힌트 계약서"]')),
    }), undefined, "mobile controls");
    expect(mobileCanvas.found && mobileCanvas.varied > minCanvasVariation, `22. 모바일 WebGL 렌더 (varied ${mobileCanvas.varied})`, failures);
    expect(
      mobileControls.pad && mobileControls.look && mobileControls.interact && mobileControls.hint,
      "22b. 모바일 조작 UI (이동 패드/시점 패드/조사/힌트)",
      failures,
    );

    // 23. 치명적 콘솔 오류 없음
    expect(pageErrors.length === 0, `23. 치명적 페이지 오류 없음 (${pageErrors.length}건)`, failures);

    clearTimeout(watchdog);
    const result = {
      ok: failures.length === 0,
      failures,
      pageErrors,
      desktopCanvas,
      mobileCanvas,
      finishedAt: new Date().toISOString(),
    };
    mkdirSync("output/playwright", { recursive: true });
    writeFileSync("output/playwright/verify-result.json", JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    if (failures.length > 0) {
      throw new Error(`verification failed: ${failures.join(" | ")}`);
    }
  } finally {
    await Promise.all(
      [desktop, mobile]
        .filter(Boolean)
        .map((page) => page.close({ runBeforeUnload: false }).catch(() => undefined)),
    );
    await browser.close().catch(() => undefined);
    stopDevServer();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    stopDevServer();
    process.exit(1);
  });
