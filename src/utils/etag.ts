// Computes a weak ETag from SVG content using Node's built-in crypto
import { createHash } from 'crypto';

export function computeEtag(content: string): string {
  const hash = createHash('md5').update(content).digest('hex').slice(0, 16);
  return `W/"${hash}"`;
}
