/**
 * LiquidGlass.js
 * React port of the iOS 26/27 Liquid Glass Astro component.
 *
 * Props:
 *   children          — content inside the glass
 *   className         — extra CSS classes
 *   style             — inline style override
 *   depth             — not used directly; strength is main lever
 *   strength          — displacement intensity (default 80)
 *   chromaticAberration — RGB channel split (default 0)
 *   blur              — extra blur on top of displacement (default 0)
 *   color             — 'transparent' | 'white' | 'black'
 *   button            — boolean; enables button-specific styling & animation
 *   inline            — boolean; renders as inline-flex span
 *   borderRadius      — pass CSS border-radius value
 */
import React, { useRef, useEffect, useCallback } from 'react';
import {
  supportsBackdropFilterUrl,
  injectFilter,
  removeFilter,
  nextFilterId,
} from '../../utils/liquidGlass';

// ─── Glass-box background tints ───────────────────────────────────────────────
function overlayBg(color, button) {
  if (color === 'white') return 'rgba(250,250,250,0.18)';
  if (color === 'black') return 'rgba(9,9,11,0.48)';
  return button ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.26)';
}

function glassBoxBg(color) {
  if (color === 'white') return 'rgba(250,250,250,0.50)';
  if (color === 'black') return 'rgba(9,9,11,0.50)';
  return 'rgba(9,9,11,0.01)';
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function LiquidGlass({
  children,
  className = '',
  style = {},
  depth = 10,
  strength = 80,
  chromaticAberration = 0,
  blur = 0,
  color = 'transparent',
  button = false,
  inline = false,
  borderRadius,
  onClick,
}) {
  const containerRef = useRef(null);
  const filterLayerRef = useRef(null);
  // Stable, unique filter ID per component instance
  const filterIdRef = useRef(null);
  if (!filterIdRef.current) filterIdRef.current = nextFilterId();
  const filterId = filterIdRef.current;

  const saturate = button ? 1.2 : 1.5;
  const brightness = button ? 1.6 : 1.1;

  // ── Redraw logic ─────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const container = containerRef.current;
    const filterLayer = filterLayerRef.current;
    if (!container || !filterLayer) return;

    const content = container.querySelector('.lg-content');
    if (!content) return;

    const rect = content.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;

    // Size the filter layer to match content
    filterLayer.style.width = `${w}px`;
    filterLayer.style.height = `${h}px`;

    const filterVal = injectFilter({
      filterId,
      width: w,
      height: h,
      strength,
      saturate,
      brightness,
      blur,
      chromaticAberration,
    });

    filterLayer.style.backdropFilter = filterVal;
    filterLayer.style.webkitBackdropFilter = filterVal;
  }, [filterId, strength, saturate, brightness, blur, chromaticAberration]);

  // ── Mount / resize observer ──────────────────────────────────────────────────
  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(redraw);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      removeFilter(filterId);
    };
  }, [redraw, filterId]);

  // ── Render ───────────────────────────────────────────────────────────────────
  const Tag = inline ? 'span' : 'div';

  return (
    <Tag
      ref={containerRef}
      className={`liquid-glass ${button ? 'lg-button' : ''} ${className}`.trim()}
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: inline ? 'inline-flex' : 'block',
        alignItems: inline ? 'center' : undefined,
        borderRadius,
        cursor: button ? 'pointer' : undefined,
        ...style,
      }}
    >
      {/* 1. Tint overlay — gives the glass its color/translucency */}
      <Tag
        className="lg-overlay-bg"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: overlayBg(color, button),
          pointerEvents: 'none',
        }}
      />

      {/* 2. Main content — sits on top */}
      <Tag
        className="lg-content"
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Tag>

      {/* 3. Filter layer — applies SVG displacement + backdrop-filter */}
      <Tag
        ref={filterLayerRef}
        className="lg-filter-layer"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: glassBoxBg(color),
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.55)',
        }}
      />
    </Tag>
  );
}
