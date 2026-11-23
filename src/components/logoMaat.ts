// Leest bij het bouwen de verhouding van een logo in public/ (SVG viewBox/width/height of PNG-header)
// en geeft de weergavemaat terug: 48 px hoog, maximaal 180 px breed. Zo reserveert de browser vóór het
// laden al precies de juiste ruimte en verspringt de schuivende banner niet als de logo's binnenkomen.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOGTE = 48;
const MAX_BREEDTE = 180;

function verhouding(pad: string): number | null {
  const bestand = join(process.cwd(), "public", pad);
  if (pad.endsWith(".png")) {
    const b = readFileSync(bestand);
    const w = b.readUInt32BE(16);
    const h = b.readUInt32BE(20);
    return w > 0 && h > 0 ? w / h : null;
  }
  if (pad.endsWith(".svg")) {
    const svg = readFileSync(bestand, "utf8");
    const tag = svg.match(/<(?:\w+:)?svg\b[^>]*>/)?.[0] ?? "";
    const vb = tag.match(/viewBox\s*=\s*["']([^"']+)["']/);
    if (vb) {
      const [, , w, h] = vb[1].trim().split(/[\s,]+/).map(Number);
      if (w > 0 && h > 0) return w / h;
    }
    const w = parseFloat(tag.match(/\swidth\s*=\s*["']([\d.]+)/)?.[1] ?? "");
    const h = parseFloat(tag.match(/\sheight\s*=\s*["']([\d.]+)/)?.[1] ?? "");
    return w > 0 && h > 0 ? w / h : null;
  }
  return null;
}

export function logoMaat(pad: string): { width: number; height: number } {
  let r: number | null = null;
  try { r = verhouding(pad); } catch { r = null; }
  if (!r) {
    console.warn(`[logobanner] Kon afmetingen van ${pad} niet lezen; valt terug op ${MAX_BREEDTE}×${HOOGTE}.`);
    return { width: MAX_BREEDTE, height: HOOGTE };
  }
  return { width: Math.min(MAX_BREEDTE, Math.round(HOOGTE * r)), height: HOOGTE };
}
