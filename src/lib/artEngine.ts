import { FilterParams, MovementAlgorithm } from "../data/movements";

export interface RenderOptions {
  algorithm: MovementAlgorithm;
  params: FilterParams;
  palette: [string, string, string, string, string];
  maxDimension?: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function clampByte(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : n | 0;
}

// Deterministic fast PRNG so renders are stable when tweaking other sliders
function createRng(seed: number) {
  let s = seed | 0 || 1234567;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 4294967296);
  };
}

function samplePalette(paletteRgb: RGB[], t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (paletteRgb.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const a = paletteRgb[idx];
  const b = paletteRgb[Math.min(paletteRgb.length - 1, idx + 1)];
  return {
    r: a.r + (b.r - a.r) * frac,
    g: a.g + (b.g - a.g) * frac,
    b: a.b + (b.b - a.b) * frac,
  };
}

function adjustPixelColor(
  r: number,
  g: number,
  b: number,
  contrastVal: number,
  saturationVal: number,
  warmthVal: number
): RGB {
  // Contrast factor (-0.5 to +1.2)
  const cFactor = ((contrastVal - 50) / 50) * 0.7;
  const cf = (1 + cFactor) / (1 - Math.min(0.85, cFactor * 0.5));

  let nr = (r - 128) * cf + 128;
  let ng = (g - 128) * cf + 128;
  let nb = (b - 128) * cf + 128;

  // Warmth (-50 to +50)
  nr += warmthVal * 0.8;
  ng += warmthVal * 0.18;
  nb -= warmthVal * 0.85;

  // Saturation (0 to 100, 50 = neutral)
  const lum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
  const satMult = saturationVal / 50;
  nr = lum + (nr - lum) * satMult;
  ng = lum + (ng - lum) * satMult;
  nb = lum + (nb - lum) * satMult;

  return {
    r: clampByte(nr),
    g: clampByte(ng),
    b: clampByte(nb),
  };
}

interface FieldAnalysis {
  width: number;
  height: number;
  adjusted: Uint8ClampedArray;
  lum: Float32Array;
  edgeMag: Float32Array;
  edgeAngle: Float32Array;
}

function analyzeImage(
  sourceData: ImageData,
  params: FilterParams
): FieldAnalysis {
  const { width, height, data } = sourceData;
  const total = width * height;
  const adjusted = new Uint8ClampedArray(total * 4);
  const lum = new Float32Array(total);

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const c = adjustPixelColor(
      data[idx],
      data[idx + 1],
      data[idx + 2],
      params.contrast,
      params.saturation,
      params.warmth
    );
    adjusted[idx] = c.r;
    adjusted[idx + 1] = c.g;
    adjusted[idx + 2] = c.b;
    adjusted[idx + 3] = data[idx + 3];
    lum[i] = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  const edgeMag = new Float32Array(total);
  const edgeAngle = new Float32Array(total);

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const i = rowOffset + x;
      const tl = lum[i - width - 1];
      const tc = lum[i - width];
      const tr = lum[i - width + 1];
      const ml = lum[i - 1];
      const mr = lum[i + 1];
      const bl = lum[i + width - 1];
      const bc = lum[i + width];
      const br = lum[i + width + 1];

      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const mag = Math.sqrt(gx * gx + gy * gy);
      edgeMag[i] = mag;
      edgeAngle[i] = Math.atan2(gy, gx);
    }
  }

  return { width, height, adjusted, lum, edgeMag, edgeAngle };
}

function drawCanvasGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number,
  warmTone = true
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = warmTone ? "rgba(60, 48, 32, 0.25)" : "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 0.7;
  const step = 6;
  ctx.beginPath();
  for (let y = 0; y < height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  for (let x = 0; x < width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  ctx.stroke();
  ctx.restore();
}

function overlaySobelContours(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  lineWeight: number,
  inkColor: RGB,
  threshold = 0.22
) {
  if (lineWeight <= 2) return;
  const { width, height, edgeMag } = field;
  const imgData = ctx.getImageData(0, 0, width, height);
  const out = imgData.data;
  const strength = (lineWeight / 100) * 1.35;

  for (let i = 0; i < width * height; i++) {
    const mag = edgeMag[i];
    if (mag > threshold) {
      const alpha = Math.min(0.92, (mag - threshold) * strength * 2.1);
      const idx = i * 4;
      out[idx] = clampByte(out[idx] * (1 - alpha) + inkColor.r * alpha);
      out[idx + 1] = clampByte(out[idx + 1] * (1 - alpha) + inkColor.g * alpha);
      out[idx + 2] = clampByte(out[idx + 2] * (1 - alpha) + inkColor.b * alpha);
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function renderImpressionism(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum, edgeAngle } = field;
  const rng = createRng(4201);

  // Soft luminous primed base blended with photo
  const baseImg = ctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const pCol = samplePalette(paletteRgb, lum[i]);
    baseImg.data[idx] = clampByte(adjusted[idx] * 0.65 + pCol.r * 0.35);
    baseImg.data[idx + 1] = clampByte(adjusted[idx + 1] * 0.65 + pCol.g * 0.35);
    baseImg.data[idx + 2] = clampByte(adjusted[idx + 2] * 0.65 + pCol.b * 0.35);
    baseImg.data[idx + 3] = 255;
  }
  ctx.putImageData(baseImg, 0, 0);

  const scale = 0.4 + (params.brushScale / 100) * 1.4;
  const strokeLen = Math.max(5, Math.round(13 * scale));
  const strokeThick = Math.max(2.2, 4.6 * scale);
  const step = Math.max(3, Math.round(strokeThick * 1.15));

  // Multi-pass broken color dabs following tangent of image edges
  const points: Array<[number, number]> = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      points.push([
        Math.min(width - 1, Math.max(0, Math.round(x + (rng() - 0.5) * step))),
        Math.min(height - 1, Math.max(0, Math.round(y + (rng() - 0.5) * step))),
      ]);
    }
  }
  // Shuffle for organic layering
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  for (const [px, py] of points) {
    const i = py * width + px;
    const idx = i * 4;
    const angle = edgeAngle[i] + Math.PI / 2 + (rng() - 0.5) * 0.35;
    const pCol = samplePalette(paletteRgb, lum[i]);
    // Optical color vibration: shift slightly warm/cool
    const jitter = (rng() - 0.5) * 28;
    const r = clampByte(adjusted[idx] * 0.72 + pCol.r * 0.28 + jitter);
    const g = clampByte(adjusted[idx + 1] * 0.72 + pCol.g * 0.28 + jitter * 0.4);
    const b = clampByte(adjusted[idx + 2] * 0.72 + pCol.b * 0.28 - jitter * 0.7);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.78)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, strokeLen * (0.7 + rng() * 0.6), strokeThick * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  overlaySobelContours(ctx, field, params.lineWeight, paletteRgb[0], 0.35);
  drawCanvasGrain(ctx, width, height, 0.08, true);
}

