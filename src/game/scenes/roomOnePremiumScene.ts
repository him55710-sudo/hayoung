/**
 * Room 1 — "한밤의 기억 저택" 프리미엄 씬.
 *
 * 기존 박스 기반 방을 대체하는 완전 신규 구성:
 * 헤링본 마루, 다마스크 벽지 + 월넛 웨인스코팅, 코퍼드 천장과 곡선 샹들리에,
 * 대리석 벽난로, 달빛 아치창과 커튼, 금박 액자, 물리 기반 재질.
 *
 * 스테이션 좌표(room1Stations)와 퍼즐 연동 userData 계약은 그대로 유지한다:
 * memoryFrameKey/Order, roomOneViolinDoll, roomOneCaseKeyring, roomOnePickupKeyring,
 * roomOneCabinetCarousel, roomOnePaintingCarousel, floorPuzzleCell, roomOneSalchisalMarker,
 * roomOneSteakFlame, roomOneSteakLight, roomOneExitDoorPivot, roomOneDoorSeam,
 * roomOneExitLight, roomOnePyeongsangBench, statusLight, float.
 */

import * as THREE from "three";
import { memoryFrames } from "../data/memories";

const textureCache = new Map<string, THREE.Texture>();
const photoLoader = new THREE.TextureLoader();

/* ----------------------------------------------------------------------------
 * 절차형 텍스처
 * -------------------------------------------------------------------------- */

function canvasTexture(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const cacheKey = `premium-${key}`;
  const cached = textureCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("premium texture context unavailable");
  }
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (repeat) {
    texture.repeat.set(repeat[0], repeat[1]);
  }
  textureCache.set(cacheKey, texture);
  return texture;
}

/** 헤링본 오크 마루. */
function herringboneTexture() {
  return canvasTexture("herringbone", 1024, 1024, (ctx) => {
    ctx.fillStyle = "#3d2a1a";
    ctx.fillRect(0, 0, 1024, 1024);
    const plankW = 128;
    const plankH = 42;
    const woods = ["#5a3f26", "#654930", "#4e3521", "#6b4e33", "#573d25"];
    for (let row = -8; row < 34; row += 1) {
      for (let col = -4; col < 12; col += 1) {
        const even = (row + col) % 2 === 0;
        ctx.save();
        ctx.translate(col * plankW, row * plankH * 2);
        ctx.rotate(even ? Math.PI / 4 : -Math.PI / 4);
        const base = woods[Math.abs(row * 7 + col * 13) % woods.length];
        ctx.fillStyle = base;
        ctx.fillRect(-plankW, -plankH / 2, plankW * 2, plankH);
        ctx.strokeStyle = "rgba(20, 10, 4, 0.55)";
        ctx.lineWidth = 2;
        ctx.strokeRect(-plankW, -plankH / 2, plankW * 2, plankH);
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = "#c9a06a";
        for (let g = 0; g < 4; g += 1) {
          ctx.beginPath();
          ctx.moveTo(-plankW, -plankH / 2 + 8 + g * 9);
          ctx.lineTo(plankW, -plankH / 2 + 4 + g * 10);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }
    const sheen = ctx.createRadialGradient(512, 512, 60, 512, 512, 760);
    sheen.addColorStop(0, "rgba(255, 226, 170, 0.10)");
    sheen.addColorStop(1, "rgba(0, 0, 0, 0.16)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 1024, 1024);
  }, [3.4, 2.4]);
}

/** 다마스크 벽지 — 크림 바탕에 금사 문양. */
function damaskTexture() {
  return canvasTexture("damask", 512, 512, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, "#2c1f2b");
    bg.addColorStop(1, "#241723");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "rgba(216, 179, 106, 0.34)";
    ctx.fillStyle = "rgba(216, 179, 106, 0.16)";
    ctx.lineWidth = 2.4;
    const motif = (cx: number, cy: number, s: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.bezierCurveTo(cx + s * 0.72, cy - s * 0.72, cx + s * 0.5, cy + s * 0.15, cx, cy + s * 0.4);
      ctx.bezierCurveTo(cx - s * 0.5, cy + s * 0.15, cx - s * 0.72, cy - s * 0.72, cx, cy - s);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + s * 0.4);
      ctx.quadraticCurveTo(cx + s * 0.42, cy + s * 0.8, cx, cy + s * 1.05);
      ctx.quadraticCurveTo(cx - s * 0.42, cy + s * 0.8, cx, cy + s * 0.4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.16, s * 0.16, 0, Math.PI * 2);
      ctx.stroke();
    };
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const offset = row % 2 === 0 ? 0 : 64;
        motif(64 + col * 128 + offset, 72 + row * 128, 34);
      }
    }
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 512; i += 3) {
      ctx.fillStyle = i % 2 ? "#000" : "#f2d391";
      ctx.fillRect(0, i, 512, 1);
    }
    ctx.globalAlpha = 1;
  }, [4.4, 1.5]);
}

