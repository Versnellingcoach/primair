# versnellingscoach.nl

Website van Versnellingscoach, een merk van Silver Power. Gebouwd met [Astro](https://astro.build) als volledig statische site, gehost op Vercel.

## Hoe het werkt

- **GitHub is de enige bron.** Elke wijziging op `main` wordt door Vercel automatisch gebouwd en gepubliceerd.
- **Wijzigen kan in de browser.** Er is geen software op je pc nodig. Open de repo op github.com en druk op `.` (punt) voor een editor in de browser, of bewerk één bestand via het potloodicoon.
- **Werk via een branch.** Elke branch en pull request krijgt van Vercel een eigen preview-link om te controleren. Pas na een groene controle gaat het naar `main`.

## Waar staat wat

| Wat je wilt wijzigen | Bestand |
|---|---|
| Telefoon, e-mail, adres, KvK, links, video | `src/data/site.json` |
| Coaches (naam, rol, ervaring) | `src/data/coaches.json` + portret in `src/assets/coaches/<slug>.jpg` |
| Trainingen | `src/data/trainingen.json` |
| Staffel van de rekentool | `src/data/staffel.json` |
| Teksten per pagina | `src/pages/*.astro` |
| Kleuren, lettertype, opmaak | `src/styles/global.css` |
| Security headers | `vercel.json` |

Een coach toevoegen: zet een staand portret (4:5) als `src/assets/coaches/<slug>.jpg` en voeg een regel toe aan `coaches.json` met dezelfde `slug`. Astro maakt er automatisch AVIF- en WebP-versies in de juiste maten van.

## Zoekmachines

De site staat standaard op **noindex**: Google indexeert niets, ook de productieomgeving niet. Indexeren gaat pas aan als in Vercel de omgevingsvariabele `ALLOW_INDEXING=true` is gezet voor Production. Previews blijven altijd op noindex.

Na livegang:

1. Zet `ALLOW_INDEXING=true` in Vercel (Settings → Environment Variables → Production) en deploy opnieuw.
2. Koppel Google Search Console en Bing Webmaster Tools en dien `https://versnellingscoach.nl/sitemap-index.xml` in.

## Controles

Bij elke push en pull request draait GitHub Actions:

- **Build en controle:** bouwt de site en controleert met `scripts/check.mjs` per pagina title, description, één H1, canonical, alt-teksten, interne links en het ontbreken van inline scripts en styles (nodig voor de strikte CSP). Openstaande inhoud verschijnt als waarschuwing.
- **npm audit:** stopt bij bekende ernstige kwetsbaarheden.
- **Lighthouse:** toegankelijkheid moet minimaal 95 scoren; SEO, best practices en performance worden gemeld.
- **CodeQL:** wekelijkse en per-wijziging codescan.
- **Dependabot:** wekelijkse updates voor npm-pakketten en GitHub Actions.

Na een wijziging in `package.json`: start onder Actions de workflow **Lockfile bijwerken** en open een pull request van de branch `lockfile-bijwerken`.

## Lokaal ontwikkelen (optioneel)

Alleen nodig voor ontwikkelaars: Node 22, dan `npm ci`, `npm run dev` en `npm run build && npm run check`.

## Checklist vóór livegang

- [ ] Bedrijfsadres, KvK- en btw-nummer in `src/data/site.json`
- [ ] Achternaam, specialisme en projectervaring van Nora en Paul
- [ ] Video Blossem (MP4, poster en ondertiteling) in `public/video/`
- [ ] Privacyverklaring juridisch laten toetsen
- [ ] Domein in Vercel: `versnellingscoach.nl` als hoofddomein, `www` met 301 daarnaartoe
- [ ] DNS: DNSSEC aan; SPF `v=spf1 -all` en DMARC `p=reject` als het domein zelf geen mail verstuurt
- [ ] `ALLOW_INDEXING=true` in Vercel Production
- [ ] Headers testen op securityheaders.com en developer.mozilla.org/observatory
- [ ] HSTS preload overwegen (hstspreload.org) als alle subdomeinen HTTPS gebruiken

> Lighthouse in CI test de gebouwde bestanden op `localhost`. De SEO-categorie scoort daar lager omdat de pagina's (bewust) op noindex staan en de canonical naar het echte domein wijst. CI controleert daarom de afzonderlijke SEO-onderdelen in plaats van de totaalscore.
