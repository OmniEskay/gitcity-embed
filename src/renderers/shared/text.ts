// Safe text rendering helpers: XSS-safe escaping and SVG text element factory
export function escapeSvgText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

interface TextOpts {
  fontSize?: number;
  fontWeight?: string;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: string;
}

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export function svgText(x: number, y: number, content: string, opts: TextOpts = {}): string {
  const {
    fontSize = 14,
    fontWeight = 'normal',
    fill = '#c9d1d9',
    textAnchor = 'start',
    dominantBaseline = 'auto',
  } = opts;

  return `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${escapeSvgText(content)}</text>`;
}