/** 월넛 웨인스코팅 패널. */
function walnutTexture() {
  return canvasTexture("walnut", 512, 512, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 512, 0);
    bg.addColorStop(0, "#2e1d10");
    bg.addColorStop(0.5, "#3c2817");
    bg.addColorStop(1, "#2a1a0e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 46; i += 1) {
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = i % 3 ? "#1b0f06" : "#5a3d22";
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(0, i * 12 + Math.sin(i) * 6);
      ctx.bezierCurveTo(160, i * 12 + Math.sin(i * 1.7) * 14, 340, i * 12 + Math.cos(i * 1.3) * 12, 512, i * 12 + Math.sin(i * 0.8) * 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [1.6, 1]);
}

/** 대리석 — 크림 화이트에 금갈색 결. */
function marbleTexture() {
  return canvasTexture("marble", 512, 512, (ctx) => {
    ctx.fillStyle = "#cfc3ac";
    ctx.fillRect(0, 0, 512, 512);
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, "rgba(178, 165, 142, 0.6)");
    grad.addColorStop(0.55, "rgba(212, 202, 182, 0.25)");
    grad.addColorStop(1, "rgba(164, 150, 126, 0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 15; i += 1) {
      ctx.globalAlpha = 0.22 + (i % 3) * 0.08;
      ctx.strokeStyle = i % 4 === 0 ? "#a08048" : "#8a7a62";
      ctx.lineWidth = i % 4 === 0 ? 2.2 : 1.1;
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = -10;
      ctx.moveTo(x, y);
      while (y < 522) {
        x += (Math.random() - 0.5) * 66;
        y += 22 + Math.random() * 30;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [1.4, 1.4]);
}

/** 페르시안 러그. */
function rugTexture() {
  return canvasTexture("rug", 1024, 512, (ctx) => {
    ctx.fillStyle = "#4d1c26";
    ctx.fillRect(0, 0, 1024, 512);
    ctx.strokeStyle = "#d8b36a";
    ctx.lineWidth = 7;
    ctx.strokeRect(26, 26, 972, 460);
    ctx.lineWidth = 2.4;
    ctx.strokeRect(48, 48, 928, 416);
    ctx.strokeStyle = "rgba(216, 179, 106, 0.7)";
    for (let i = 0; i < 22; i += 1) {
      const x = 74 + i * 42;
      ctx.beginPath();
      ctx.moveTo(x, 64);
      ctx.lineTo(x + 21, 88);
      ctx.lineTo(x, 112);
      ctx.lineTo(x - 21, 88);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.lineTo(x + 21, 424);
      ctx.lineTo(x, 448);
      ctx.lineTo(x - 21, 424);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(512, 256);
    ctx.strokeStyle = "#e8cd8f";
    ctx.lineWidth = 3;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 150 - ring * 34, 96 - ring * 24, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let p = 0; p < 12; p += 1) {
      const angle = (p / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * 108, Math.sin(angle) * 66, 17, 9, angle, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 512; i += 2) {
      ctx.fillStyle = i % 4 ? "#000" : "#fff";
      ctx.fillRect(0, i, 1024, 1);
    }
    ctx.globalAlpha = 1;
  });
}

/** 3×3 대리석 타일 숫자판. */
function tileNumberTexture(cell: number) {
  return canvasTexture(`tile-${cell}`, 256, 256, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#bfb29a");
    grad.addColorStop(0.55, "#ac9d82");
    grad.addColorStop(1, "#c8bba2");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#9a8a6c";
    for (let i = 0; i < 7; i += 1) {
      ctx.lineWidth = 1 + (i % 2);
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, 0);
      ctx.bezierCurveTo(Math.random() * 256, 90, Math.random() * 256, 170, Math.random() * 256, 256);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#8a6a3a";
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 236);
    ctx.fillStyle = "#4a3517";
    ctx.font = "700 118px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(cell), 128, 138);
  });
}

/** 빈티지 소 부위 도해 보드. */
function beefChartTexture() {
  return canvasTexture("beef-chart", 1024, 640, (ctx) => {
    ctx.fillStyle = "#efe3c8";
    ctx.fillRect(0, 0, 1024, 640);
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 260; i += 1) {
      ctx.fillStyle = i % 2 ? "#caa96f" : "#8a6a3a";
      ctx.fillRect(Math.random() * 1024, Math.random() * 640, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#6a4a22";
    ctx.lineWidth = 10;
    ctx.strokeRect(22, 22, 980, 596);
    ctx.lineWidth = 2.4;
    ctx.strokeRect(42, 42, 940, 556);
    ctx.fillStyle = "#4a3014";
    ctx.font = "700 52px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("우리의 정육 도감", 512, 108);
    ctx.font = "26px Georgia, serif";
    ctx.fillText("100일의 기억은 윗등 쪽, 목심과 등심 사이에 있다", 512, 152);
    ctx.save();
    ctx.translate(512, 370);
    ctx.fillStyle = "#b98b62";
    ctx.strokeStyle = "#4a3014";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-330, 30);
    ctx.bezierCurveTo(-340, -90, -220, -140, -60, -138);
    ctx.bezierCurveTo(120, -150, 260, -110, 320, -60);
    ctx.bezierCurveTo(354, -28, 344, 46, 300, 66);
    ctx.lineTo(296, 150);
    ctx.lineTo(252, 150);
    ctx.lineTo(244, 84);
    ctx.bezierCurveTo(120, 116, -40, 118, -130, 96);
    ctx.lineTo(-140, 152);
    ctx.lineTo(-186, 152);
    ctx.lineTo(-190, 82);
    ctx.bezierCurveTo(-260, 72, -320, 66, -330, 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-368, -46, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(74, 48, 20, 0.75)";
    ctx.lineWidth = 3;
    [
      [-250, -130, -238, 60],
      [-140, -142, -132, 84],
      [-20, -146, -16, 96],
      [96, -146, 104, 96],
      [206, -128, 214, 76],
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.fillStyle = "#3c280f";
    ctx.font = "700 25px Georgia, serif";
    ctx.fillText("목심", -192, -60);
    ctx.fillText("등심", -78, -70);
    ctx.fillText("채끝", 40, -74);
    ctx.fillText("안심", 152, -50);
    ctx.fillText("우둔", 262, -50);
    ctx.fillText("갈비", -70, 30);
    ctx.fillText("양지", -196, 40);
    ctx.font = "700 22px Georgia, serif";
    ctx.fillStyle = "#8e2432";
    ctx.fillText("?", -136, -104);
    ctx.restore();
  });
}

/** 놀이공원 유화. */
function amusementPaintingTexture() {
  return canvasTexture("amusement", 1024, 512, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#1d2a52");
    sky.addColorStop(0.55, "#4a3866");
    sky.addColorStop(0.8, "#8a4e63");
    sky.addColorStop(1, "#2a1c2c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = "rgba(255, 244, 214, 0.9)";
    for (let i = 0; i < 90; i += 1) {
      ctx.globalAlpha = 0.25 + Math.random() * 0.6;
      ctx.fillRect(Math.random() * 1024, Math.random() * 250, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#e8cd8f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(790, 250, 120, 0, Math.PI * 2);
    ctx.stroke();
    for (let s = 0; s < 10; s += 1) {
      const angle = (s / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(790, 250);
      ctx.lineTo(790 + Math.cos(angle) * 120, 250 + Math.sin(angle) * 120);
      ctx.stroke();
      ctx.fillStyle = "#ffd9a0";
      ctx.beginPath();
      ctx.arc(790 + Math.cos(angle) * 120, 250 + Math.sin(angle) * 120, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#221630";
    ctx.fillRect(770, 250, 40, 140);
    ctx.beginPath();
    ctx.moveTo(690, 392);
    ctx.lineTo(890, 392);
    ctx.lineTo(850, 350);
    ctx.lineTo(730, 350);
    ctx.closePath();
    ctx.fill();
    const path = ctx.createLinearGradient(0, 380, 0, 512);
    path.addColorStop(0, "rgba(255, 215, 150, 0.75)");
    path.addColorStop(1, "rgba(255, 215, 150, 0.16)");
    ctx.fillStyle = path;
    ctx.beginPath();
    ctx.moveTo(430, 512);
    ctx.lineTo(300, 386);
    ctx.lineTo(360, 380);
    ctx.lineTo(560, 512);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2c2140";
    for (let t = 0; t < 7; t += 1) {
      const x = 80 + t * 60;
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.bezierCurveTo(x - 26, 350 - (t % 3) * 22, x + 26, 340 - (t % 2) * 30, x, 300 - (t % 3) * 14);
      ctx.lineTo(x + 8, 400);
      ctx.closePath();
      ctx.fill();
    }
    // 회전목마 자리 — 비어 있는 원형 실루엣.
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = "rgba(255, 227, 170, 0.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(330, 330, 84, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "22px Georgia, serif";
    ctx.fillStyle = "rgba(255, 227, 170, 0.9)";
    ctx.textAlign = "center";
    ctx.fillText("· 비어 있는 자리 ·", 330, 336);
  });
}

/** 공원 야경 벽화 (잣절공원 코너). */
function parkMuralTexture() {
  return canvasTexture("park-mural", 768, 512, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#0c1a2e");
    sky.addColorStop(0.7, "#17324a");
    sky.addColorStop(1, "#0d1f2c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 768, 512);
    ctx.fillStyle = "#f4fbff";
    ctx.beginPath();
    ctx.arc(600, 96, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.24;
    ctx.beginPath();
    ctx.arc(600, 96, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0a1410";
    for (let t = 0; t < 6; t += 1) {
      const x = 60 + t * 130;
      const h = 150 + (t % 3) * 46;
      ctx.fillRect(x - 7, 512 - 170, 14, 96);
      ctx.beginPath();
      ctx.arc(x, 512 - 190 - h * 0.25, h * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    const ground = ctx.createLinearGradient(0, 388, 0, 512);
    ground.addColorStop(0, "#22303a");
    ground.addColorStop(1, "#131c22");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 388, 768, 124);
    ctx.strokeStyle = "rgba(255, 220, 160, 0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 96, 400);
      ctx.lineTo(i * 96 + 40, 512);
      ctx.stroke();
    }
  });
}

function photoCoverTexture(path: string, planeAspect: number) {
  const cacheKey = `photo-${path}@${planeAspect.toFixed(2)}`;
  const cached = textureCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const texture = photoLoader.load(path, (loaded) => {
    const image = loaded.image as { width?: number; height?: number } | undefined;
    if (!image?.width || !image.height) {
      return;
    }
    const imageAspect = image.width / image.height;
    if (imageAspect > planeAspect) {
      const rx = planeAspect / imageAspect;
      loaded.repeat.set(rx, 1);
      loaded.offset.set((1 - rx) / 2, 0);
    } else {
      const ry = imageAspect / planeAspect;
      loaded.repeat.set(1, ry);
      loaded.offset.set(0, (1 - ry) / 2);
    }
    loaded.needsUpdate = true;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(cacheKey, texture);
  return texture;
}

/* ----------------------------------------------------------------------------
 * 재질
 * -------------------------------------------------------------------------- */

const sharedMaterials = {
  get floor() {
    return new THREE.MeshPhysicalMaterial({
      map: herringboneTexture(),
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.4,
      clearcoatRoughness: 0.36,
      envMapIntensity: 0.55,
    });
  },
  get damask() {
    return new THREE.MeshStandardMaterial({ map: damaskTexture(), roughness: 0.86, metalness: 0.02, envMapIntensity: 0.4 });
  },
  get walnut() {
    return new THREE.MeshPhysicalMaterial({
      map: walnutTexture(),
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.4,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.7,
    });
  },
  get marble() {
    return new THREE.MeshPhysicalMaterial({
      map: marbleTexture(),
      roughness: 0.34,
      metalness: 0.02,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.45,
    });
  },
};

function brassMaterial(emissive = 0x3a2408) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xcfa14e,
    roughness: 0.24,
    metalness: 0.92,
    emissive,
    emissiveIntensity: 0.22,
    envMapIntensity: 1.35,
  });
}

function velvetMaterial(color: number) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.82,
    metalness: 0,
    sheen: 1,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35),
    sheenRoughness: 0.5,
    envMapIntensity: 0.35,
  });
}

function candleWaxMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xf6ead2, roughness: 0.6, emissive: 0xffd9a0, emissiveIntensity: 0.1 });
}

function flameMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffd287,
    emissive: 0xffa93c,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: 0.92,
  });
}

