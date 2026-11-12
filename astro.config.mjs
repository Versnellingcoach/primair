import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
  ],
});
