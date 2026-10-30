import { BG_48_BASE64, BG_96_BASE64 } from './watermarkAssets';

export interface WatermarkBox {
  size: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TunerOptions {
  gain: number;
  offsetX: number;
  offsetY: number;
  sizeScale: number;
  polarity?: 'white' | 'dark';
  mode?: 'gemini' | 'veo' | 'nanonets';
}

export interface DetectionResult {
  matchFound: boolean;
  score: number;
  presetKey: string;
  name: string;
  offsetX: number;
  offsetY: number;
  sizeScale: number;
  gain: number;
}

const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;

export function calculateAlphaMap(bgCaptureImageData: ImageData): Float32Array {
  const { width, height, data } = bgCaptureImageData;
  const alphaMap = new Float32Array(width * height);
  for (let i = 0; i < alphaMap.length; i++) {
    const idx = i * 4;
    alphaMap[i] = Math.max(data[idx], data[idx + 1], data[idx + 2]) / 255.0;
  }
  return alphaMap;
}

export function removeWatermark(
  imageData: ImageData,
  alphaMap: Float32Array,
  position: { x: number; y: number; width: number; height: number },
  options: { alphaGain?: number; logoValue?: number } = {}
): void {
  const { x, y, width, height } = position;
  const gain =
    Number.isFinite(options.alphaGain) && (options.alphaGain ?? 0) > 0
      ? options.alphaGain!
      : 1;
  const logoValue = options.logoValue ?? 255;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
      const alphaIdx = row * width + col;
      let alpha = alphaMap[alphaIdx] * gain;
      if (alpha < ALPHA_THRESHOLD) continue;
      alpha = Math.min(alpha, MAX_ALPHA);
      for (let c = 0; c < 3; c++) {
        const watermarked = imageData.data[imgIdx + c];
        const original = (watermarked - alpha * logoValue) / (1.0 - alpha);
        imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
      }
    }
  }
}

export function getWatermarkInfo(width: number, height: number): WatermarkBox {
  const minDim = Math.min(width, height);
  const ratio = minDim / 1536;
  const size = Math.max(16, Math.round(96 * ratio));
  const margin = Math.max(8, Math.round(64 * ratio));
  return {
    size,
    x: Math.max(0, width - margin - size),
    y: Math.max(0, height - margin - size),
    width: size,
    height: size,
  };
}

export function getVeoWatermarkInfo(width: number, height: number): WatermarkBox {
  const base = Math.min(width, height);
  const size = Math.max(24, Math.min(Math.round(base / 15), base));
  const margin = Math.round(base / 10);
  return {
    size,
    x: Math.max(0, width - margin - size),
    y: Math.max(0, height - margin - size),
    width: size,
    height: size,
  };
}

export function getRoi(
  width: number,
  height: number,
  wm: WatermarkBox
): { x: number; y: number; width: number; height: number } {
  const pad = Math.round(wm.size * 0.6);
  const rx = Math.max(0, Math.min(width - 1, wm.x - pad));
  const ry = Math.max(0, Math.min(height - 1, wm.y - pad));
  const rw = Math.max(1, Math.min(width - rx, wm.width + pad * 2));
  const rh = Math.max(1, Math.min(height - ry, wm.height + pad * 2));
  return { x: rx, y: ry, width: rw, height: rh };
}

export function resolveBox(
  base: WatermarkBox,
  width: number,
  height: number,
  opts: Partial<TunerOptions> = {}
): WatermarkBox {
  const sizeScale = opts.sizeScale || 1;
  const size = Math.max(
    8,
    Math.min(Math.round(base.size * sizeScale), Math.min(width, height))
  );
  const x = Math.max(
    0,
    Math.min(base.x + Math.round(opts.offsetX || 0), width - size)
  );
  const y = Math.max(
    0,
    Math.min(base.y + Math.round(opts.offsetY || 0), height - size)
  );
  return { size, x, y, width: size, height: size };
}

export function buildAlpha(
  bgImg: HTMLImageElement,
  roi: { x: number; y: number; width: number; height: number },
  wm: WatermarkBox,
  gain: number
): Float32Array {
  const count = roi.width * roi.height;
  const alphaMap = new Float32Array(count);
  const offX = wm.x - roi.x;
  const offY = wm.y - roi.y;
  const c = document.createElement('canvas');
  c.width = wm.size;
  c.height = wm.size;
  const cx = c.getContext('2d', { willReadFrequently: true })!;
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(bgImg, 0, 0, wm.size, wm.size);
  const data = cx.getImageData(0, 0, wm.size, wm.size).data;
  for (let row = 0; row < wm.size; row++) {
    for (let col = 0; col < wm.size; col++) {
      const ri = (offY + row) * roi.width + (offX + col);
      if (ri < 0 || ri >= count) continue;
      const o = (row * wm.size + col) * 4;
      const a = (Math.max(data[o], data[o + 1], data[o + 2]) / 255) * gain;
      alphaMap[ri] = a > 0 ? Math.min(a, 0.99) : 0;
    }
  }
  return alphaMap;
}