/* ----------------------------------------------------------------------------
 * 지오메트리 헬퍼
 * -------------------------------------------------------------------------- */

function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

/** 선반/테이블용 갈이 다리 (lathe). */
function turnedLeg(material: THREE.Material, height: number, radius: number) {
  const points: THREE.Vector2[] = [];
  const profile: [number, number][] = [
    [radius * 0.9, 0],
    [radius * 0.9, 0.06],
    [radius * 0.52, 0.12],
    [radius * 1.05, 0.22],
    [radius * 0.62, 0.34],
    [radius * 0.98, 0.52],
    [radius * 0.5, 0.68],
    [radius * 0.86, 0.84],
    [radius * 0.66, 1],
  ];
  for (const [r, t] of profile) {
    points.push(new THREE.Vector2(r, t * height));
  }
  return new THREE.Mesh(new THREE.LatheGeometry(points, 18), material);
}

/** 금박 몰딩 액자 (겹단 프레임). */
function giltFrame(width: number, height: number, depth: number) {
  const group = new THREE.Group();
  const gold = brassMaterial();
  const outerH = box(width + 0.18, 0.07, depth, gold, 0, height / 2 + 0.055, 0);
  const outerL = box(0.07, height + 0.18, depth, gold, -(width / 2 + 0.055), 0, 0);
  const outerR = box(0.07, height + 0.18, depth, gold, width / 2 + 0.055, 0, 0);
  const outerB = box(width + 0.18, 0.07, depth, gold, 0, -(height / 2 + 0.055), 0);
  const innerH = box(width + 0.05, 0.028, depth + 0.012, gold, 0, height / 2 + 0.012, 0);
  const innerB = box(width + 0.05, 0.028, depth + 0.012, gold, 0, -(height / 2 + 0.012), 0);
  const innerL = box(0.028, height + 0.05, depth + 0.012, gold, -(width / 2 + 0.012), 0, 0);
  const innerR = box(0.028, height + 0.05, depth + 0.012, gold, width / 2 + 0.012, 0, 0);
  group.add(outerH, outerL, outerR, outerB, innerH, innerB, innerL, innerR);
  return group;
}

/* ----------------------------------------------------------------------------
 * 씬 구성
 * -------------------------------------------------------------------------- */

export function buildRoomOnePremium(group: THREE.Group) {
  group.userData.roomOneMemoryMansion = true;

  const gold = brassMaterial();
  const wax = candleWaxMaterial();

  buildShell(group);
  buildCeiling(group, gold);
  buildFireplaceWall(group, gold);
  buildWindows(group);
  buildEntryDesk(group, gold);
  buildParkCorner(group);
  buildGiftTable(group, gold);
  buildMemoryWall(group, gold);
  buildViolinVitrine(group, gold);
  buildMusicCabinet(group, gold);
  buildFloorPuzzle(group, gold);
  buildPyeongsangBench(group);
  buildBeefBoard(group, gold);
  buildAmusementPainting(group);
  buildSteakTable(group, gold, wax);
  buildExitDoor(group, gold);
  buildLighting(group);
}

function buildShell(group: THREE.Group) {
  const floor = box(14.4, 0.24, 10.2, sharedMaterials.floor, 0, -0.12, 0.2);
  floor.receiveShadow = true;
  group.add(floor);

  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.03, 3.1),
    new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.9, metalness: 0, envMapIntensity: 0.3 }),
  );
  rug.position.set(0, 0.028, 0.35);
  rug.receiveShadow = true;
  group.add(rug);

  const walls: { w: number; h: number; x: number; z: number; ry: number }[] = [
    { w: 14.6, h: 5.6, x: 0, z: -4.75, ry: 0 },
    { w: 10.4, h: 5.6, x: -7.25, z: 0.2, ry: Math.PI / 2 },
    { w: 10.4, h: 5.6, x: 7.25, z: 0.2, ry: -Math.PI / 2 },
  ];
  const damask = sharedMaterials.damask;
  const walnut = sharedMaterials.walnut;
  const trim = brassMaterial(0x241503);

  walls.forEach(({ w, h, x, z, ry }) => {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(x, 0, z);
    wallGroup.rotation.y = ry;

    const upper = box(w, h - 1.42, 0.14, damask, 0, 1.42 + (h - 1.42) / 2, 0);
    upper.receiveShadow = true;
    const dado = box(w, 1.42, 0.2, walnut, 0, 0.71, 0.02);
    dado.receiveShadow = true;
    const dadoRail = box(w, 0.09, 0.26, walnut, 0, 1.46, 0.03);
    const goldRail = box(w, 0.022, 0.27, trim, 0, 1.52, 0.032);
    const base = box(w, 0.24, 0.24, walnut, 0, 0.12, 0.04);
    const crown = box(w, 0.3, 0.3, walnut, 0, h - 0.15, 0.02);
    const crownGold = box(w, 0.03, 0.31, trim, 0, h - 0.32, 0.03);
    wallGroup.add(upper, dado, dadoRail, goldRail, base, crown, crownGold);

    // 웨인스코팅 패널 몰딩
    const panels = Math.round(w / 1.9);
    for (let i = 0; i < panels; i += 1) {
      const px = -w / 2 + (w / panels) * (i + 0.5);
      const pw = (w / panels) * 0.72;
      wallGroup.add(box(pw, 0.02, 0.03, trim, px, 1.28, 0.13));
      wallGroup.add(box(pw, 0.02, 0.03, trim, px, 0.34, 0.13));
      wallGroup.add(box(0.02, 0.96, 0.03, trim, px - pw / 2, 0.81, 0.13));
      wallGroup.add(box(0.02, 0.96, 0.03, trim, px + pw / 2, 0.81, 0.13));
    }

    // 상부 벽 픽처 몰딩
    const bays = Math.round(w / 2.4);
    for (let i = 0; i < bays; i += 1) {
      const px = -w / 2 + (w / bays) * (i + 0.5);
      const pw = (w / bays) * 0.66;
      const py = 1.62 + (h - 1.42 - 0.9) / 2;
      const ph = h - 1.42 - 1.3;
      wallGroup.add(box(pw, 0.02, 0.025, trim, px, py + ph / 2, 0.09));
      wallGroup.add(box(pw, 0.02, 0.025, trim, px, py - ph / 2, 0.09));
      wallGroup.add(box(0.02, ph, 0.025, trim, px - pw / 2, py, 0.09));
      wallGroup.add(box(0.02, ph, 0.025, trim, px + pw / 2, py, 0.09));
    }

    group.add(wallGroup);
  });

  // 후면 벽 기둥 (플루티드 필라스터)
  [-5.9, -3.55, 0.95, 2.35, 5.05].forEach((x) => {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 4.6, 20), sharedMaterials.marble);
    column.position.set(x, 2.3, -4.5);
    column.castShadow = true;
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.17, 0.22, 20), brassMaterial());
    capital.position.set(x, 4.62, -4.5);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), sharedMaterials.walnut);
    plinth.position.set(x, 0.15, -4.5);
    group.add(column, capital, plinth);
  });
}

function buildCeiling(group: THREE.Group, gold: THREE.Material) {
  const plaster = new THREE.MeshStandardMaterial({ color: 0x2b2126, roughness: 0.9, envMapIntensity: 0.3 });
  const beamMaterial = sharedMaterials.walnut;
  const ceiling = box(14.6, 0.2, 10.4, plaster, 0, 5.32, 0.2);
  group.add(ceiling);

  for (let i = 0; i < 6; i += 1) {
    group.add(box(0.3, 0.26, 10.2, beamMaterial, -6.1 + i * 2.44, 5.14, 0.2));
  }
  for (let i = 0; i < 5; i += 1) {
    group.add(box(14.2, 0.26, 0.3, beamMaterial, 0, 5.14, -4.2 + i * 2.2));
  }

  // 중앙 시링 메달리온 + 샹들리에
  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.08, 36), plaster);
  medallion.position.set(0, 5.06, -0.3);
  const medallionRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.03, 10, 40), gold);
  medallionRing.position.set(0, 5.02, -0.3);
  medallionRing.rotation.x = Math.PI / 2;
  group.add(medallion, medallionRing);

  const chandelier = new THREE.Group();
  chandelier.position.set(0, 4.05, -0.3);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.0, 12), gold);
  stem.position.y = 0.62;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), gold);
  chandelier.add(stem, bowl);
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0.34, -0.06, 0),
    new THREE.Vector3(0.62, 0.06, 0),
    new THREE.Vector3(0.78, 0.3, 0),
  ]);
  const armGeometry = new THREE.TubeGeometry(armCurve, 16, 0.022, 8);
  for (let i = 0; i < 8; i += 1) {
    const arm = new THREE.Mesh(armGeometry, gold);
    arm.rotation.y = (i / 8) * Math.PI * 2;
    chandelier.add(arm);
    const angle = (i / 8) * Math.PI * 2;
    const cx = Math.cos(angle) * 0.78;
    const cz = Math.sin(angle) * 0.78;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.032, 0.06, 12), gold);
    cup.position.set(cx, 0.32, cz);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.2, 10), candleWaxMaterial());
    candle.position.set(cx, 0.45, cz);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), flameMaterial());
    flame.position.set(cx, 0.58, cz);
    flame.scale.set(0.8, 1.5, 0.8);
    flame.userData.statusLight = true;
    chandelier.add(cup, candle, flame);
  }
  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfdf6e8,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.5,
    envMapIntensity: 1.1,
  });
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), crystalMaterial);
    drop.position.set(Math.cos(angle) * 0.5, 0.06 - (i % 3) * 0.08, Math.sin(angle) * 0.5);
    drop.userData.float = true;
    chandelier.add(drop);
  }
  group.add(chandelier);
}

