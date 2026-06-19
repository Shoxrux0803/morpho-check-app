/**
 * liquidGlass.js
 * iOS 26/27-style Liquid Glass effect utilities for React.
 *
 * Core idea:
 *  1. Generate a pixel-level displacement map via Canvas API
 *     (R channel = X shift, G channel = Y shift; 128 = neutral)
 *  2. Inject an SVG <filter> with feDisplacementMap into the document
 *  3. Apply  backdrop-filter: url(#id) blur(...) saturate(...) brightness(...)
 *     to a glass overlay element
 */

// ─── Browser feature detection ────────────────────────────────────────────────
export const supportsBackdropFilterUrl = (() => {
  if (typeof document === 'undefined') return false;
  const el = document.createElement('div');
  el.style.cssText = 'backdrop-filter: url(#t)';
  const v = el.style.backdropFilter || el.style.webkitBackdropFilter || '';
  return v.startsWith('url');
})();

// ─── Monotone ID counter ───────────────────────────────────────────────────────
let _cnt = 0;
export const nextFilterId = () => `lgf-${++_cnt}`;

// ─── Singleton SVG container in <body> for all injected filters ───────────────
let _svgRoot = null;
function getSvgRoot() {
  if (_svgRoot && document.body.contains(_svgRoot)) return _svgRoot;
  _svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  _svgRoot.id = 'lg-svg-root';
  Object.assign(_svgRoot.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '0px',
    height: '0px',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: -1,
  });
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  _svgRoot.appendChild(defs);
  document.body.prepend(_svgRoot);
  return _svgRoot;
}

// ─── Canvas-based displacement map generator ──────────────────────────────────
/**
 * Creates a displacement map where:
 *   - Left/Right edges pull pixels outward (convex glass)
 *   - Top/Bottom edges pull pixels outward
 *   - Center pixels are undisturbed (R=128, G=128)
 *
 * @param {number} w - width in pixels
 * @param {number} h - height in pixels
 * @param {number} edge - edge fraction (0–1), default 0.28
 * @returns {string} PNG data URL
 */
export function generateDispMap(w, h, edge = 0.28) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = ctx.createImageData(w, h);
  const d = img.data;
  const ex = w * edge;
  const ey = h * edge;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // X displacement — left edge negative (dark), right positive (bright)
      let dx = 0;
      if (x < ex)          dx = -(1 - x / ex);
      else if (x > w - ex) dx =  (x - (w - ex)) / ex;

      // Y displacement — top edge negative, bottom positive
      let dy = 0;
      if (y < ey)          dy = -(1 - y / ey);
      else if (y > h - ey) dy =  (y - (h - ey)) / ey;

      // Smooth ease curve (power ≈ 0.62)
      dx = Math.sign(dx) * Math.pow(Math.abs(dx), 0.62);
      dy = Math.sign(dy) * Math.pow(Math.abs(dy), 0.62);

      d[i]     = ((dx * 0.5 + 0.5) * 255) | 0; // R → X
      d[i + 1] = ((dy * 0.5 + 0.5) * 255) | 0; // G → Y
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

// ─── SVG filter injection ─────────────────────────────────────────────────────
/**
 * Injects (or replaces) an SVG displacement filter for the given dimensions.
 * Returns the full backdrop-filter CSS string to apply.
 *
 * @param {object} opts
 * @param {string}  opts.filterId
 * @param {number}  opts.width
 * @param {number}  opts.height
 * @param {number}  opts.strength  - displacement scale (px equivalent)
 * @param {number}  opts.saturate
 * @param {number}  opts.brightness
 * @param {number}  opts.blur
 * @param {number}  opts.chromaticAberration
 * @returns {string}  backdrop-filter value
 */
export function injectFilter({
  filterId,
  width,
  height,
  strength = 80,
  saturate = 1.5,
  brightness = 1.1,
  blur = 0,
  chromaticAberration = 0,
  edge = 0.28,
}) {
  if (!supportsBackdropFilterUrl) {
    // Graceful fallback: plain blur + saturation
    return `blur(${Math.max(blur, width / 12)}px) saturate(180%)`;
  }

  const root = getSvgRoot();
  const defs = root.querySelector('defs');

  // Remove stale filter
  document.getElementById(filterId)?.remove();

  const mapUrl = generateDispMap(width, height, edge);
  if (!mapUrl) return `blur(${blur}px) saturate(180%)`;

  // Build chromatic aberration channels if requested
  const cabR  = chromaticAberration > 0 ? chromaticAberration : 0;
  const cabB  = chromaticAberration > 0 ? -chromaticAberration : 0;

  const filterEl = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filterEl.id = filterId;
  filterEl.setAttribute('color-interpolation-filters', 'sRGB');
  filterEl.setAttribute('x', '-5%');
  filterEl.setAttribute('y', '-5%');
  filterEl.setAttribute('width', '110%');
  filterEl.setAttribute('height', '110%');

  filterEl.innerHTML = `
    <feImage
      href="${mapUrl}"
      width="${width}"
      height="${height}"
      preserveAspectRatio="none"
      result="map"
    />
    <feDisplacementMap
      in="SourceGraphic"
      in2="map"
      scale="${strength}"
      xChannelSelector="R"
      yChannelSelector="G"
      result="displaced"
    />
    ${chromaticAberration > 0 ? `
    <!-- Chromatic aberration: split R/B channels -->
    <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength + cabR}" xChannelSelector="R" yChannelSelector="G" result="dispR"/>
    <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength + cabB}" xChannelSelector="R" yChannelSelector="G" result="dispB"/>
    <feBlend in="dispR" in2="displaced" mode="screen" result="blendRed"/>
    <feBlend in="dispB" in2="blendRed" mode="multiply" result="displaced"/>
    ` : ''}
  `;

  defs.appendChild(filterEl);

  const blurStr = blur > 0 ? `blur(${blur}px) ` : '';
  return `url(#${filterId}) ${blurStr}brightness(${brightness}) saturate(${saturate})`;
}

export function removeFilter(filterId) {
  document.getElementById(filterId)?.remove();
}