function renderPostImpressionism(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum, edgeAngle } = field;
  const rng = createRng(8812);

  // Dark cobalt/umber ground
  ctx.fillStyle = `rgb(${paletteRgb[0].r}, ${paletteRgb[0].g}, ${paletteRgb[0].b})`;
  ctx.fillRect(0, 0, width, height);

  const scale = 0.5 + (params.brushScale / 100) * 1.4;
  const step = Math.max(4, Math.round(6 * scale));
  const segLen = Math.max(6, Math.round(9 * scale));
  const lineW = Math.max(2.2, 4.2 * scale);

  const seeds: Array<[number, number]> = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      seeds.push([
        Math.min(width - 1, Math.max(0, Math.round(x + (rng() - 0.5) * step))),
        Math.min(height - 1, Math.max(0, Math.round(y + (rng() - 0.5) * step))),
      ]);
    }
  }
  for (let i = seeds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [sx, sy] of seeds) {
    const i0 = sy * width + sx;
    const idx0 = i0 * 4;
    const pCol = samplePalette(paletteRgb, lum[i0]);
    const r = clampByte(adjusted[idx0] * 0.58 + pCol.r * 0.42 + (rng() - 0.5) * 18);
    const g = clampByte(adjusted[idx0 + 1] * 0.58 + pCol.g * 0.42 + (rng() - 0.5) * 14);
    const b = clampByte(adjusted[idx0 + 2] * 0.58 + pCol.b * 0.42 + (rng() - 0.5) * 18);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.88)`;
    ctx.lineWidth = lineW * (0.75 + rng() * 0.45);
    ctx.beginPath();
    let cx = sx;
    let cy = sy;
    ctx.moveTo(cx, cy);

    // Follow edge tangent with subtle rhythmic Van Gogh swirl curl
    for (let s = 0; s < 3; s++) {
      const ix = Math.min(width - 1, Math.max(0, Math.round(cx)));
      const iy = Math.min(height - 1, Math.max(0, Math.round(cy)));
      const ii = iy * width + ix;
      const swirl = Math.sin(cx * 0.018 + cy * 0.015) * 0.45;
      const ang = edgeAngle[ii] + Math.PI / 2 + swirl;
      cx += Math.cos(ang) * segLen * 0.55;
      cy += Math.sin(ang) * segLen * 0.55;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  overlaySobelContours(ctx, field, params.lineWeight, paletteRgb[0], 0.28);
  drawCanvasGrain(ctx, width, height, 0.06, false);
}

function renderExpressionism(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum, edgeAngle } = field;
  const rng = createRng(1905);

  const imgData = ctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const pCol = samplePalette(paletteRgb, lum[i]);
    imgData.data[idx] = clampByte(adjusted[idx] * 0.48 + pCol.r * 0.52);
    imgData.data[idx + 1] = clampByte(adjusted[idx + 1] * 0.48 + pCol.g * 0.52);
    imgData.data[idx + 2] = clampByte(adjusted[idx + 2] * 0.48 + pCol.b * 0.52);
    imgData.data[idx + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const scale = 0.5 + (params.brushScale / 100) * 1.3;
  const step = Math.max(5, Math.round(8 * scale));

  ctx.lineCap = "butt";
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const jx = Math.min(width - 1, Math.max(0, Math.round(x + (rng() - 0.5) * step)));
      const jy = Math.min(height - 1, Math.max(0, Math.round(y + (rng() - 0.5) * step)));
      const i = jy * width + jx;
      const idx = i * 4;
      const pCol = samplePalette(paletteRgb, lum[i]);
      const angle = edgeAngle[i] + Math.PI / 2 + (rng() - 0.5) * 0.5;
      const len = step * 1.9;

      const r = clampByte(adjusted[idx] * 0.45 + pCol.r * 0.55);
      const g = clampByte(adjusted[idx + 1] * 0.45 + pCol.g * 0.55);
      const b = clampByte(adjusted[idx + 2] * 0.45 + pCol.b * 0.55);

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.72)`;
      ctx.lineWidth = Math.max(2, step * 0.55);
      ctx.beginPath();
      ctx.moveTo(jx - Math.cos(angle) * len * 0.5, jy - Math.sin(angle) * len * 0.5);
      ctx.lineTo(jx + Math.cos(angle) * len * 0.5, jy + Math.sin(angle) * len * 0.5);
      ctx.stroke();
    }
  }

  overlaySobelContours(ctx, field, params.lineWeight, { r: 16, g: 14, b: 18 }, 0.16);
}

function renderCubism(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum, edgeMag } = field;
  const rng = createRng(1911);

  const cellSize = Math.max(14, Math.round(14 + (params.brushScale / 100) * 34));
  const cols = Math.ceil(width / cellSize) + 2;
  const rows = Math.ceil(height / cellSize) + 2;

  // Build jittered grid vertices for angular cubist facets
  const grid: Array<Array<[number, number]>> = [];
  for (let r = 0; r <= rows; r++) {
    const rowPts: Array<[number, number]> = [];
    for (let c = 0; c <= cols; c++) {
      const gx = (c - 0.5) * cellSize + (rng() - 0.5) * cellSize * 0.72;
      const gy = (r - 0.5) * cellSize + (rng() - 0.5) * cellSize * 0.72;
      rowPts.push([gx, gy]);
    }
    grid.push(rowPts);
  }

  const drawFacet = (pts: Array<[number, number]>) => {
    const cx = Math.min(
      width - 1,
      Math.max(0, Math.round(pts.reduce((acc, p) => acc + p[0], 0) / pts.length))
    );
    const cy = Math.min(
      height - 1,
      Math.max(0, Math.round(pts.reduce((acc, p) => acc + p[1], 0) / pts.length))
    );
    const i = cy * width + cx;
    const idx = i * 4;
    const edgeBoost = Math.min(0.18, edgeMag[i] * 0.15);
    const facetLum = Math.max(0, Math.min(1, lum[i] + (rng() - 0.5) * 0.12 + edgeBoost));
    const pCol = samplePalette(paletteRgb, facetLum);

    // Blend subtle original hue with cubist ochre/slate palette
    const r = clampByte(adjusted[idx] * 0.34 + pCol.r * 0.66);
    const g = clampByte(adjusted[idx + 1] * 0.34 + pCol.g * 0.66);
    const b = clampByte(adjusted[idx + 2] * 0.34 + pCol.b * 0.66);

    // Linear gradient across facet to give geometric planar shading
    const grad = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
    grad.addColorStop(0, `rgb(${clampByte(r + 16)}, ${clampByte(g + 14)}, ${clampByte(b + 10)})`);
    grad.addColorStop(1, `rgb(${clampByte(r - 18)}, ${clampByte(g - 18)}, ${clampByte(b - 16)})`);

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) {
      ctx.lineTo(pts[k][0], pts[k][1]);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    if (params.lineWeight > 5) {
      ctx.strokeStyle = `rgba(22, 20, 18, ${(params.lineWeight / 100) * 0.65})`;
      ctx.lineWidth = Math.max(0.6, (params.lineWeight / 100) * 1.5);
      ctx.stroke();
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p00 = grid[r][c];
      const p10 = grid[r][c + 1];
      const p01 = grid[r + 1][c];
      const p11 = grid[r + 1][c + 1];
      if (rng() > 0.5) {
        drawFacet([p00, p10, p11]);
        drawFacet([p00, p11, p01]);
      } else {
        drawFacet([p00, p10, p01]);
        drawFacet([p10, p11, p01]);
      }
    }
  }
}