function buildFireplaceWall(group: THREE.Group, gold: THREE.Material) {
  // 전면(입구 뒤) 벽 — 대리석 벽난로와 책장.
  const wall = new THREE.Group();
  wall.position.set(0, 0, 5.3);
  wall.rotation.y = Math.PI;
  const damask = sharedMaterials.damask;
  const walnut = sharedMaterials.walnut;
  wall.add(box(14.6, 4.2, 0.14, damask, 0, 3.5 - 1.4, 0));
  wall.add(box(14.6, 1.42, 0.2, walnut, 0, 0.71, 0.02));
  wall.add(box(14.6, 0.24, 0.24, walnut, 0, 0.12, 0.04));
  wall.add(box(14.6, 0.3, 0.3, walnut, 0, 5.45, 0.02));
  group.add(wall);

  const fire = new THREE.Group();
  fire.position.set(0.2, 0, 5.08);
  fire.rotation.y = Math.PI;
  const marble = sharedMaterials.marble;
  fire.add(box(2.6, 0.16, 0.6, marble, 0, 1.52, 0));
  fire.add(box(0.34, 1.44, 0.42, marble, -1.05, 0.72, 0));
  fire.add(box(0.34, 1.44, 0.42, marble, 1.05, 0.72, 0));
  fire.add(box(2.2, 0.18, 0.44, marble, 0, 1.35, 0));
  const firebox = box(1.5, 1.16, 0.3, new THREE.MeshStandardMaterial({ color: 0x0a0605, roughness: 0.95 }), 0, 0.62, 0.02);
  fire.add(firebox);
  const emberGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0xff9440,
      emissive: 0xff7a24,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.85,
    }),
  );
  emberGlow.position.set(0, 0.55, 0.18);
  emberGlow.userData.statusLight = true;
  fire.add(emberGlow);
  const logMaterial = new THREE.MeshStandardMaterial({ color: 0x2e1a0c, roughness: 0.9 });
  [-0.3, 0.1, 0.4].forEach((x, i) => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.8, 10), logMaterial);
    log.position.set(x, 0.24 + i * 0.1, 0.14);
    log.rotation.z = Math.PI / 2 + (i - 1) * 0.24;
    fire.add(log);
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), new THREE.MeshStandardMaterial({
    color: 0x1c1208,
    roughness: 0.4,
    metalness: 0.8,
    transparent: true,
    opacity: 0.32,
  }));
  screen.position.set(0, 0.6, 0.34);
  fire.add(screen);
  const mantelClock = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 24), gold);
  mantelClock.position.set(-0.5, 1.78, 0);
  mantelClock.rotation.x = Math.PI / 2;
  const clockBase = box(0.4, 0.06, 0.2, sharedMaterials.walnut, -0.5, 1.62, 0);
  fire.add(mantelClock, clockBase);
  [-0.95, 0.15, 0.85].forEach((x, i) => {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.26 + (i % 2) * 0.1, 10), candleWaxMaterial());
    candle.position.set(x, 1.76 + (i % 2) * 0.05, 0);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), flameMaterial());
    flame.position.set(x, 1.94 + (i % 2) * 0.1, 0);
    flame.scale.set(0.8, 1.5, 0.8);
    flame.userData.statusLight = true;
    fire.add(candle, flame);
  });
  group.add(fire);

  const fireLight = new THREE.PointLight(0xff8e3c, 1.6, 6.4);
  fireLight.position.set(0.2, 1.0, 4.4);
  fireLight.userData.statusLight = true;
  group.add(fireLight);

  // 벽난로 양옆 책장
  [-2.9, 3.3].forEach((x, side) => {
    const shelf = new THREE.Group();
    shelf.position.set(x, 0, 5.02);
    shelf.rotation.y = Math.PI;
    shelf.add(box(1.9, 3.6, 0.4, sharedMaterials.walnut, 0, 1.8, 0));
    const bookColors = [0x5c2430, 0x24424a, 0x6a5320, 0x30273f, 0x5a3a22, 0x203a30];
    for (let level = 0; level < 4; level += 1) {
      shelf.add(box(1.7, 0.04, 0.34, brassMaterial(0x120b02), 0, 0.6 + level * 0.78, 0.02));
      let bx = -0.74;
      let guard = 0;
      while (bx < 0.68 && guard < 24) {
        guard += 1;
        const bw = 0.08 + ((level * 7 + guard * 3 + side) % 4) * 0.02;
        const bh = 0.5 + ((guard + level) % 3) * 0.08;
        const book = box(bw, bh, 0.3, new THREE.MeshStandardMaterial({
          color: bookColors[(guard + level * 2 + side) % bookColors.length],
          roughness: 0.78,
        }), bx + bw / 2, 0.62 + level * 0.78 + bh / 2, 0.02);
        book.rotation.z = (guard % 5 === 0 ? -0.06 : 0);
        shelf.add(book);
        bx += bw + 0.012;
      }
    }
    group.add(shelf);
  });
}

function buildWindows(group: THREE.Group) {
  // 왼쪽 벽 — 달빛 아치창 두 개와 벨벳 커튼.
  [-1.6, 2.4].forEach((z) => {
    const win = new THREE.Group();
    win.position.set(-7.14, 0, z);
    win.rotation.y = Math.PI / 2;

    const frame = sharedMaterials.walnut;
    win.add(box(1.5, 0.12, 0.24, frame, 0, 1.06, 0));
    win.add(box(0.12, 2.5, 0.24, frame, -0.72, 2.3, 0));
    win.add(box(0.12, 2.5, 0.24, frame, 0.72, 2.3, 0));
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.06, 10, 24, Math.PI), frame);
    arch.position.set(0, 3.54, 0);
    win.add(arch);

    const glassShape = new THREE.Shape();
    glassShape.moveTo(-0.66, 0);
    glassShape.lineTo(-0.66, 2.42);
    glassShape.absarc(0, 2.42, 0.66, Math.PI, 0, true);
    glassShape.lineTo(0.66, 0);
    glassShape.closePath();
    const glass = new THREE.Mesh(
      new THREE.ShapeGeometry(glassShape, 24),
      new THREE.MeshStandardMaterial({
        color: 0x9cc4e4,
        emissive: 0x7fb2d8,
        emissiveIntensity: 0.16,
        transparent: true,
        opacity: 0.7,
        roughness: 0.3,
      }),
    );
    glass.position.set(0, 1.12, -0.02);
    glass.userData.statusLight = true;
    win.add(glass);

    const muntin = brassMaterial(0x120b02);
    win.add(box(1.32, 0.035, 0.05, muntin, 0, 2.2, 0.02));
    win.add(box(1.32, 0.035, 0.05, muntin, 0, 3.0, 0.02));
    win.add(box(0.035, 2.6, 0.05, muntin, 0, 2.4, 0.02));

    // 달 원판
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.2, 26), new THREE.MeshBasicMaterial({ color: 0xf6fbff }));
    moon.position.set(0.22, 3.32, -0.06);
    win.add(moon);

    // 커튼
    const curtainMaterial = velvetMaterial(0x4c1c2a);
    [-1.06, 1.06].forEach((cx) => {
      const curtainPoints: THREE.Vector2[] = [];
      for (let s = 0; s <= 8; s += 1) {
        curtainPoints.push(new THREE.Vector2(0.2 + Math.sin(s * 1.4) * 0.05 + s * 0.008, (s / 8) * 4.0));
      }
      const curtain = new THREE.Mesh(new THREE.LatheGeometry(curtainPoints, 12, 0, Math.PI), curtainMaterial);
      curtain.position.set(cx, 0.16, 0.08);
      curtain.rotation.y = cx < 0 ? Math.PI / 2 : -Math.PI / 2;
      curtain.scale.set(1, 1, 0.55);
      win.add(curtain);
      const tieback = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 8, 20), brassMaterial());
      tieback.position.set(cx, 1.5, 0.14);
      tieback.rotation.y = Math.PI / 2;
      win.add(tieback);
    });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 10), brassMaterial());
    rod.position.set(0, 4.2, 0.1);
    rod.rotation.z = Math.PI / 2;
    win.add(rod);

    group.add(win);

    const moonLight = new THREE.PointLight(0x9fd0f0, 0.78, 7.0);
    moonLight.position.set(-6.2, 2.6, z);
    group.add(moonLight);
  });
}