export function cleanFrame(
  bgImg: HTMLImageElement,
  imageData: ImageData,
  width: number,
  height: number,
  base: WatermarkBox,
  opts: Partial<TunerOptions> = {}
) {
  const wm = resolveBox(base, width, height, opts);
  const roi = getRoi(width, height, wm);
  const alpha = buildAlpha(bgImg, roi, wm, opts.gain ?? 1);
  const patch = new ImageData(roi.width, roi.height);
  for (let row = 0; row < roi.height; row++) {
    const src = ((roi.y + row) * width + roi.x) * 4;
    patch.data.set(
      imageData.data.subarray(src, src + roi.width * 4),
      row * roi.width * 4
    );
  }
  const logoValue = opts.polarity === 'dark' ? 0 : 255;
  removeWatermark(
    patch,
    alpha,
    { x: 0, y: 0, width: roi.width, height: roi.height },
    { alphaGain: 1, logoValue }
  );
  return { patch, roi, wm };
}

// ── Adaptive Model Presets ──
export function getAdaptiveImagePreset(
  presetKey: string,
  width = 1536,
  height = 1536
): TunerOptions {
  if (presetKey === 'classic') {
    return { gain: 1.0, offsetX: 0, offsetY: 0, sizeScale: 1.0, polarity: 'white' };
  }
  if (presetKey === 'nanonets') {
    const minDim = Math.min(width, height || width);
    const scaleRatio = Math.max(0.25, Math.min(1.5, minDim / 1536));
    const adaptiveOffset = Math.round(-96 * scaleRatio);
    return {
      gain: 0.75,
      offsetX: adaptiveOffset,
      offsetY: adaptiveOffset,
      sizeScale: 1.05,
      polarity: 'white',
    };
  }
  const minDim = Math.min(width, height || width);
  const scaleRatio = Math.max(0.25, Math.min(1.5, minDim / 1536));
  const adaptiveOffset = Math.round(-128 * scaleRatio);
  return {
    gain: 0.6,
    offsetX: adaptiveOffset,
    offsetY: adaptiveOffset,
    sizeScale: 1.0,
    polarity: 'white',
  };
}

export function getAdaptiveVideoPreset(
  presetKey: string,
  width = 720,
  height = 720
): TunerOptions {
  if (presetKey === 'corner') {
    return { gain: 0.6, offsetX: 0, offsetY: 0, sizeScale: 1.0, polarity: 'white' };
  }
  if (presetKey === 'sparkle') {
    const minDim = Math.min(width, height || width);
    const m = Math.max(16, Math.round(192 * (minDim / 1536)));
    const s = Math.max(24, Math.round(96 * (minDim / 1536)));
    const baseDim = Math.min(width, height);
    const veoBase = getVeoWatermarkInfo(width, height);
    return {
      gain: 0.6,
      offsetX: Math.max(0, width - m - s) - veoBase.x,
      offsetY: Math.max(0, height - m - s) - veoBase.y,
      sizeScale: Math.round((s / veoBase.size) * 100) / 100,
      polarity: 'white',
    };
  }
  const minDim = Math.min(width, height || width);
  const scaleRatio = Math.max(0.3, Math.min(1.5, minDim / 720));
  const adaptiveOffset = Math.round(-24 * scaleRatio);
  return {
    gain: 0.6,
    offsetX: adaptiveOffset,
    offsetY: adaptiveOffset,
    sizeScale: 1.0,
    polarity: 'white',
  };
}

// ── Multi-Scale NCC + Edge Gradient Auto-Detection ──
const alphaTemplateCache = new Map<
  number,
  { raw: Uint8ClampedArray; alphas: Float32Array; gradMag: Float32Array; size: number }
>();