function renderPopArt(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, lum } = field;
  const imgData = ctx.createImageData(width, height);
  const out = imgData.data;

  // Step 1: High-contrast 5-level silkscreen posterization
  for (let i = 0; i < width * height; i++) {
    const l = lum[i];
    const band = Math.min(4, Math.floor(l * 5));
    const col = paletteRgb[band];
    const idx = i * 4;
    out[idx] = col.r;
    out[idx + 1] = col.g;
    out[idx + 2] = col.b;
    out[idx + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Step 2: Ben-Day halftone dot matrix in midtones
  const spacing = Math.max(5, Math.round(5 + (params.brushScale / 100) * 9));
  const dotInk = paletteRgb[1];
  ctx.fillStyle = `rgba(${dotInk.r}, ${dotInk.g}, ${dotInk.b}, 0.55)`;

  for (let y = 0; y < height; y += spacing) {
    const offset = ((y / spacing) % 2) * (spacing * 0.5);
    for (let x = offset; x < width; x += spacing) {
      const ix = Math.min(width - 1, Math.round(x));
      const iy = Math.min(height - 1, Math.round(y));
      const l = lum[iy * width + ix];
      if (l > 0.15 && l < 0.88) {
        const radius = (1 - l) * (spacing * 0.36);
        if (radius > 0.7) {
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Step 3: Bold comic ink outlines
  overlaySobelContours(ctx, field, params.lineWeight, paletteRgb[0], 0.18);
}

function renderUkiyoe(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum } = field;
  const rng = createRng(1831);
  const imgData = ctx.createImageData(width, height);
  const out = imgData.data;

  // Flat mineral woodblock ink zones with subtle washi grain
  for (let i = 0; i < width * height; i++) {
    const levels = 6;
    const qLum = Math.round(lum[i] * levels) / levels;
    const pCol = samplePalette(paletteRgb, qLum);
    const idx = i * 4;
    const grain = (rng() - 0.5) * 10;

    out[idx] = clampByte(adjusted[idx] * 0.32 + pCol.r * 0.68 + grain);
    out[idx + 1] = clampByte(adjusted[idx + 1] * 0.32 + pCol.g * 0.68 + grain);
    out[idx + 2] = clampByte(adjusted[idx + 2] * 0.32 + pCol.b * 0.68 + grain);
    out[idx + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Sumi-e carved woodblock outline
  overlaySobelContours(ctx, field, params.lineWeight, { r: 24, g: 24, b: 28 }, 0.15);
  drawCanvasGrain(ctx, width, height, 0.09, true);
}

function renderPointillism(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum } = field;
  const rng = createRng(1886);

  // Warm primed gesso background
  const ground = paletteRgb[4];
  ctx.fillStyle = `rgb(${ground.r}, ${ground.g}, ${ground.b})`;
  ctx.fillRect(0, 0, width, height);

  const radius = Math.max(1.6, 1.5 + (params.brushScale / 100) * 4.2);
  const step = Math.max(3, Math.round(radius * 1.45));

  const coords: Array<[number, number]> = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      coords.push([
        Math.min(width - 1, Math.max(0, Math.round(x + (rng() - 0.5) * step))),
        Math.min(height - 1, Math.max(0, Math.round(y + (rng() - 0.5) * step))),
      ]);
    }
  }
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }

  for (const [px, py] of coords) {
    const i = py * width + px;
    const idx = i * 4;
    const pCol = samplePalette(paletteRgb, lum[i]);

    // Primary color dot
    const r = clampByte(adjusted[idx] * 0.65 + pCol.r * 0.35);
    const g = clampByte(adjusted[idx + 1] * 0.65 + pCol.g * 0.35);
    const b = clampByte(adjusted[idx + 2] * 0.65 + pCol.b * 0.35);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.arc(px, py, radius * (0.8 + rng() * 0.4), 0, Math.PI * 2);
    ctx.fill();

    // Adjacent chromoluminarist complementary micro-dot
    const shift = (rng() - 0.5) * 44;
    ctx.fillStyle = `rgba(${clampByte(r + shift)}, ${clampByte(g - shift * 0.4)}, ${clampByte(
      b - shift * 0.7
    )}, 0.72)`;
    ctx.beginPath();
    ctx.arc(
      px + (rng() - 0.5) * radius * 1.4,
      py + (rng() - 0.5) * radius * 1.4,
      radius * 0.65,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function renderChiaroscuro(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum } = field;
  const imgData = ctx.createImageData(width, height);
  const out = imgData.data;

  const cx = width * 0.48;
  const cy = height * 0.44;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const idx = i * 4;
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const vignette = Math.max(0.18, 1 - Math.pow(dist, 1.55) * 0.85);

      // Exponential shadow crush + golden oil glaze
      const shapedLum = Math.pow(Math.max(0, lum[i] * vignette), 1.35);
      const pCol = samplePalette(paletteRgb, shapedLum);

      out[idx] = clampByte((adjusted[idx] * 0.42 + pCol.r * 0.58) * (0.45 + shapedLum * 0.72));
      out[idx + 1] = clampByte(
        (adjusted[idx + 1] * 0.42 + pCol.g * 0.58) * (0.4 + shapedLum * 0.72)
      );
      out[idx + 2] = clampByte(
        (adjusted[idx + 2] * 0.42 + pCol.b * 0.58) * (0.35 + shapedLum * 0.72)
      );
      out[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  drawCanvasGrain(ctx, width, height, 0.08, true);
}

function renderFauvism(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, lum, edgeAngle } = field;
  const rng = createRng(1906);

  // Wild non-naturalistic color mapping by luminance band
  const baseImg = ctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const pCol = samplePalette(paletteRgb, lum[i]);
    baseImg.data[idx] = pCol.r;
    baseImg.data[idx + 1] = pCol.g;
    baseImg.data[idx + 2] = pCol.b;
    baseImg.data[idx + 3] = 255;
  }
  ctx.putImageData(baseImg, 0, 0);

  const scale = 0.5 + (params.brushScale / 100) * 1.4;
  const step = Math.max(5, Math.round(8 * scale));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const px = Math.min(width - 1, Math.max(0, Math.round(x + (rng() - 0.5) * step)));
      const py = Math.min(height - 1, Math.max(0, Math.round(y + (rng() - 0.5) * step)));
      const i = py * width + px;
      const pCol = samplePalette(paletteRgb, Math.max(0, Math.min(1, lum[i] + (rng() - 0.5) * 0.14)));
      const angle = edgeAngle[i] + Math.PI / 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(${pCol.r}, ${pCol.g}, ${pCol.b}, 0.84)`;
      ctx.fillRect(-step * 0.9, -step * 0.4, step * 1.8, step * 0.8);
      ctx.restore();
    }
  }

  overlaySobelContours(ctx, field, params.lineWeight, paletteRgb[0], 0.24);
}

function renderTopographicInk(
  ctx: CanvasRenderingContext2D,
  field: FieldAnalysis,
  params: FilterParams,
  paletteRgb: RGB[]
) {
  const { width, height, adjusted, lum, edgeMag } = field;
  const rng = createRng(2024);

  // Tinted mineral paper base with selective accent highlights (pale blue-gray + chrome yellow)
  const imgData = ctx.createImageData(width, height);
  const out = imgData.data;

  const levels = Math.max(5, Math.round(11 - (params.brushScale / 100) * 5));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const l = lum[i];
      const q = Math.floor(l * levels) / levels;
      const pCol = samplePalette(paletteRgb, Math.min(1, q + 0.12));

      // Blend subtle paper grain & source tone
      const idx = i * 4;
      const grain = (rng() - 0.5) * 8;
      let r = adjusted[idx] * 0.22 + pCol.r * 0.78 + grain;
      let g = adjusted[idx + 1] * 0.22 + pCol.g * 0.78 + grain;
      let b = adjusted[idx + 2] * 0.22 + pCol.b * 0.78 + grain;

      // Topographic isoline contour when luminance crosses quantization threshold
      const rightL = x < width - 1 ? lum[i + 1] : l;
      const downL = y < height - 1 ? lum[i + width] : l;
      const bandHere = Math.floor(l * levels);
      const bandRight = Math.floor(rightL * levels);
      const bandDown = Math.floor(downL * levels);

      if (bandHere !== bandRight || bandHere !== bandDown) {
        const inkAlpha = Math.min(0.85, (params.lineWeight / 100) * 0.72);
        r = r * (1 - inkAlpha) + paletteRgb[0].r * inkAlpha;
        g = g * (1 - inkAlpha) + paletteRgb[0].g * inkAlpha;
        b = b * (1 - inkAlpha) + paletteRgb[0].b * inkAlpha;
      }

      // Fine cross-hatching in deep shadow zones
      if (l < 0.36 && ((x + y) % 5 === 0 || (l < 0.2 && (x - y + height) % 5 === 0))) {
        const hatchAlpha = 0.45 * (params.lineWeight / 100);
        r = r * (1 - hatchAlpha) + paletteRgb[0].r * hatchAlpha;
        g = g * (1 - hatchAlpha) + paletteRgb[0].g * hatchAlpha;
        b = b * (1 - hatchAlpha) + paletteRgb[0].b * hatchAlpha;
      }

      out[idx] = clampByte(r);
      out[idx + 1] = clampByte(g);
      out[idx + 2] = clampByte(b);
      out[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Expressive Sobel ink outlines
  if (edgeMag.length > 0) {
    overlaySobelContours(ctx, field, params.lineWeight, paletteRgb[0], 0.14);
  }
}

export function renderArtisticCanvas(
  sourceImage: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  options: RenderOptions
): { width: number; height: number } {
  const maxDim = options.maxDimension ?? 920;
  const natW = sourceImage.naturalWidth || sourceImage.width;
  const natH = sourceImage.naturalHeight || sourceImage.height;

  const scale = Math.min(1, maxDim / Math.max(natW, natH));
  const width = Math.max(1, Math.round(natW * scale));
  const height = Math.max(1, Math.round(natH * scale));

  targetCanvas.width = width;
  targetCanvas.height = height;

  const ctx = targetCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { width, height };

  // Draw original photo into offscreen/source buffer
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) return { width, height };

  srcCtx.drawImage(sourceImage, 0, 0, width, height);
  const sourceData = srcCtx.getImageData(0, 0, width, height);

  const field = analyzeImage(sourceData, options.params);
  const paletteRgb = options.palette.map(hexToRgb);

  switch (options.algorithm) {
    case "impressionism":
      renderImpressionism(ctx, field, options.params, paletteRgb);
      break;
    case "postimpressionism":
      renderPostImpressionism(ctx, field, options.params, paletteRgb);
      break;
    case "expressionism":
      renderExpressionism(ctx, field, options.params, paletteRgb);
      break;
    case "cubism":
      renderCubism(ctx, field, options.params, paletteRgb);
      break;
    case "popart":
      renderPopArt(ctx, field, options.params, paletteRgb);
      break;
    case "ukiyoe":
      renderUkiyoe(ctx, field, options.params, paletteRgb);
      break;
    case "pointillism":
      renderPointillism(ctx, field, options.params, paletteRgb);
      break;
    case "chiaroscuro":
      renderChiaroscuro(ctx, field, options.params, paletteRgb);
      break;
    case "fauvism":
      renderFauvism(ctx, field, options.params, paletteRgb);
      break;
    case "topographic_ink":
      renderTopographicInk(ctx, field, options.params, paletteRgb);
      break;
  }

  // Blend rendered artwork with original photo based on params.intensity (0..100)
  const blend = Math.max(0, Math.min(1, options.params.intensity / 100));
  if (blend < 0.99) {
    const rendered = ctx.getImageData(0, 0, width, height);
    const rData = rendered.data;
    const oData = sourceData.data;
    for (let i = 0; i < rData.length; i += 4) {
      rData[i] = clampByte(oData[i] * (1 - blend) + rData[i] * blend);
      rData[i + 1] = clampByte(oData[i + 1] * (1 - blend) + rData[i + 1] * blend);
      rData[i + 2] = clampByte(oData[i + 2] * (1 - blend) + rData[i + 2] * blend);
    }
    ctx.putImageData(rendered, 0, 0);
  }

  return { width, height };
}