function buildEntryDesk(group: THREE.Group, gold: THREE.Material) {
  // 현수의 안내 책상 — station-entry-desk (-4.55, 1.22)
  const desk = new THREE.Group();
  desk.position.set(-4.55, 0, 1.22);
  desk.rotation.y = -0.1;
  const top = box(1.9, 0.09, 0.9, sharedMaterials.walnut, 0, 0.78, 0);
  top.castShadow = true;
  const leather = box(1.4, 0.02, 0.6, velvetMaterial(0x1d3a2c), 0, 0.835, 0);
  desk.add(top, leather);
  const apron = box(1.74, 0.14, 0.74, sharedMaterials.walnut, 0, 0.68, 0);
  desk.add(apron);
  [-0.78, 0.78].forEach((x) => {
    [-0.3, 0.3].forEach((z) => {
      const leg = turnedLeg(sharedMaterials.walnut, 0.62, 0.07);
      leg.position.set(x, 0, z);
      desk.add(leg);
    });
  });
  const letter = box(0.5, 0.014, 0.34, new THREE.MeshStandardMaterial({ color: 0xf2e6cc, roughness: 0.9 }), -0.3, 0.85, 0.06);
  letter.rotation.y = -0.2;
  const inkwell = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.09, 14), gold);
  inkwell.position.set(0.55, 0.9, -0.16);
  const quill = box(0.4, 0.01, 0.02, new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.8 }), 0.36, 0.87, 0.12);
  quill.rotation.y = 0.7;
  quill.rotation.z = 0.08;
  desk.add(letter, inkwell, quill);

  // 초록 갓 책상 램프
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.05, 18), gold);
  lampBase.position.set(-0.62, 0.86, -0.2);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), gold);
  lampStem.position.set(-0.62, 1.04, -0.2);
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.24, 0.16, 20, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0x1c5240,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x0f3a2c,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide,
    }),
  );
  lampShade.position.set(-0.62, 1.24, -0.2);
  desk.add(lampBase, lampStem, lampShade);
  group.add(desk);

  const deskLight = new THREE.PointLight(0xa8ffd8, 0.5, 2.4);
  deskLight.position.set(-5.15, 1.3, 1.0);
  group.add(deskLight);

  // 벽의 안내 판 두 장 (금박 액자)
  const noticeBoard = (title: string, body: string, y: number, h: number) => {
    const texture = canvasTexture(`notice-${y}`, 512, Math.round(512 * (h / 1.3)), (ctx) => {
      const height = Math.round(512 * (h / 1.3));
      ctx.fillStyle = "#f0e5cc";
      ctx.fillRect(0, 0, 512, height);
      ctx.strokeStyle = "#8a6a3a";
      ctx.lineWidth = 6;
      ctx.strokeRect(14, 14, 484, height - 28);
      ctx.fillStyle = "#43301a";
      ctx.font = "700 44px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(title, 256, 86);
      ctx.font = "27px Georgia, serif";
      const words = body.split(" ");
      let line = "";
      let ly = 150;
      for (const word of words) {
        if ((line + word).length > 16) {
          ctx.fillText(line.trim(), 256, ly);
          ly += 42;
          line = "";
        }
        line += `${word} `;
      }
      ctx.fillText(line.trim(), 256, ly);
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.3, h), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 }));
    panel.position.set(-5.05, y, -4.62);
    const frame = giltFrame(1.3, h, 0.05);
    frame.position.set(-5.05, y, -4.65);
    group.add(panel, frame);
  };
  noticeBoard("하영에게", "방탈출을 풀며 우리의 추억을 잘 떠올려봐!!", 2.5, 1.0);
  noticeBoard("규칙", "힌트는 카톡 또는 전화 · 추억을 먼저 관찰하기", 1.35, 0.72);
}

function buildParkCorner(group: THREE.Group) {
  // 잣절공원 야경 벽화 + 실제 공원 벤치 — station-park-bench (-4.28, -2.68)
  const mural = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.66),
    new THREE.MeshStandardMaterial({ map: parkMuralTexture(), roughness: 0.8, emissive: 0x223a52, emissiveIntensity: 0.12 }),
  );
  mural.position.set(-4.3, 2.42, -4.6);
  const muralFrame = giltFrame(2.5, 1.66, 0.06);
  muralFrame.position.set(-4.3, 2.42, -4.63);
  group.add(mural, muralFrame);

  const bench = new THREE.Group();
  bench.position.set(-4.28, 0, -2.68);
  bench.rotation.y = 0.22;
  const benchWood = sharedMaterials.walnut;
  const iron = new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.5, metalness: 0.6 });
  for (let s = 0; s < 4; s += 1) {
    bench.add(box(1.66, 0.045, 0.1, benchWood, 0, 0.5, -0.16 + s * 0.11));
  }
  for (let s = 0; s < 3; s += 1) {
    const slat = box(1.66, 0.1, 0.045, benchWood, 0, 0.72 + s * 0.14, -0.28 - s * 0.055);
    slat.rotation.x = -0.28;
    bench.add(slat);
  }
  [-0.74, 0.74].forEach((x) => {
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0.02, 0.2),
      new THREE.Vector3(x, 0.3, 0.22),
      new THREE.Vector3(x, 0.52, 0.05),
      new THREE.Vector3(x, 0.52, -0.2),
      new THREE.Vector3(x, 1.02, -0.42),
    ]);
    const leg = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 12, 0.03, 8), iron);
    bench.add(leg);
    const foot = box(0.1, 0.04, 0.3, iron, x, 0.02, 0.06);
    bench.add(foot);
  });
  group.add(bench);

  // 가로등
  const lampPost = new THREE.Group();
  lampPost.position.set(-5.5, 0, -3.3);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x171a1e, roughness: 0.45, metalness: 0.6 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 2.6, 12), postMaterial);
  post.position.y = 1.3;
  const lampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 6), postMaterial);
  lampHead.position.y = 2.72;
  const lampGlassMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe1a8,
    emissive: 0xffc670,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.92,
  });
  const lampGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.22, 6), lampGlassMaterial);
  lampGlass.position.y = 2.68;
  lampGlass.userData.statusLight = true;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.16, 6), postMaterial);
  cap.position.y = 2.94;
  lampPost.add(post, lampHead, lampGlass, cap);
  group.add(lampPost);
  const parkLight = new THREE.PointLight(0xffc670, 1.35, 4.6);
  parkLight.position.set(-5.5, 2.6, -3.2);
  group.add(parkLight);

  // 화분 두 개
  [-3.3, -5.9].forEach((x, i) => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.34, 16), sharedMaterials.marble);
    pot.position.set(x, 0.17, -4.1 + (i % 2) * 0.3);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshStandardMaterial({ color: 0x1e3a26, roughness: 0.9 }));
    bush.position.set(x, 0.56, -4.1 + (i % 2) * 0.3);
    bush.scale.y = 1.2;
    group.add(pot, bush);
  });
}

