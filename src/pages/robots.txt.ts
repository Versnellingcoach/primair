import type { APIRoute } from "astro";
import { indexable, site } from "../data/site";

// Op previews en zolang ALLOW_INDEXING niet aan staat: alle pagina's hebben noindex.
// Crawlers mogen de pagina's wel lezen, anders zien ze die noindex niet.
export const GET: APIRoute = () => {
  const lines = ["User-agent: *", "Allow: /"];
  if (indexable) lines.push("", `Sitemap: ${site.url}/sitemap-index.xml`);
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
