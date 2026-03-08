// SVG primitive shape generators — pure functions returning SVG string fragments

/** Regular building with window grid */
export function building(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  windowColor: string,
  litWindowColor: string,
  litRatio: number
): string {
  const parts: string[] = [];
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}"/>`);

  // Window grid
  const winW = Math.max(3, Math.floor(width * 0.18));
  const winH = Math.max(3, Math.floor(height * 0.12));
  const colGap = Math.floor(width * 0.22);
  const rowGap = Math.floor(height * 0.16);
  const cols = Math.max(1, Math.floor((width - colGap) / (winW + colGap)));
  const rows = Math.max(1, Math.floor((height - rowGap) / (winH + rowGap)));
  const xPad = Math.floor((width - cols * (winW + colGap) + colGap) / 2);

  let winIdx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const wx = x + xPad + col * (winW + colGap);
      const wy = y + rowGap + row * (winH + rowGap);
      const lit = winIdx / (rows * cols) < litRatio;
      const wColor = lit ? litWindowColor : windowColor;
      parts.push(`<rect x="${wx}" y="${wy}" width="${winW}" height="${winH}" fill="${wColor}" opacity="0.85"/>`);
      winIdx++;
    }
  }

  return parts.join('');
}

/** Skyscraper: taller building with spire */
export function skyscraper(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  windowColor: string,
  litWindowColor: string
): string {
  const parts: string[] = [];
  parts.push(building(x, y, width, height, color, windowColor, litWindowColor, 0.6));

  // Spire
  const cx = x + width / 2;
  const spireH = Math.floor(height * 0.25);
  parts.push(
    `<line x1="${cx}" y1="${y}" x2="${cx}" y2="${y - spireH}" stroke="${color}" stroke-width="2"/>`
  );
  // Antenna tip dot
  parts.push(
    `<circle cx="${cx}" cy="${y - spireH}" r="2" fill="#f78166"/>`
  );

  return parts.join('');
}

/** Horizontal road band with dashed center line */
export function road(y: number, width: number, color: string, lineColor: string): string {
  const roadH = 20;
  const dashLen = 20;
  const gap = 15;
  const centerY = y + roadH / 2;
  const parts: string[] = [
    `<rect x="0" y="${y}" width="${width}" height="${roadH}" fill="${color}"/>`,
  ];

  for (let x = 0; x < width; x += dashLen + gap) {
    parts.push(
      `<line x1="${x}" y1="${centerY}" x2="${Math.min(x + dashLen, width)}" y2="${centerY}" stroke="${lineColor}" stroke-width="1.5"/>`
    );
  }

  return parts.join('');
}

/** Arc bridge connecting two x positions */
export function bridge(x1: number, x2: number, y: number, color: string): string {
  const mx = (x1 + x2) / 2;
  const arcH = Math.min(30, Math.abs(x2 - x1) * 0.25);
  return [
    `<path d="M${x1},${y} Q${mx},${y - arcH} ${x2},${y}" fill="none" stroke="${color}" stroke-width="2"/>`,
    `<line x1="${x1}" y1="${y}" x2="${x1}" y2="${y + 8}" stroke="${color}" stroke-width="2"/>`,
    `<line x1="${x2}" y1="${y}" x2="${x2}" y2="${y + 8}" stroke="${color}" stroke-width="2"/>`,
  ].join('');
}

/** Construction crane icon */
export function crane(x: number, y: number, color: string): string {
  return [
    // Vertical mast
    `<rect x="${x - 2}" y="${y - 30}" width="4" height="30" fill="${color}"/>`,
    // Horizontal jib
    `<line x1="${x - 2}" y1="${y - 28}" x2="${x + 22}" y2="${y - 28}" stroke="${color}" stroke-width="3"/>`,
    // Counter-jib
    `<line x1="${x - 2}" y1="${y - 28}" x2="${x - 12}" y2="${y - 28}" stroke="${color}" stroke-width="2"/>`,
    // Hook cable
    `<line x1="${x + 18}" y1="${y - 28}" x2="${x + 18}" y2="${y - 14}" stroke="${color}" stroke-width="1.5"/>`,
    // Hook
    `<path d="M${x + 16},${y - 14} a2,2 0 0 0 4,0" fill="none" stroke="${color}" stroke-width="1.5"/>`,
  ].join('');
}

/** Five-pointed star */
export function star(x: number, y: number, size: number, color: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outer = ((i * 4 * Math.PI) / 5) - Math.PI / 2;
    const inner = outer + (2 * Math.PI) / 10;
    pts.push(`${(x + size * Math.cos(outer)).toFixed(1)},${(y + size * Math.sin(outer)).toFixed(1)}`);
    pts.push(
      `${(x + (size * 0.4) * Math.cos(inner)).toFixed(1)},${(y + (size * 0.4) * Math.sin(inner)).toFixed(1)}`
    );
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}"/>`;
}