function buildGiftTable(group: THREE.Group, gold: THREE.Material) {
  // 생일 선물 원탁 — station-gift-table (-2.76, 1.24)
  const table = new THREE.Group();
  table.position.set(-2.76, 0, 1.24);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.07, 34), sharedMaterials.walnut);
  top.position.y = 0.78;
  top.castShadow = true;
  const cloth = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.03, 30), velvetMaterial(0x4c1c2a));
  cloth.position.y = 0.825;
  const stem = turnedLeg(sharedMaterials.walnut, 0.74, 0.13);
  stem.position.set(0, 0.02, 0);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.07, 26), sharedMaterials.walnut);
  foot.position.y = 0.04;
  table.add(top, cloth, stem, foot);

  const wrapGreen = new THREE.MeshStandardMaterial({ color: 0x2e7a4c, roughness: 0.55 });
  const wrapPink = new THREE.MeshStandardMaterial({ color: 0xd88ab8, roughness: 0.55 });
  const paperBag = new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.8 });
  const black = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.4, metalness: 0.15 });

  const giftA = box(0.34, 0.3, 0.3, wrapGreen, -0.34, 1.0, -0.08);
  giftA.rotation.y = 0.3;
  const ribbonAv = box(0.05, 0.32, 0.32, gold, -0.34, 1.0, -0.08);
  ribbonAv.rotation.y = 0.3;
  const giftB = box(0.44, 0.2, 0.3, wrapPink, 0.24, 0.95, 0.2);
  giftB.rotation.y = -0.24;
  const ribbonBv = box(0.46, 0.22, 0.05, gold, 0.24, 0.95, 0.2);
  ribbonBv.rotation.y = -0.24;
  const bag = box(0.32, 0.4, 0.16, paperBag, 0.36, 1.05, -0.3);
  bag.rotation.y = 0.5;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 20, Math.PI), gold);
  handle.position.set(0.36, 1.27, -0.3);
  handle.rotation.y = 0.5;
  const pen = box(0.5, 0.07, 0.12, black, -0.05, 0.88, 0.42);
  pen.rotation.y = 0.16;
  const envelope = box(0.4, 0.016, 0.28, new THREE.MeshStandardMaterial({ color: 0xf6ecd6, roughness: 0.85 }), -0.12, 0.87, 0.08);
  envelope.rotation.y = -0.14;
  const seal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.016, 18),
    new THREE.MeshStandardMaterial({ color: 0x8e2432, roughness: 0.4, emissive: 0x3a0a10, emissiveIntensity: 0.4 }),
  );
  seal.position.set(-0.07, 0.885, 0.11);
  table.add(giftA, ribbonAv, giftB, ribbonBv, bag, handle, pen, envelope, seal);

  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.3, 12), candleWaxMaterial());
  candle.position.set(-0.05, 1.0, -0.42);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), flameMaterial());
  flame.position.set(-0.05, 1.2, -0.42);
  flame.scale.set(0.8, 1.5, 0.8);
  flame.userData.statusLight = true;
  table.add(candle, flame);
  group.add(table);

  const giftLight = new THREE.PointLight(0xffd9a0, 0.85, 3.2);
  giftLight.position.set(-2.76, 1.9, 1.24);
  group.add(giftLight);

  // 픽업 키링 (액자 퍼즐 해결 전까지 표시) — roomOnePickupKeyring
  const keyringViolin = new THREE.Group();
  keyringViolin.position.set(-2.48, 1.04, 0.9);
  keyringViolin.rotation.set(-0.5, -0.5, 0.06);
  keyringViolin.scale.setScalar(0.7);
  keyringViolin.userData.roomOnePickupKeyring = true;
  const violinBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), sharedMaterials.walnut);
  violinBody.scale.set(1.1, 0.62, 0.3);
  const violinUpper = violinBody.clone();
  violinUpper.scale.set(0.86, 0.46, 0.26);
  violinUpper.position.y = 0.24;
  const neck = box(0.06, 0.4, 0.04, new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 0.4 }), 0, 0.5, 0.01);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 8, 22), gold);
  ring.position.set(-0.3, 0.24, 0);
  keyringViolin.add(violinBody, violinUpper, neck, ring);
  group.add(keyringViolin);
}

function buildMemoryWall(group: THREE.Group, gold: THREE.Material) {
  // 기억의 액자 벽 — station-memory-wall (-2.24, -2.98)
  const photoByKey: Record<string, string> = {};
  memoryFrames.forEach((frame) => {
    if (frame.image) {
      photoByKey[frame.key] = frame.image;
    }
  });
  const exhibits = [
    { key: "jatjeol", x: -2.86, y: 2.62 },
    { key: "birthday", x: -1.6, y: 2.62 },
    { key: "philippines", x: -2.86, y: 1.56 },
    { key: "hongdae", x: -1.6, y: 1.56 },
  ];
  exhibits.forEach((exhibit, index) => {
    const photoPath = photoByKey[exhibit.key];
    const material = photoPath
      ? new THREE.MeshStandardMaterial({ map: photoCoverTexture(photoPath, 0.94 / 0.7), roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.03 })
      : new THREE.MeshStandardMaterial({ color: 0x18120c, roughness: 0.8 });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.7), material);
    photo.position.set(exhibit.x, exhibit.y, -4.6);
    photo.userData.memoryFrameKey = exhibit.key === "hongdae" ? "hundred-day" : exhibit.key;
    photo.userData.memoryFrameOrder = index;
    const frame = giltFrame(0.94, 0.7, 0.06);
    frame.position.set(exhibit.x, exhibit.y, -4.63);
    group.add(photo, frame);

    // 픽처 라이트
    const lightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8), gold);
    lightArm.position.set(exhibit.x, exhibit.y + 0.52, -4.56);
    lightArm.rotation.x = 0.7;
    const lightBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10), gold);
    lightBar.position.set(exhibit.x, exhibit.y + 0.6, -4.48);
    lightBar.rotation.z = Math.PI / 2;
    group.add(lightArm, lightBar);
    const pictureLight = new THREE.PointLight(0xffe0b0, 0.42, 1.6);
    pictureLight.position.set(exhibit.x, exhibit.y + 0.5, -4.3);
    group.add(pictureLight);
  });

  // 색상 버튼 대리석 콘솔
  const console = new THREE.Group();
  console.position.set(-2.24, 0, -2.98);
  const consoleTop = box(2.3, 0.09, 0.62, sharedMaterials.marble, 0, 0.86, 0);
  consoleTop.castShadow = true;
  const apron = box(2.14, 0.12, 0.5, sharedMaterials.walnut, 0, 0.76, 0);
  console.add(consoleTop, apron);
  [-0.95, 0.95].forEach((x) => {
    [-0.18, 0.18].forEach((z) => {
      const leg = turnedLeg(sharedMaterials.walnut, 0.72, 0.06);
      leg.position.set(x, 0, z);
      console.add(leg);
    });
  });
  const buttonColors = [0xf2c14e, 0x6fc775, 0x6fb2e8, 0xe86f84];
  buttonColors.forEach((color, index) => {
    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.05, 24), gold);
    bezel.position.set(-0.63 + index * 0.42, 0.92, 0);
    const button = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.24,
      }),
    );
    button.position.set(-0.63 + index * 0.42, 0.93, 0);
    console.add(bezel, button);
  });
  group.add(console);
}

function buildViolinVitrine(group: THREE.Group, gold: THREE.Material) {
  // 바이올린 유리 진열장 — station-violin-case (0.08, -3.15)
  const vitrine = new THREE.Group();
  vitrine.position.set(0.08, 0, -3.85);

  const pedestal = box(0.9, 1.0, 0.9, sharedMaterials.marble, 0, 0.5, 0);
  pedestal.castShadow = true;
  const pedestalTrim = box(0.98, 0.07, 0.98, sharedMaterials.walnut, 0, 1.02, 0);
  vitrine.add(pedestal, pedestalTrim);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdcedf6,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.12,
    envMapIntensity: 0.7,
  });
  const glass = box(0.74, 1.05, 0.74, glassMaterial, 0, 1.6, 0);
  vitrine.add(glass);
  [
    [-0.37, -0.37],
    [-0.37, 0.37],
    [0.37, -0.37],
    [0.37, 0.37],
  ].forEach(([gx, gz]) => {
    vitrine.add(box(0.035, 1.05, 0.035, gold, gx, 1.6, gz));
  });
  vitrine.add(box(0.8, 0.045, 0.8, gold, 0, 2.14, 0));
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), gold);
  finial.position.set(0, 2.2, 0);
  vitrine.add(finial);

  // 바이올린 인형 — roomOneViolinDoll
  const doll = new THREE.Group();
  doll.position.set(0, 1.32, 0);
  doll.userData.roomOneViolinDoll = true;
  const dollBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.34, 16), velvetMaterial(0x35234a));
  dollBody.position.y = 0.17;
  const dollHead = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf2d9bc, roughness: 0.7 }));
  dollHead.position.y = 0.44;
  const dollHair = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.85 }));
  dollHair.position.y = 0.46;
  const violinBody = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), sharedMaterials.walnut);
  violinBody.scale.set(1.1, 0.6, 0.3);
  violinBody.position.set(0.12, 0.3, 0.08);
  violinBody.rotation.z = 0.5;
  const violinNeck = box(0.04, 0.24, 0.03, new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 0.4 }), 0.2, 0.42, 0.08);
  violinNeck.rotation.z = 0.5;
  const bow = box(0.3, 0.012, 0.012, gold, -0.1, 0.34, 0.12);
  bow.rotation.z = -0.4;
  // 비어 있는 키링 고리
  const emptyHook = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 16), gold);
  emptyHook.position.set(-0.11, 0.16, 0.08);
  doll.add(dollBody, dollHead, dollHair, violinBody, violinNeck, bow, emptyHook);
  vitrine.add(doll);

  // 장착된 키링 (해결 후 표시) — roomOneCaseKeyring
  const attachedKeyring = new THREE.Group();
  attachedKeyring.position.set(-0.11, 1.4, 0.1);
  attachedKeyring.visible = false;
  attachedKeyring.userData.roomOneCaseKeyring = true;
  const kr = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 18), gold);
  const miniViolin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), sharedMaterials.walnut);
  miniViolin.scale.set(1.1, 0.6, 0.3);
  miniViolin.position.y = -0.08;
  attachedKeyring.add(kr, miniViolin);
  vitrine.add(attachedKeyring);

  const vitrineLight = new THREE.PointLight(0xfff0d0, 0.8, 2.4);
  vitrineLight.position.set(0, 2.0, 0.4);
  vitrine.add(vitrineLight);
  group.add(vitrine);
}

