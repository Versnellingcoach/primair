// Herschrijft absolute paden in dist/ naar een subpad, voor de demo op GitHub Pages
// (https://<organisatie>.github.io/<repo>/). Niet gebruikt voor Vercel.
import { readFileSync, writeFileSync, readdirSync, statSync, writeFileSync as touch } from "node:fs";
import { join } from "node:path";

const base = (process.argv[2] || "").replace(/\/$/, "");
if (!base.startsWith("/")) { console.error("Gebruik: node scripts/rebase.mjs /repo-naam"); process.exit(1); }
const dist = new URL("../dist/", import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const fix = (u) => (u.startsWith("/") && !u.startsWith("//") ? base + u : u);

let n = 0;
for (const f of walk(dist)) {
  if (f.endsWith(".html")) {
    let s = readFileSync(f, "utf8");
    s = s.replace(/\s(href|src|poster)="([^"]*)"/g, (m, a, u) => ` ${a}="${fix(u)}"`);
    s = s.replace(/\ssrcset="([^"]*)"/g, (m, v) => ` srcset="${v.split(",").map((p) => { const [u, ...r] = p.trim().split(/\s+/); return [fix(u), ...r].join(" "); }).join(", ")}"`);
    writeFileSync(f, s); n++;
  } else if (f.endsWith(".css")) {
    writeFileSync(f, readFileSync(f, "utf8").replace(/url\((["']?)(\/[^"')]*)\1\)/g, (m, q, u) => `url(${q}${fix(u)}${q})`)); n++;
  }
}
touch(join(dist, ".nojekyll"), "");
console.log(`${n} bestanden herschreven naar ${base}`);
