// Kwaliteitscontrole op de gebouwde site (dist/). Draait in CI na `npm run build`.
// Fouten laten de build falen; openstaande punten worden als waarschuwing getoond.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;
const errors = [];
const warnings = [];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

if (!existsSync(dist)) {
  console.error("dist/ bestaat niet. Draai eerst `npm run build`.");
  process.exit(1);
}

const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const exists = (urlPath) => {
  const clean = urlPath.split("#")[0].split("?")[0];
  if (clean === "/" || clean === "") return existsSync(join(dist, "index.html"));
  const p = join(dist, decodeURIComponent(clean));
  return existsSync(p) || existsSync(p + ".html");
};

const titles = new Map();
const descriptions = new Map();

for (const file of htmlFiles) {
  const rel = "/" + relative(dist, file);
  const html = readFileSync(file, "utf8");
  const is404 = rel === "/404.html";

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const h1s = html.match(/<h1[\s>]/g) || [];

  if (!title) errors.push(`${rel}: geen <title>`);
  else if (title.length > 65) warnings.push(`${rel}: title is ${title.length} tekens (advies max. 60–65)`);
  if (!desc) errors.push(`${rel}: geen meta description`);
  else if (desc.length > 160 || desc.length < 70) warnings.push(`${rel}: meta description is ${desc.length} tekens (advies 70–160)`);
  if (h1s.length !== 1) errors.push(`${rel}: ${h1s.length} keer <h1> (precies 1 verwacht)`);
  if (!/<html lang="nl-NL">/.test(html)) errors.push(`${rel}: lang="nl-NL" ontbreekt`);
  if (!is404 && !/<link rel="canonical" href="https:\/\/versnellingscoach\.nl[^"]*">/.test(html)) errors.push(`${rel}: canonical ontbreekt of verkeerd domein`);
  if (!is404 && title) {
    if (titles.has(title)) errors.push(`${rel}: dubbele title met ${titles.get(title)}`);
    titles.set(title, rel);
  }
  if (!is404 && desc) {
    if (descriptions.has(desc)) errors.push(`${rel}: dubbele description met ${descriptions.get(desc)}`);
    descriptions.set(desc, rel);
  }

  // Strikte CSP: geen inline scripts (behalve JSON-LD), geen inline styles, geen inline event-handlers.
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] || "";
    if (/type="application\/ld\+json"/.test(attrs)) {
      try { JSON.parse(m[2]); } catch { errors.push(`${rel}: ongeldige JSON-LD`); }
      continue;
    }
    if (!/\ssrc="/.test(attrs) || m[2].trim()) errors.push(`${rel}: inline script gevonden (blokkeert CSP)`);
  }
  if (/<style[\s>]/.test(html)) errors.push(`${rel}: inline <style> gevonden (blokkeert CSP)`);
  if (/\sstyle="/.test(html)) errors.push(`${rel}: style-attribuut gevonden (blokkeert CSP)`);
  if (/\son[a-z]+="/.test(html)) errors.push(`${rel}: inline event-handler gevonden (blokkeert CSP)`);

  // Afbeeldingen: alt-tekst en afmetingen (tegen layoutverschuiving).
  for (const img of html.matchAll(/<img\s[^>]*>/g)) {
    if (!/\salt="/.test(img[0])) errors.push(`${rel}: <img> zonder alt`);
    if (!/\swidth="/.test(img[0]) || !/\sheight="/.test(img[0])) warnings.push(`${rel}: <img> zonder width/height`);
  }

  // Interne links en bronnen moeten bestaan; externe links in nieuw venster met rel="noopener".
  for (const m of html.matchAll(/\s(href|src|srcset)="([^"]+)"/g)) {
    const [, attr, value] = m;
    const urls = attr === "srcset" ? value.split(",").map((s) => s.trim().split(/\s+/)[0]) : [value];
    for (const u of urls) {
      if (u.startsWith("/") && !u.startsWith("//") && !exists(u)) errors.push(`${rel}: verwijzing naar niet-bestaand ${u}`);
      if (/^http:\/\//.test(u)) errors.push(`${rel}: onveilige http-link ${u}`);
    }
  }
  for (const a of html.matchAll(/<a\s[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(a[0])) errors.push(`${rel}: target=_blank zonder rel=noopener`);
  }
}

// Vereiste bestanden.
for (const f of ["robots.txt", "sitemap-index.xml", "404.html", ".well-known/security.txt", "favicon.svg"]) {
  if (!existsSync(join(dist, f))) errors.push(`ontbrekend bestand: /${f}`);
}
const sec = existsSync(join(dist, ".well-known/security.txt")) ? readFileSync(join(dist, ".well-known/security.txt"), "utf8") : "";
const expires = sec.match(/^Expires: (.+)$/m)?.[1];
if (expires) {
  const days = (new Date(expires) - Date.now()) / 864e5;
  if (days < 0) errors.push("security.txt is verlopen: werk de Expires-datum bij");
  else if (days < 60) warnings.push(`security.txt verloopt over ${Math.round(days)} dagen`);
}

// Security headers in vercel.json.
const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const headerKeys = new Set(vercel.headers.flatMap((h) => h.headers.map((x) => x.key.toLowerCase())));
for (const k of ["content-security-policy", "strict-transport-security", "x-content-type-options", "referrer-policy", "permissions-policy", "x-frame-options"]) {
  if (!headerKeys.has(k)) errors.push(`vercel.json: header ${k} ontbreekt`);
}

// Openstaande inhoud (geen fout, wel melden voor livegang).
const site = JSON.parse(readFileSync(new URL("../src/data/site.json", import.meta.url), "utf8"));
const coaches = JSON.parse(readFileSync(new URL("../src/data/coaches.json", import.meta.url), "utf8"));
if (!site.owner.address) warnings.push("Openstaand: bedrijfsadres (src/data/site.json → owner.address)");
if (!site.owner.kvk) warnings.push("Openstaand: KvK-nummer (src/data/site.json → owner.kvk)");
if (!site.owner.btw) warnings.push("Openstaand: btw-nummer (src/data/site.json → owner.btw)");
if (!site.video) warnings.push("Openstaand: video Blossem (MP4 in public/video/ en src/data/site.json → video)");
const klanten = JSON.parse(readFileSync(new URL("../src/data/klanten.json", import.meta.url), "utf8"));
for (const k of klanten) if (!k.logo) warnings.push(`Openstaand: logo van ${k.name} (public/logos/ en src/data/klanten.json)`);
for (const c of site.credits) {
  if (!c.url) warnings.push(`Openstaand: website-link van ${c.name} (src/data/site.json → credits)`);
  if (!c.logo) warnings.push(`Openstaand: logo van ${c.name} (src/data/site.json → credits)`);
}
void coaches;

console.log(`Gecontroleerd: ${htmlFiles.length} pagina's.`);
for (const w of warnings) console.log("::warning::" + w);
for (const e of errors) console.log("::error::" + e);
if (errors.length) {
  console.log(`\n${errors.length} fout(en) gevonden.`);
  process.exit(1);
}
console.log(`Geen fouten. ${warnings.length} waarschuwing(en).`);