function buildMusicCabinet(group: THREE.Group, gold: THREE.Material) {
  // 오르골 캐비닛 — station-music-cabinet (1.42, -2.76)
  const cabinet = new THREE.Group();
  cabinet.position.set(1.42, 0, -2.96);
  const body = box(1.24, 0.86, 0.62, sharedMaterials.walnut, 0, 0.47, 0);
  body.castShadow = true;
  const topSlab = box(1.32, 0.06, 0.68, sharedMaterials.marble, 0, 0.93, 0);
  cabinet.add(body, topSlab);
  [-0.31, 0.31].forEach((x) => {
    cabinet.add(box(0.5, 0.5, 0.03, sharedMaterials.walnut, x, 0.47, 0.32));
    cabinet.add(box(0.4, 0.4, 0.015, gold, x, 0.47, 0.335));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), gold);
    knob.position.set(x + 0.16, 0.47, 0.35);
    cabinet.add(knob);
  });
  [-0.56, 0.56].forEach((x) => {
    [-0.24, 0.24].forEach((z) => {
      const leg = turnedLeg(sharedMaterials.walnut, 0.16, 0.045);
      leg.position.set(x, -0.06, z);
      cabinet.add(leg);
    });
  });

  // 오르골 본체 + 회전목마 (획득 전 표시) — roomOneCabinetCarousel
  const musicBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.12, 28), gold);
  musicBase.position.set(0, 1.02, 0);
  cabinet.add(musicBase);
  const carousel = new THREE.Group();
  carousel.position.set(0, 1.08, 0);
  carousel.userData.roomOneCabinetCarousel = true;
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 24), gold);
  platform.position.y = 0.02;
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.16, 24), velvetMaterial(0x4c1c2a));
  canopy.position.y = 0.4;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8), gold);
  pole.position.y = 0.2;
  carousel.add(platform, canopy, pole);
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const horsePole = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.3, 6), gold);
    horsePole.position.set(Math.cos(angle) * 0.15, 0.19, Math.sin(angle) * 0.15);
    const horse = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.02), velvetMaterial(i % 2 ? 0xc9a14e : 0xe8e4da));
    horse.position.set(Math.cos(angle) * 0.15, 0.14 + (i % 2) * 0.03, Math.sin(angle) * 0.15);
    horse.rotation.y = -angle;
    carousel.add(horsePole, horse);
  }
  cabinet.add(carousel);
  group.add(cabinet);
}

function buildFloorPuzzle(group: THREE.Group, gold: THREE.Material) {
  // 3×3 대리석 타일 — station-floor-grid (0, 0.4)
  const border = box(3.1, 0.035, 3.1, sharedMaterials.walnut, 0, 0.055, 0.08);
  border.receiveShadow = true;
  group.add(border);

  for (let cell = 1; cell <= 9; cell += 1) {
    const row = Math.floor((cell - 1) / 3);
    const col = (cell - 1) % 3;
    const tileMaterial = new THREE.MeshPhysicalMaterial({
      map: tileNumberTexture(cell),
      roughness: 0.4,
      clearcoat: 0.26,
      clearcoatRoughness: 0.34,
      emissive: cell === 9 ? 0x553311 : 0x000000,
      emissiveIntensity: cell === 9 ? 0.13 : 0,
      envMapIntensity: 0.4,
    });
    const tile = box(0.84, 0.045, 0.84, tileMaterial, -0.86 + col * 0.86, 0.095, -0.78 + row * 0.86);
    tile.userData.floorPuzzleCell = cell;
    group.add(tile);
    group.add(box(0.9, 0.014, 0.03, gold, tile.position.x, 0.115, tile.position.z - 0.44));
    group.add(box(0.9, 0.014, 0.03, gold, tile.position.x, 0.115, tile.position.z + 0.44));
    group.add(box(0.03, 0.014, 0.9, gold, tile.position.x - 0.44, 0.115, tile.position.z));
    group.add(box(0.03, 0.014, 0.9, gold, tile.position.x + 0.44, 0.115, tile.position.z));
  }
}

function buildPyeongsangBench(group: THREE.Group) {
  // 구로평상 — roomOnePyeongsangBench (0.05, 2.08) → 정답 시 9번 칸 위로 이동
  const bench = new THREE.Group();
  bench.position.set(0.05, 0.42, 2.08);
  bench.userData.roomOnePyeongsangBench = true;
  const woodLight = new THREE.MeshStandardMaterial({ color: 0x9a7648, roughness: 0.7 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x7a5a34, roughness: 0.75 });
  for (let s = 0; s < 5; s += 1) {
    bench.add(box(1.5, 0.045, 0.15, s % 2 ? woodLight : woodDark, 0, 0, -0.32 + s * 0.16));
  }
  bench.add(box(1.56, 0.05, 0.06, woodDark, 0, 0, -0.4));
  bench.add(box(1.56, 0.05, 0.06, woodDark, 0, 0, 0.4));
  [-0.62, 0.62].forEach((x) => {
    [-0.28, 0.28].forEach((z) => {
      bench.add(box(0.09, 0.4, 0.09, woodDark, x, -0.22, z));
    });
  });
  group.add(bench);
}

function buildBeefBoard(group: THREE.Group, gold: THREE.Material) {
  // 소 부위 문제판 — station-beef-wall (2.6, -3.15)
  const chart = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.56),
    new THREE.MeshStandardMaterial({ map: beefChartTexture(), roughness: 0.8 }),
  );
  chart.position.set(2.6, 2.2, -4.6);
  const frame = giltFrame(2.5, 1.56, 0.06);
  frame.position.set(2.6, 2.2, -4.63);
  group.add(chart, frame);

  const salchisalMarker = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.024, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0xff6a5a, emissive: 0xff5040, emissiveIntensity: 0.8, transparent: true, opacity: 0.94 }),
  );
  salchisalMarker.position.set(2.28, 2.42, -4.56);
  salchisalMarker.userData.roomOneSalchisalMarker = true;
  salchisalMarker.visible = false;
  group.add(salchisalMarker);

  // 고기 조각 선반
  const shelf = new THREE.Group();
  shelf.position.set(2.6, 0, -4.24);
  const slab = box(1.8, 0.06, 0.4, sharedMaterials.marble, 0, 1.06, 0);
  shelf.add(slab);
  [-0.7, 0.7].forEach((x) => {
    const bracket = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 16, Math.PI / 2), gold);
    bracket.position.set(x, 0.94, 0.14);
    bracket.rotation.set(0, Math.PI / 2, Math.PI);
    shelf.add(bracket);
  });
  const meatMaterial = new THREE.MeshStandardMaterial({ color: 0x9c3a2c, roughness: 0.5, emissive: 0x33100a, emissiveIntensity: 0.2 });
  [-0.5, 0, 0.5].forEach((x, i) => {
    const piece = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), meatMaterial);
    piece.scale.set(1.3, 0.42, 0.8);
    piece.position.set(x, 1.14, 0);
    piece.rotation.y = i;
    shelf.add(piece);
  });
  group.add(shelf);
}

function buildAmusementPainting(group: THREE.Group) {
  // 놀이공원 유화 — station-carousel-painting (3.92, -3.15)
  const painting = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.14),
    new THREE.MeshStandardMaterial({ map: amusementPaintingTexture(), roughness: 0.7, emissive: 0x2a2040, emissiveIntensity: 0.16 }),
  );
  painting.position.set(4.6, 2.9, -4.6);
  const frame = giltFrame(2.2, 1.14, 0.07);
  frame.position.set(4.6, 2.9, -4.63);
  group.add(painting, frame);

  // 그림에 끼워지는 회전목마 (해결 후 표시)
  const inPainting = new THREE.Group();
  inPainting.position.set(4.15, 2.72, -4.52);
  inPainting.visible = false;
  inPainting.userData.roomOnePaintingCarousel = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.05, 20), brassMaterial());
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 20), new THREE.MeshStandardMaterial({
    color: 0xffb77a,
    emissive: 0xff8a3b,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  }));
  body.position.y = 0.1;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.1, 20), brassMaterial());
  cap.position.y = 0.22;
  inPainting.add(base, body, cap);
  group.add(inPainting);

  const paintingLight = new THREE.PointLight(0xd8c2ff, 0.5, 2.6);
  paintingLight.position.set(4.6, 2.9, -4.0);
  group.add(paintingLight);
}

