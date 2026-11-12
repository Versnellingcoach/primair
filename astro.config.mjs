import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

// Bestanden waarvoor nog geen gebruikstoestemming is bevestigd (zie src/data/*.json)
// worden na de build uit de output gehaald, behalve op afgeschermde previews.
function zonderToestemming() {
  return {
    name: "zonder-toestemming",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        if (process.env.VERCEL_ENV === "preview" || process.env.SHOW_UNCONFIRMED === "true") return;
        const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
        const site = read("./src/data/site.json");
        const klanten = read("./src/data/klanten.json");
        const out = fileURLToPath(dir);
        const weg = [];
        if (site.video && !site.video.toestemming) weg.push(site.video.src, site.video.poster);
        for (const k of klanten) if (k.logo && !k.toestemming) weg.push(k.logo);
        for (const p of weg) rmSync(join(out, p), { force: true });
        if (weg.length) logger.info(`${weg.length} bestand(en) zonder bevestigde toestemming niet gepubliceerd`);
      },
    },
  };
}

export default defineConfig({
  site: "https://versnellingscoach.nl",
  trailingSlash: "never",
  build: {
    format: "file",            // /aanpak.html, door Vercel geserveerd als /aanpak (cleanUrls)
    inlineStylesheets: "never" // alle CSS als extern bestand: strikte Content-Security-Policy mogelijk
  },
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
  integrations: [
    sitemap({ filter: (page) => !page.includes("/404") }),
    zonderToestemming(),
  ],
});
