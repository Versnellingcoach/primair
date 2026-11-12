import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://versnellingscoach.nl",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [sitemap()],
});