function getAlphaTemplateData(bgImg: HTMLImageElement, size: number) {
  if (alphaTemplateCache.has(size)) {
    return alphaTemplateCache.get(size)!;
  }
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const cx = c.getContext('2d', { willReadFrequently: true })!;
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(bgImg, 0, 0, size, size);
  const raw = cx.getImageData(0, 0, size, size).data;
  const alphas = new Float32Array(size * size);
  for (let i = 0; i < alphas.length; i++) {
    const o = i * 4;
    alphas[i] = Math.max(raw[o], raw[o + 1], raw[o + 2]) / 255.0;
  }
  const gradMag = new Float32Array(size * size);
  for (let r = 1; r < size - 1; r++) {
    for (let col = 1; col < size - 1; col++) {
      const idx = r * size + col;
      const gx = alphas[idx + 1] - alphas[idx - 1];
      const gy = alphas[(r + 1) * size + col] - alphas[(r - 1) * size + col];
      gradMag[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  const template = { raw, alphas, gradMag, size };
  alphaTemplateCache.set(size, template);
  return template;
}

export function evaluateCandidateMatch(
  imageData: ImageData,
  width: number,
  height: number,
  bgImg: HTMLImageElement,
  box: { x: number; y: number; size: number }
): { score: number; variance: number } {
  const { x, y, size } = box;
  if (x < 0 || y < 0 || x + size > width || y + size > height || size <= 0) {
    return { score: -1, variance: 0 };
  }
  const template = getAlphaTemplateData(bgImg, size);
  const { alphas, gradMag } = template;
  let sumL = 0,
    sumA = 0;
  let sumL2 = 0,
    sumA2 = 0;
  let sumLA = 0;
  let sumInvL = 0;
  let sumInvL2 = 0;
  let sumInvLA = 0;
  let sumG = 0,
    sumGA = 0;
  let sumG2 = 0,
    sumGA2 = 0;
  let sumGGA = 0;
  let n = 0;
  let nGrad = 0;
  const step = size > 80 ? 2 : 1;

  for (let r = 0; r < size; r += step) {
    const imgRow = y + r;
    for (let col = 0; col < size; col += step) {
      const imgCol = x + col;
      const imgIdx = (imgRow * width + imgCol) * 4;
      const alphaIdx = r * size + col;
      const rVal = imageData.data[imgIdx];
      const gVal = imageData.data[imgIdx + 1];
      const bVal = imageData.data[imgIdx + 2];
      const lum = 0.299 * rVal + 0.587 * gVal + 0.114 * bVal;
      const invLum = 255.0 - lum;
      const alpha = alphas[alphaIdx];
      sumL += lum;
      sumA += alpha;
      sumL2 += lum * lum;
      sumA2 += alpha * alpha;
      sumLA += lum * alpha;
      sumInvL += invLum;
      sumInvL2 += invLum * invLum;
      sumInvLA += invLum * alpha;
      n++;

      if (
        r > 0 &&
        r < size - 1 &&
        col > 0 &&
        col < size - 1 &&
        imgRow > 0 &&
        imgRow < height - 1 &&
        imgCol > 0 &&
        imgCol < width - 1
      ) {
        const leftIdx = (imgRow * width + (imgCol - 1)) * 4;
        const rightIdx = (imgRow * width + (imgCol + 1)) * 4;
        const upIdx = ((imgRow - 1) * width + imgCol) * 4;
        const downIdx = ((imgRow + 1) * width + imgCol) * 4;
        const lumLeft =
          0.299 * imageData.data[leftIdx] +
          0.587 * imageData.data[leftIdx + 1] +
          0.114 * imageData.data[leftIdx + 2];
        const lumRight =
          0.299 * imageData.data[rightIdx] +
          0.587 * imageData.data[rightIdx + 1] +
          0.114 * imageData.data[rightIdx + 2];
        const lumUp =
          0.299 * imageData.data[upIdx] +
          0.587 * imageData.data[upIdx + 1] +
          0.114 * imageData.data[upIdx + 2];
        const lumDown =
          0.299 * imageData.data[downIdx] +
          0.587 * imageData.data[downIdx + 1] +
          0.114 * imageData.data[downIdx + 2];
        const gx = lumRight - lumLeft;
        const gy = lumDown - lumUp;
        const imgGrad = Math.sqrt(gx * gx + gy * gy);
        const aGrad = gradMag[alphaIdx];
        sumG += imgGrad;
        sumGA += aGrad;
        sumG2 += imgGrad * imgGrad;
        sumGA2 += aGrad * aGrad;
        sumGGA += imgGrad * aGrad;
        nGrad++;
      }
    }
  }

  if (n === 0) return { score: -1, variance: 0 };
  const meanL = sumL / n;
  const meanA = sumA / n;
  const varL = Math.max(0, sumL2 / n - meanL * meanL);
  const varA = Math.max(0, sumA2 / n - meanA * meanA);
  if (varA <= 0.0001) {
    return { score: 0, variance: varL };
  }

  let nccWhite = 0;
  if (varL > 0.5) {
    const covLA = sumLA / n - meanL * meanA;
    nccWhite = covLA / Math.sqrt(varL * varA);
  }

  let nccDark = 0;
  const meanInvL = sumInvL / n;
  const varInvL = Math.max(0, sumInvL2 / n - meanInvL * meanInvL);
  if (varInvL > 0.5 && meanL > 160) {
    const covInvLA = sumInvLA / n - meanInvL * meanA;
    nccDark = covInvLA / Math.sqrt(varInvL * varA);
  }
  const nccLum = Math.max(nccWhite, nccDark);

  let nccGrad = 0;
  if (nGrad > 10) {
    const meanG = sumG / nGrad;
    const meanGA = sumGA / nGrad;
    const varG = Math.max(0, sumG2 / nGrad - meanG * meanG);
    const varGA = Math.max(0, sumGA2 / nGrad - meanGA * meanGA);
    if (varG > 0.5 && varGA > 0.0001) {
      const covGGA = sumGGA / nGrad - meanG * meanGA;
      nccGrad = Math.max(0, covGGA / Math.sqrt(varG * varGA));
    }
  }

  let fusedScore = nccLum * 0.65 + nccGrad * 0.35;
  if (varL < 20) {
    fusedScore = Math.max(fusedScore, nccLum * 0.4 + nccGrad * 0.6);
  }
  return { score: Math.max(0, fusedScore), variance: varL };
}

export function detectWatermarkCandidate(
  imageData: ImageData,
  width: number,
  height: number,
  bgImg: HTMLImageElement
): DetectionResult {
  const minDim = Math.min(width, height);
  const baseRatio = minDim / 1536;
  const base = getWatermarkInfo(width, height);

  const layoutFamilies = [
    {
      presetKey: 'new',
      name: 'Gemini & Nano Banana (Adaptive)',
      baseSize: base.size,
      calcPos: (s: number) => {
        const m = Math.max(8, Math.round(192 * baseRatio));
        return { x: Math.max(0, width - m - s), y: Math.max(0, height - m - s) };
      },
      gain: 0.6,
      prior: 1.08,
    },
    {
      presetKey: 'classic',
      name: 'Imagen 3 & Classic Corner',
      baseSize: base.size,
      calcPos: (s: number) => {
        const m = Math.max(8, Math.round(64 * baseRatio));
        return { x: Math.max(0, width - m - s), y: Math.max(0, height - m - s) };
      },
      gain: 1.0,
      prior: 1.04,
    },
    {
      presetKey: 'new',
      name: 'Gemini & Nanonets (Fixed 96px Inset)',
      baseSize: 96,
      calcPos: (s: number) => {
        const m = minDim >= 1400 ? 192 : Math.round(128 * Math.max(0.5, minDim / 1024));
        return { x: Math.max(0, width - m - s), y: Math.max(0, height - m - s) };
      },
      gain: 0.6,
      prior: 1.02,
    },
    {
      presetKey: 'classic',
      name: 'Classic Corner (Fixed 96px)',
      baseSize: 96,
      calcPos: (s: number) => {
        const m = minDim >= 1024 ? 64 : 32;
        return { x: Math.max(0, width - m - s), y: Math.max(0, height - m - s) };
      },
      gain: 1.0,
      prior: 1.01,
    },
  ];

  const scalePyramid = [0.55, 0.7, 0.85, 1.0, 1.15, 1.3, 1.5, 1.7];
  let bestMatch: {
    layout: (typeof layoutFamilies)[0];
    size: number;
    scale: number;
    x: number;
    y: number;
    score: number;
  } | null = null;
  let bestScore = -1;

  for (const layout of layoutFamilies) {
    for (const scale of scalePyramid) {
      const s = Math.max(
        16,
        Math.min(Math.round(layout.baseSize * scale), Math.min(width, height) - 8)
      );
      const pos = layout.calcPos(s);
      const { score } = evaluateCandidateMatch(imageData, width, height, bgImg, {
        x: pos.x,
        y: pos.y,
        size: s,
      });
      const weightedScore = score * (layout.prior || 1.0);
      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestMatch = {
          layout,
          size: s,
          scale,
          x: pos.x,
          y: pos.y,
          score: weightedScore,
        };
      }
    }
  }

  if (bestMatch && bestMatch.score > 0.05) {
    let refinedX = bestMatch.x;
    let refinedY = bestMatch.y;
    let refinedSize = bestMatch.size;
    let refinedScore = bestMatch.score;
    const fineSizes = [
      Math.max(16, Math.round(bestMatch.size * 0.9)),
      Math.max(16, Math.round(bestMatch.size * 0.95)),
      bestMatch.size,
      Math.min(Math.min(width, height) - 8, Math.round(bestMatch.size * 1.05)),
      Math.min(Math.min(width, height) - 8, Math.round(bestMatch.size * 1.1)),
    ];
    const uniqueSizes = [...new Set(fineSizes)];
    for (const testSize of uniqueSizes) {
      for (let dy = -16; dy <= 16; dy += 4) {
        for (let dx = -16; dx <= 16; dx += 4) {
          const testX = Math.max(0, Math.min(width - testSize, bestMatch.x + dx));
          const testY = Math.max(0, Math.min(height - testSize, bestMatch.y + dy));
          const { score } = evaluateCandidateMatch(imageData, width, height, bgImg, {
            x: testX,
            y: testY,
            size: testSize,
          });
          const weightedScore = score * (bestMatch.layout.prior || 1.0);
          if (weightedScore > refinedScore) {
            refinedScore = weightedScore;
            refinedX = testX;
            refinedY = testY;
            refinedSize = testSize;
          }
        }
      }
    }
    const calculatedScale = Math.round((refinedSize / base.size) * 100) / 100;
    return {
      matchFound: refinedScore >= 0.1,
      score: Math.min(1.0, refinedScore),
      presetKey: bestMatch.layout.presetKey,
      name: `${bestMatch.layout.name} (${refinedSize}px)`,
      offsetX: refinedX - base.x,
      offsetY: refinedY - base.y,
      sizeScale: Math.max(0.5, Math.min(2.5, calculatedScale)),
      gain: bestMatch.layout.gain || 0.6,
    };
  }

  const fallbackOffset = Math.round(-128 * baseRatio);
  return {
    matchFound: false,
    score: bestScore > 0 ? bestScore : 0,
    presetKey: 'new',
    name: 'Gemini & Nano Banana (Adaptive)',
    offsetX: fallbackOffset,
    offsetY: fallbackOffset,
    sizeScale: 1.0,
    gain: 0.6,
  };
}

export function detectVideoWatermarkCandidate(
  imageData: ImageData,
  width: number,
  height: number,
  bgImg: HTMLImageElement
): DetectionResult {
  const baseDim = Math.min(width, height);
  const veoBase = getVeoWatermarkInfo(width, height);

  const layoutFamilies = [
    {
      presetKey: 'veo',
      name: 'Gemini Omni & Google Flow (Adaptive Inset)',
      baseSize: veoBase.size,
      calcPos: (s: number) => {
        const adaptiveOffset = Math.round(-24 * (baseDim / 720));
        return {
          x: Math.max(0, Math.min(width - s, veoBase.x + adaptiveOffset)),
          y: Math.max(0, Math.min(height - s, veoBase.y + adaptiveOffset)),
        };
      },
      gain: 0.6,
      prior: 1.06,
    },
    {
      presetKey: 'corner',
      name: 'Gemini Veo 3 & Nanonets Video (Corner)',
      baseSize: veoBase.size,
      calcPos: (s: number) => ({
        x: Math.max(0, Math.min(width - s, veoBase.x)),
        y: Math.max(0, Math.min(height - s, veoBase.y)),
      }),
      gain: 0.6,
      prior: 1.02,
    },
    {
      presetKey: 'sparkle',
      name: 'Gemini Sparkle (Standard Video)',
      baseSize: Math.max(24, Math.round(96 * (baseDim / 1536))),
      calcPos: (s: number) => {
        const m = Math.max(16, Math.round(192 * (baseDim / 1536)));
        return {
          x: Math.max(0, width - m - s),
          y: Math.max(0, height - m - s),
        };
      },
      gain: 0.6,
      prior: 1.01,
    },
  ];

  const scalePyramid = [0.65, 0.85, 1.0, 1.2, 1.45];
  let bestMatch: {
    layout: (typeof layoutFamilies)[0];
    size: number;
    scale: number;
    x: number;
    y: number;
    score: number;
  } | null = null;
  let bestScore = -1;

  for (const layout of layoutFamilies) {
    for (const scale of scalePyramid) {
      const s = Math.max(
        16,
        Math.min(Math.round(layout.baseSize * scale), Math.min(width, height) - 8)
      );
      const pos = layout.calcPos(s);
      const { score } = evaluateCandidateMatch(imageData, width, height, bgImg, {
        x: pos.x,
        y: pos.y,
        size: s,
      });
      const weightedScore = score * (layout.prior || 1.0);
      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestMatch = {
          layout,
          size: s,
          scale,
          x: pos.x,
          y: pos.y,
          score: weightedScore,
        };
      }
    }
  }

  if (bestMatch && bestMatch.score > 0.05) {
    let refinedX = bestMatch.x;
    let refinedY = bestMatch.y;
    let refinedSize = bestMatch.size;
    let refinedScore = bestMatch.score;
    const fineSizes = [
      Math.max(16, Math.round(bestMatch.size * 0.92)),
      bestMatch.size,
      Math.min(Math.min(width, height) - 8, Math.round(bestMatch.size * 1.08)),
    ];
    const uniqueSizes = [...new Set(fineSizes)];
    for (const testSize of uniqueSizes) {
      for (let dy = -16; dy <= 16; dy += 4) {
        for (let dx = -16; dx <= 16; dx += 4) {
          const testX = Math.max(0, Math.min(width - testSize, bestMatch.x + dx));
          const testY = Math.max(0, Math.min(height - testSize, bestMatch.y + dy));
          const { score } = evaluateCandidateMatch(imageData, width, height, bgImg, {
            x: testX,
            y: testY,
            size: testSize,
          });
          const weightedScore = score * (bestMatch.layout.prior || 1.0);
          if (weightedScore > refinedScore) {
            refinedScore = weightedScore;
            refinedX = testX;
            refinedY = testY;
            refinedSize = testSize;
          }
        }
      }
    }
    const calculatedScale = Math.round((refinedSize / veoBase.size) * 100) / 100;
    return {
      matchFound: refinedScore >= 0.08,
      score: Math.min(1.0, refinedScore),
      presetKey: bestMatch.layout.presetKey,
      name: `${bestMatch.layout.name} (${refinedSize}px)`,
      offsetX: refinedX - veoBase.x,
      offsetY: refinedY - veoBase.y,
      sizeScale: Math.max(0.5, Math.min(2.5, calculatedScale)),
      gain: bestMatch.layout.gain || 0.6,
    };
  }

  const fallbackOffset = Math.round(-24 * (baseDim / 720));
  return {
    matchFound: false,
    score: bestScore > 0 ? bestScore : 0,
    presetKey: 'veo',
    name: 'Gemini Omni & Google Flow (Adaptive Inset)',
    offsetX: fallbackOffset,
    offsetY: fallbackOffset,
    sizeScale: 1.0,
    gain: 0.6,
  };
}

// ── WatermarkEngine Class ──
export class WatermarkEngine {
  public bg48: HTMLImageElement;
  public bg96: HTMLImageElement;
  private alphaMaps: Record<number, Float32Array> = {};

  constructor(bg48: HTMLImageElement, bg96: HTMLImageElement) {
    this.bg48 = bg48;
    this.bg96 = bg96;
  }

  static async create(): Promise<WatermarkEngine> {
    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
      });
    const [bg48, bg96] = await Promise.all([
      loadImage(BG_48_BASE64),
      loadImage(BG_96_BASE64),
    ]);
    return new WatermarkEngine(bg48, bg96);
  }

  previewClean(
    fullImageData: ImageData,
    width: number,
    height: number,
    opts: Partial<TunerOptions> = {}
  ) {
    const base = getWatermarkInfo(width, height);
    return cleanFrame(this.bg96, fullImageData, width, height, base, opts);
  }

  async exportCleanImage(
    originalImageData: ImageData,
    width: number,
    height: number,
    opts: Partial<TunerOptions> = {},
    mimeType: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/png',
    scaleFactor = 1
  ): Promise<{
    blob: Blob;
    url: string;
    wm: WatermarkBox;
    outWidth: number;
    outHeight: number;
  }> {
    const base = getWatermarkInfo(width, height);
    const { patch, roi, wm } = cleanFrame(
      this.bg96,
      originalImageData,
      width,
      height,
      base,
      opts
    );
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = width;
    baseCanvas.height = height;
    const ctx = baseCanvas.getContext('2d')!;
    ctx.putImageData(originalImageData, 0, 0);
    ctx.putImageData(patch, roi.x, roi.y);

    let targetCanvas = baseCanvas;
    const outWidth = Math.round(width * scaleFactor);
    const outHeight = Math.round(height * scaleFactor);

    if (scaleFactor !== 1 && scaleFactor > 0) {
      targetCanvas = document.createElement('canvas');
      targetCanvas.width = outWidth;
      targetCanvas.height = outHeight;
      const sCtx = targetCanvas.getContext('2d')!;
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(baseCanvas, 0, 0, outWidth, outHeight);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      targetCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))),
        mimeType,
        0.98
      );
    });
    return {
      blob,
      url: URL.createObjectURL(blob),
      wm,
      outWidth,
      outHeight,
    };
  }
}