function buildSteakTable(group: THREE.Group, gold: THREE.Material, wax: THREE.Material) {
  // 촛불 스테이크 테이블 — station-steak-table (3.58, 1.38)
  const table = new THREE.Group();
  table.position.set(3.58, 0, 1.38);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 34), sharedMaterials.walnut);
  top.position.y = 0.76;
  top.castShadow = true;
  // 흘러내리는 테이블보
  const clothPoints: THREE.Vector2[] = [];
  clothPoints.push(new THREE.Vector2(0, 0));
  clothPoints.push(new THREE.Vector2(0.94, 0));
  clothPoints.push(new THREE.Vector2(0.98, -0.04));
  clothPoints.push(new THREE.Vector2(1.0, -0.3));
  const cloth = new THREE.Mesh(
    new THREE.LatheGeometry(clothPoints, 34),
    new THREE.MeshStandardMaterial({ color: 0xf3ecdd, roughness: 0.85, side: THREE.DoubleSide }),
  );
  cloth.position.y = 0.8;
  const stem = turnedLeg(sharedMaterials.walnut, 0.72, 0.14);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.07, 28), sharedMaterials.walnut);
  foot.position.y = 0.035;
  table.add(top, cloth, stem, foot);

  const plateMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf4efe4, roughness: 0.3, clearcoat: 0.4, envMapIntensity: 0.55 });
  const steakMaterial = new THREE.MeshStandardMaterial({ color: 0x7c3524, roughness: 0.42, emissive: 0x2a0d06, emissiveIntensity: 0.24 });
  [-0.44, 0.44].forEach((x, index) => {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.028, 30), plateMaterial);
    plate.position.set(x, 0.83, 0.05);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.008, 8, 30), brassMaterial());
    rim.position.set(x, 0.845, 0.05);
    rim.rotation.x = Math.PI / 2;
    const steak = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), steakMaterial);
    steak.scale.set(1.25, 0.32, 0.8);
    steak.position.set(x, 0.87, 0.05);
    steak.rotation.y = index * 0.6;
    const herb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2e5a2e, roughness: 0.8 }));
    herb.position.set(x + 0.05, 0.92, 0.02);
    // A/B 스탠드
    const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), brassMaterial());
    standPole.position.set(x, 0.94, -0.26);
    const plaque = box(0.14, 0.11, 0.015, brassMaterial(), x, 1.06, -0.26);
    table.add(plate, rim, steak, herb, standPole, plaque);
  });

  // 촛대
  const candlestick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.09, 0.34, 16), gold);
  candlestick.position.set(0, 0.95, -0.05);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.26, 12), wax);
  candle.position.set(0, 1.24, -0.05);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), flameMaterial());
  flame.position.set(0, 1.42, -0.05);
  flame.scale.set(0.8, 1.6, 0.8);
  flame.userData.roomOneSteakFlame = true;
  table.add(candlestick, candle, flame);
  group.add(table);

  const steakLight = new THREE.PointLight(0xffb46e, 0.55, 2.6);
  steakLight.position.set(3.58, 1.5, 1.3);
  steakLight.userData.roomOneSteakLight = true;
  group.add(steakLight);

  // 의자 두 개
  [-0.9, 0.9].forEach((x) => {
    const chair = new THREE.Group();
    chair.position.set(3.58 + x, 0, 1.45);
    chair.rotation.y = x < 0 ? 0.6 : -0.6;
    chair.add(box(0.44, 0.05, 0.42, sharedMaterials.walnut, 0, 0.46, 0));
    chair.add(box(0.4, 0.04, 0.36, velvetMaterial(0x4c1c2a), 0, 0.49, 0));
    chair.add(box(0.44, 0.5, 0.05, sharedMaterials.walnut, 0, 0.75, -0.19));
    chair.add(box(0.36, 0.34, 0.03, velvetMaterial(0x4c1c2a), 0, 0.76, -0.165));
    [-0.18, 0.18].forEach((lx) => {
      [-0.16, 0.16].forEach((lz) => {
        chair.add(box(0.045, 0.46, 0.045, sharedMaterials.walnut, lx, 0.22, lz));
      });
    });
    group.add(chair);
  });
}

function buildExitDoor(group: THREE.Group, gold: THREE.Material) {
  // Room 2 출구 — station-exit-door (5.9, -1.94), 피벗 (6.33, 1.16, -2.46)
  const stone = sharedMaterials.marble;

  const doorPivot = new THREE.Group();
  doorPivot.position.set(6.33, 1.16, -2.46);
  doorPivot.userData.roomOneExitDoorPivot = true;
  const panelMaterial = sharedMaterials.walnut;
  const door = box(0.1, 2.1, 1.04, panelMaterial, 0, 0, 0.52);
  door.castShadow = true;
  doorPivot.add(door);
  // 문 패널 몰딩 2단
  [
    [0.62, 0.3, 0.52],
    [0.62, -0.62, 0.52],
  ].forEach(([ph, py, pz]) => {
    doorPivot.add(box(0.045, ph, 0.7, panelMaterial, -0.06, py, pz));
    doorPivot.add(box(0.02, ph - 0.1, 0.58, gold, -0.075, py, pz));
  });
  const handlePlate = box(0.03, 0.34, 0.09, gold, -0.08, 0, 0.92);
  const handleKnob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), gold);
  handleKnob.position.set(-0.12, 0, 0.9);
  const keyholePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 14), gold);
  keyholePlate.position.set(-0.09, -0.2, 0.9);
  keyholePlate.rotation.z = Math.PI / 2;
  doorPivot.add(handlePlate, handleKnob, keyholePlate);
  group.add(doorPivot);

  // 대리석 문틀 + 아치 + 키스톤
  const leftJamb = box(0.28, 2.4, 0.3, stone, 6.24, 1.2, -2.6);
  const rightJamb = box(0.28, 2.4, 0.3, stone, 6.24, 1.2, -1.28);
  const lintel = box(0.28, 0.22, 1.62, stone, 6.24, 2.5, -1.94);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 10, 30, Math.PI), stone);
  arch.position.set(6.24, 2.52, -1.94);
  arch.rotation.set(0, Math.PI / 2, Math.PI);
  const keystone = box(0.3, 0.34, 0.24, stone, 6.22, 3.3, -1.94);
  keystone.rotation.x = 0.06;
  group.add(leftJamb, rightJamb, lintel, arch, keystone);

  // 문틈 황금빛
  const seam = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 1.9),
    new THREE.MeshStandardMaterial({
      color: 0xffd9a0,
      emissive: 0xffb254,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.75,
    }),
  );
  seam.position.set(6.2, 1.16, -1.4);
  seam.rotation.y = -Math.PI / 2;
  seam.userData.roomOneDoorSeam = true;
  group.add(seam);

  const exitLight = new THREE.PointLight(0xffbe72, 0.7, 3.4);
  exitLight.position.set(5.9, 1.9, -1.9);
  exitLight.userData.roomOneExitLight = true;
  group.add(exitLight);

  // 문 양옆 횃불형 벽 촛대
  [-2.95, -0.95].forEach((z) => {
    const sconceArm = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 16, Math.PI / 2), gold);
    sconceArm.position.set(6.98, 2.1, z);
    sconceArm.rotation.set(0, Math.PI, Math.PI / 4);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.08, 12), gold);
    cup.position.set(6.88, 2.16, z);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.16, 10), candleWaxMaterial());
    candle.position.set(6.88, 2.28, z);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), flameMaterial());
    flame.position.set(6.88, 2.4, z);
    flame.scale.set(0.8, 1.5, 0.8);
    flame.userData.statusLight = true;
    group.add(sconceArm, cup, candle, flame);
    const sconceLight = new THREE.PointLight(0xffc670, 0.5, 2.2);
    sconceLight.position.set(6.7, 2.3, z);
    group.add(sconceLight);
  });
}

function buildLighting(group: THREE.Group) {
  const chandelierLight = new THREE.PointLight(0xffd2a0, 2.6, 9.4);
  chandelierLight.position.set(0, 3.9, -0.3);
  group.add(chandelierLight);
  group.userData.keyLight = chandelierLight;

  const warmFill = new THREE.PointLight(0xffc98e, 0.8, 8.4);
  warmFill.position.set(-3.2, 2.4, 2.4);
  group.add(warmFill);

  const backFill = new THREE.PointLight(0xd8b36a, 0.65, 8.0);
  backFill.position.set(2.6, 2.8, -3.4);
  group.add(backFill);
}
