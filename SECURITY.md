# Beveiliging

Hebt u een kwetsbaarheid gevonden in versnellingscoach.nl? Meld het vertrouwelijk via office@silverpower.nl. Zie ook https://versnellingscoach.nl/.well-known/security.txt.

## Uitgangspunten

- Volledig statische site: geen server, database of beheeromgeving om aan te vallen.
- Strikte Content-Security-Policy: alleen eigen scripts, stijlen, fonts en afbeeldingen; geen inline code.
- Geen cookies, trackers of externe diensten. De rekentool rekent in de browser en verstuurt niets.
- Geen geheimen in deze repository. Eventuele sleutels horen in Vercel Environment Variables.
- Afhankelijkheden minimaal (Astro en de sitemap-integratie), bewaakt door Dependabot, npm audit en CodeQL.