// ── VideoWatermarkEngine Class ──
export class VideoWatermarkEngine {
  public engine: WatermarkEngine;

  constructor(engine: WatermarkEngine) {
    this.engine = engine;
  }

  static async create(): Promise<VideoWatermarkEngine> {
    const engine = await WatermarkEngine.create();
    return new VideoWatermarkEngine(engine);
  }

  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder !== 'undefined' &&
      typeof (window as unknown as { VideoDecoder?: unknown }).VideoDecoder !== 'undefined'
    );
  }

  previewClean(
    fullImageData: ImageData,
    width: number,
    height: number,
    opts: Partial<TunerOptions> = {}
  ) {
    const base = getVeoWatermarkInfo(width, height);
    return cleanFrame(this.engine.bg96, fullImageData, width, height, base, {
      ...opts,
      gain: opts.gain ?? 0.6,
    });
  }

  async process(
    file: File,
    opts: Partial<TunerOptions> & {
      onProgress?: (info: { progress: number; stage?: string }) => void;
    } = {}
  ): Promise<{
    blob: Blob;
    url: string;
    originalUrl: string;
    ext: string;
    mime: string;
    width: number;
    height: number;
  }> {
    const onProgress = opts.onProgress || (() => {});
    const gain = opts.gain ?? 0.6;
    const logoValue = opts.polarity === 'dark' ? 0 : 255;

    // Import mediabunny from installed package
    const mb = await import('mediabunny');
    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      CanvasSource,
      EncodedAudioPacketSource,
      EncodedPacketSink,
      Input,
      Mp4OutputFormat,
      Output,
      QUALITY_HIGH,
      VideoSampleSink,
      canEncodeVideo,
    } = mb;

    if (canEncodeVideo && !(await canEncodeVideo('avc'))) {
      throw new Error(
        'Your browser cannot encode H.264 video locally via WebCodecs. Please use Chrome or Edge desktop.'
      );
    }

    const originalUrl = URL.createObjectURL(file);
    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      input.dispose?.();
      URL.revokeObjectURL(originalUrl);
      throw new Error('No decodable video track found in this file.');
    }

    const width = videoTrack.displayWidth ?? videoTrack.codedWidth;
    const height = videoTrack.displayHeight ?? videoTrack.codedHeight;
    const duration = await input.computeDuration().catch(() => 0);
    let frameRate = 30;
    try {
      const stats = await videoTrack.computePacketStats(120);
      if (stats?.averagePacketRate) frameRate = Math.round(stats.averagePacketRate);
    } catch {
      // Fallback to 30fps
    }

    const base =
      opts.mode === 'gemini'
        ? getWatermarkInfo(width, height)
        : getVeoWatermarkInfo(width, height);
    const wm = resolveBox(base, width, height, opts);
    const roi = getRoi(width, height, wm);
    const alpha = buildAlpha(this.engine.bg96, roi, wm, gain);
    const region = { x: 0, y: 0, width: roi.width, height: roi.height };

    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const target = new BufferTarget();
    const output = new Output({ format: new Mp4OutputFormat(), target });

    const videoSource = new CanvasSource(canvas, {
      codec: 'avc',
      bitrate: QUALITY_HIGH,
      keyFrameInterval: 2,
      sizeChangeBehavior: 'passThrough',
    });
    output.addVideoTrack(videoSource, { frameRate });

    let audioSource: InstanceType<typeof EncodedAudioPacketSource> | null = null;
    let audioTrack: Awaited<ReturnType<typeof input.getPrimaryAudioTrack>> = null;
    let audioDecoderConfig: unknown = null;
    try {
      audioTrack = await input.getPrimaryAudioTrack();
      if (audioTrack) {
        const audioCodec = await audioTrack.getCodec();
        audioDecoderConfig = await audioTrack.getDecoderConfig().catch(() => null);
        if (audioCodec && audioDecoderConfig) {
          audioSource = new EncodedAudioPacketSource(audioCodec);
          output.addAudioTrack(audioSource);
        }
      }
    } catch {
      audioSource = null;
    }

    await output.start();
    const fallbackDur = frameRate > 0 ? 1 / frameRate : 1 / 30;
    const sink = new VideoSampleSink(videoTrack);
    let firstTimestamp: number | null = null;
    let lastTimestamp = -1;

    for await (const sample of sink.samples()) {
      if (firstTimestamp === null) firstTimestamp = sample.timestamp;
      let timestamp = sample.timestamp - firstTimestamp;
      if (!(timestamp >= 0)) timestamp = 0;
      if (timestamp <= lastTimestamp) timestamp = lastTimestamp + fallbackDur;
      const dur =
        Number.isFinite(sample.duration) && sample.duration > 0
          ? sample.duration
          : fallbackDur;
      lastTimestamp = timestamp;

      sample.draw(ctx, 0, 0, width, height);
      sample.close();

      const px = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
      removeWatermark(px, alpha, region, { alphaGain: 1, logoValue });
      const bmp = await createImageBitmap(px);
      ctx.drawImage(bmp, roi.x, roi.y);
      bmp.close();

      await videoSource.add(timestamp, dur);
      if (duration) {
        onProgress({
          progress: Math.min(0.99, timestamp / duration),
          stage: `Unblending frames (${Math.round((timestamp / duration) * 100)}%)`,
        });
      }
    }
    videoSource.close();

    if (audioSource && audioTrack) {
      try {
        onProgress({ progress: 0.99, stage: 'Preserving lossless audio track...' });
        const offset = firstTimestamp ?? 0;
        const aSink = new EncodedPacketSink(audioTrack);
        let isFirstAudio = true;
        let lastAudioTs = -1;
        for await (const packet of aSink.packets()) {
          let newTs = packet.timestamp - offset;
          if (newTs < 0) continue;
          if (newTs <= lastAudioTs) newTs = lastAudioTs + 1e-6;
          lastAudioTs = newTs;
          let outPacket = packet;
          if (newTs !== packet.timestamp && typeof packet.clone === 'function') {
            outPacket = packet.clone({ timestamp: newTs });
          }
          await audioSource.add(
            outPacket,
            isFirstAudio && audioDecoderConfig
              ? { decoderConfig: audioDecoderConfig as AudioDecoderConfig }
              : undefined
          );
          isFirstAudio = false;
        }
      } catch (e) {
        console.warn('Audio passthrough failed.', e);
      } finally {
        audioSource.close();
      }
    }

    await output.finalize();
    input.dispose?.();
    if (!target.buffer) {
      URL.revokeObjectURL(originalUrl);
      throw new Error('Video export produced no output.');
    }

    const blob = new Blob([target.buffer], { type: 'video/mp4' });
    onProgress({ progress: 1, stage: 'Complete' });
    return {
      blob,
      url: URL.createObjectURL(blob),
      originalUrl,
      ext: 'mp4',
      mime: 'video/mp4',
      width,
      height,
    };
  }
}

