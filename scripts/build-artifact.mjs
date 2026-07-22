/**
 * 현재 빌드를 외부 요청 없이 동작하는 단일 HTML 미리보기로 패키징한다.
 * (원격 작업 환경에서는 로컬 서버를 외부에 노출할 수 없어, 정적 자산을
 * 전부 data URI로 인라인한 미리보기 페이지를 만들어 공유한다.)
 *
 * 사용법: npm run build && node scripts/build-artifact.mjs [출력경로]
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const outPath = process.argv[2] ?? "output/artifact/hayoung-500-preview.html";

const distHtml = readFileSync("dist/index.html", "utf8");
const jsName = distHtml.match(/\/assets\/(index-[^"]+\.js)/)?.[1];
const cssName = distHtml.match(/\/assets\/(index-[^"]+\.css)/)?.[1];
if (!jsName || !cssName) {
  throw new Error("dist/index.html에서 번들 파일명을 찾지 못했습니다. npm run build를 먼저 실행하세요.");
}

let js = readFileSync(`dist/assets/${jsName}`, "utf8");
const css = readFileSync(`dist/assets/${cssName}`, "utf8");

// 브라우저 캔버스로 사진을 축소해 data URI로 만든다 (외부 이미지 도구 없이 처리).
const browser = await chromium.launch({
  headless: true,
  executablePath: "/opt/pw-browsers/chromium",
});
const page = await browser.newPage();

async function toResizedDataUri(filePath, maxWidth, quality) {
  const base64 = readFileSync(filePath).toString("base64");
  const sourceUri = `data:image/jpeg;base64,${base64}`;
  return page.evaluate(
    async ({ src, width, q }) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const scale = Math.min(1, width / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", q);
    },
    { src: sourceUri, width: maxWidth, q: quality },
  );
}

const replacements = new Map();

for (const file of readdirSync("public/theme-posters")) {
  replacements.set(`/theme-posters/${file}`, await toResizedDataUri(`public/theme-posters/${file}`, 720, 0.8));
}
for (const file of readdirSync("public/memories")) {
  if (file.endsWith(".jpeg") || file.endsWith(".jpg")) {
    replacements.set(`/memories/${file}`, await toResizedDataUri(`public/memories/${file}`, 900, 0.82));
  } else if (file.endsWith(".svg")) {
    const svg = readFileSync(`public/memories/${file}`).toString("base64");
    replacements.set(`/memories/${file}`, `data:image/svg+xml;base64,${svg}`);
  }
}

await browser.close();

let missing = 0;
for (const [path, dataUri] of replacements) {
  if (!js.includes(path)) {
    console.warn(`번들에서 참조를 찾지 못함(무시): ${path}`);
    missing += 1;
    continue;
  }
  js = js.split(path).join(dataUri);
}

if (js.includes("</script")) {
  js = js.split("</script").join("<\\/script");
}

const html = [
  "<title>500일의 방 — 미리보기</title>",
  `<style>\n${css}\n</style>`,
  '<div id="root"></div>',
  `<script type="module">\n${js}\n</script>`,
].join("\n");

writeFileSync(outPath, html);
console.log(
  JSON.stringify(
    {
      out: resolve(outPath),
      sizeMB: (Buffer.byteLength(html) / 1024 / 1024).toFixed(2),
      inlinedAssets: replacements.size - missing,
      missing,
    },
    null,
    2,
  ),
);
