// Maakt schermafbeeldingen voor visuele review (alleen in CI).
// De afbeeldingen komen als artifact beschikbaar en worden ook als base64 gelogd.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const pages = (process.env.PAGES || "index,aanbod,aanbod/projecten-versnellen,aanbod/organisaties-versterken,aanbod/opleiden-en-trainen,subsidie,contact,cases").split(",");
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
    // Elementen die buiten het scherm uitsteken (horizontale scroll) melden.
    const breed = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth <= w) return [];
      return [...document.querySelectorAll("body *")]
        .filter((el) => el.getBoundingClientRect().right > w + 1 && getComputedStyle(el).position !== "fixed" && !el.closest(".marquee"))
        .slice(0, 8)
        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} (${Math.round(el.getBoundingClientRect().right)}px)`);
    });
    if (breed.length) console.log(`OVERFLOW ${p} ${vp.name}: ${breed.join(" | ")}`);
    const file = `screenshots/${p.replace(/\//g, "_")}-${vp.name}.jpg`;
    await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 55 });
    if (process.env.LOG_BASE64 !== "0") {
      console.log(`=====BEGIN ${file}=====`);
      console.log(readFileSync(file).toString("base64"));
      console.log(`=====END ${file}=====`);
    }
  }
  await ctx.close();
}

// Interactietests: menu, submenu, uitklapblokken, rekentool, bel- en mailknoppen en doorverwijzingen.
const fouten = [];
const check = (ok, wat) => { console.log(`${ok ? "CHECK OK  " : "CHECK FOUT"} ${wat}`); if (!ok) fouten.push(wat); };
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:4321/index.html", { waitUntil: "networkidle" });
  const btn = page.locator(".nav-sub-btn");
  await btn.click();
  check(await page.locator(".nav-sub").isVisible() && (await btn.getAttribute("aria-expanded")) === "true", "desktop: submenu Aanbod opent met de knop");
  await page.keyboard.press("Escape");
  check((await btn.getAttribute("aria-expanded")) === "false", "desktop: submenu sluit met Escape");
  await page.locator(".nav-groep > a").hover();
  check(await page.locator(".nav-sub").isVisible(), "desktop: submenu opent bij hover");
  check((await page.locator(".aanbod-kaart").count()) === 3, "homepage: drie aanbodkaarten");
  // Rekentool
  const calc = page.locator("[data-calc]");
  const eerst = await calc.locator("[data-calc-out]").textContent();
  await calc.locator('input[value="1-10"]').check({ force: true });
  const na = await calc.locator("[data-calc-out]").textContent();
  const href = decodeURIComponent(await calc.locator("[data-calc-mail]").getAttribute("href"));
  check(eerst !== na && /15\.000/.test(na), `rekentool: uitkomst wisselt per staffel (${eerst} → ${na})`);
  check(href.includes("Aantal woningen: 1 tot 10 woningen") && href.includes("Tijdwinst uit de praktijk"), "rekentool: mail bevat gekozen staffel, indicatie en tijdwinst");
  await page.keyboard.press("Tab");
  await calc.locator('input[value="1-10"]').focus();
  await page.keyboard.press("ArrowRight");
  check((await calc.locator('input[name="staffel"]:checked').getAttribute("value")) === "11-25", "rekentool: staffel kiezen met pijltjestoetsen");
  check(/^tel:\+31/.test(await calc.locator('a[href^="tel:"]').getAttribute("href")), "rekentool: belknop");
  // Uitklapblokken met toetsenbord
  await page.goto("http://localhost:4321/aanbod/projecten-versnellen.html", { waitUntil: "networkidle" });
  const sum = page.locator("details.uitklap summary").first();
  await sum.focus();
  await page.keyboard.press("Enter");
  check(await page.locator("details.uitklap").first().evaluate((d) => d.open), "uitklapblok opent met Enter");
  await page.locator("details.uitklap summary").nth(3).click();
  check(await page.locator("details.uitklap").nth(3).evaluate((d) => d.open), "uitklapblok opent met klik");
  // Doorverwijzing met anker
  await page.goto("http://localhost:4321/aanpak.html#breder");
  await page.waitForURL(/projecten-versnellen/);
  check(page.url().endsWith("#breder"), `/aanpak#breder → ${page.url()}`);
  await page.goto("http://localhost:4321/trainingen.html#inhousetraining");
  await page.waitForURL(/opleiden-en-trainen/);
  check(page.url().endsWith("#inhousetraining"), `/trainingen#inhousetraining → ${page.url()}`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto("http://localhost:4321/index.html", { waitUntil: "networkidle" });
  await page.locator(".menu-btn").tap();
  check(await page.locator("#hoofdmenu").isVisible(), "mobiel: menu opent");
  check(await page.locator(".nav-sub a").first().isVisible(), "mobiel: onderdelen van Aanbod zichtbaar in het menu");
  await page.screenshot({ path: "screenshots/menu-mobiel.jpg", type: "jpeg", quality: 55 });
  if (process.env.LOG_BASE64 !== "0") {
    console.log("=====BEGIN screenshots/menu-mobiel.jpg=====");
    console.log(readFileSync("screenshots/menu-mobiel.jpg").toString("base64"));
    console.log("=====END screenshots/menu-mobiel.jpg=====");
  }
  await page.locator(".menu-btn").tap();
  await page.goto("http://localhost:4321/aanbod/projecten-versnellen.html#breder", { waitUntil: "networkidle" });
  await page.locator("details.uitklap summary").nth(1).tap();
  check(await page.locator("details.uitklap").nth(1).evaluate((d) => d.open), "mobiel: uitklapblok opent met tikken");
  await page.goto("http://localhost:4321/index.html#rekentool", { waitUntil: "networkidle" });
  await page.locator(".staffels .segment-optie").nth(5).tap();
  check(/40\.000/.test(await page.locator("[data-calc-out]").textContent()), "mobiel: staffel kiezen met tikken");
  await page.locator(".fab-toggle").tap();
  check(await page.locator("#contactpaneel").isVisible(), "mobiel: contactbolletje opent");
  check(/^mailto:/.test(await page.locator('#contactpaneel a[href^="mailto:"]').getAttribute("href")), "mobiel: mailknop in contactpaneel");
  await ctx.close();
}
await browser.close();
if (fouten.length) { console.log(`\n${fouten.length} interactietest(s) mislukt.`); process.exitCode = 1; }
