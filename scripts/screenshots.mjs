// Maakt schermafbeeldingen voor visuele review (alleen in CI).
// De afbeeldingen komen als artifact beschikbaar en worden ook als base64 gelogd.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const pages = (process.env.PAGES || "index,aanpak,cases,team,brabant").split(",");
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobiel", width: 390, height: 844 },
];
mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto(`http://localhost:4321/${p}.html`, { waitUntil: "networkidle" });
    // Lazy-loaded afbeeldingen laden: scroll de hele pagina door.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    const file = `screenshots/${p}-${vp.name}.jpg`;
    await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 55 });
    if (process.env.LOG_BASE64 !== "0") {
      console.log(`=====BEGIN ${file}=====`);
      console.log(readFileSync(file).toString("base64"));
      console.log(`=====END ${file}=====`);
    }
  }
  await ctx.close();
}
await browser.close();
