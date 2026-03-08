// Renders minimal SVG error messages for 4xx/5xx responses
import type { ThemeName } from '../types/options.js';

export function renderErrorSVG(status: number, message: string, theme: ThemeName): string {
  const bg = theme === 'dark' ? '#0d1117' : '#ffffff';
  const text = theme === 'dark' ? '#c9d1d9' : '#24292f';
  const border = theme === 'dark' ? '#30363d' : '#d0d7de';
  const accent = status >= 500 ? '#f78166' : '#ffd33d';
  const muted = theme === 'dark' ? '#8b949e' : '#656d76';
  const safeMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120">
  <title>Error ${status}</title>
  <rect width="400" height="120" rx="8" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="20" y="44" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="28" font-weight="bold" fill="${accent}">${status}</text>
  <text x="20" y="72" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="14" fill="${text}">${safeMessage}</text>
  <text x="20" y="96" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="12" fill="${muted}">GitCity Embed</text>
</svg>`;
}
