// Utilities for parsing nested JSON block data and resolving image URLs.
import { defaultDataFor, getBlockTypeMeta, type BlockType } from './types';

export type BlockData = Record<string, any>;

export function parseBlockData(raw: string, type?: string): BlockData {
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) parsed = {};
  // merge defaults so new fields are present
  if (type) {
    const def = defaultDataFor(type as BlockType);
    return deepMerge(def, parsed);
  }
  return parsed;
}

function deepMerge(base: any, override: any): any {
  if (Array.isArray(base)) {
    return Array.isArray(override) ? override : base;
  }
  if (base && typeof base === 'object') {
    const out: any = { ...base };
    if (override && typeof override === 'object') {
      for (const k of Object.keys(override)) {
        out[k] = deepMerge(base[k], override[k]);
      }
    }
    return out;
  }
  return override === undefined ? base : override;
}

// Resolve a stored image url. Empty string -> placeholder.
export function resolveImage(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  return '/' + url.replace(/^\/+/, '');
}

// Placeholder SVG data URL for missing images (audio-themed).
export function placeholder(text = 'AudioCenter'): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='%23171717'/>
        <stop offset='1' stop-color='%23000000'/>
      </linearGradient>
    </defs>
    <rect width='1200' height='800' fill='url(%23g)'/>
    <g fill='%23404040'>
      <circle cx='600' cy='400' r='180' fill='none' stroke='%23525252' stroke-width='2'/>
      <circle cx='600' cy='400' r='120' fill='none' stroke='%23525252' stroke-width='2'/>
      <circle cx='600' cy='400' r='60' fill='%23525252'/>
    </g>
    <text x='600' y='640' font-family='Arial, sans-serif' font-size='28' fill='%23a3a3a3' text-anchor='middle'>${text}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + svg;
}

export function imageOrPlaceholder(url?: string | null, label = 'AudioCenter'): string {
  const r = resolveImage(url);
  return r || placeholder(label);
}

export { getBlockTypeMeta, defaultDataFor };