// ── Synthetic Sample Generator (Creates Real Watermarked Sample Media for Instant Testing) ──
export async function generateSampleWatermarkedImage(
  engine: WatermarkEngine,
  variant: 'gemini_portrait' | 'nano_architecture' | 'nanonets_product' = 'gemini_portrait'
): Promise<File> {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (variant === 'gemini_portrait') {
    // Warm golden hour coastal cliff & sunlit architectural terrace
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(0.35, '#fdba74');
    grad.addColorStop(0.7, '#f97316');
    grad.addColorStop(1, '#0f766e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warm sun disc
    const sunGrad = ctx.createRadialGradient(300, 260, 20, 300, 260, 360);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    sunGrad.addColorStop(0.4, 'rgba(254, 240, 138, 0.5)');
    sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height);

    // Terraced hills in bottom right so unblending restores crisp natural contours
    ctx.fillStyle = '#115e59';
    ctx.beginPath();
    ctx.moveTo(0, 680);
    ctx.lineTo(380, 540);
    ctx.lineTo(740, 620);
    ctx.lineTo(1024, 490);
    ctx.lineTo(1024, 1024);
    ctx.lineTo(0, 1024);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(640 + i * 24, 620);
      ctx.lineTo(760 + i * 24, 1024);
      ctx.stroke();
    }
  } else if (variant === 'nano_architecture') {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#bae6fd');
    grad.addColorStop(0.55, '#38bdf8');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      ctx.strokeRect(140 + i * 36, 180 + i * 22, 660, 500);
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#d1fae5');
    grad.addColorStop(0.5, '#34d399');
    grad.addColorStop(1, '#065f46');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    for (let r = 60; r < 950; r += 40) {
      ctx.beginPath();
      ctx.arc(820, 820, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Blend authentic Gemini / Nano Banana 4-point sparkle watermark onto the image using exact forward alpha blending!
  // Forward equation: Watermarked = Original * (1 - alpha) + 255 * alpha
  const base = getWatermarkInfo(width, height);
  const preset =
    variant === 'nanonets_product'
      ? getAdaptiveImagePreset('classic', width, height)
      : getAdaptiveImagePreset('new', width, height);
  const wm = resolveBox(base, width, height, preset);
  const roi = getRoi(width, height, wm);
  const alphaMap = buildAlpha(engine.bg96, roi, wm, preset.gain);

  const imgData = ctx.getImageData(roi.x, roi.y, roi.width, roi.height);
  for (let row = 0; row < roi.height; row++) {
    for (let col = 0; col < roi.width; col++) {
      const idx = (row * roi.width + col) * 4;
      const a = alphaMap[row * roi.width + col];
      if (a <= 0.002) continue;
      for (let c = 0; c < 3; c++) {
        const orig = imgData.data[idx + c];
        imgData.data[idx + c] = Math.min(255, Math.round(orig * (1 - a) + 255 * a));
      }
    }
  }
  ctx.putImageData(imgData, roi.x, roi.y);

  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png', 1.0)
  );
  return new File([blob], `sample_${variant}_1024px.png`, { type: 'image/png' });
}
