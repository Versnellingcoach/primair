import data from "./site.json";
import coachData from "./coaches.json";
import caseData from "./cases.json";
import aanbodData from "./aanbod.json";

export interface Address { street: string; postalCode: string; city: string }
export interface Video { id: string; titel: string; beschrijving: string; coach?: string; src: string; poster: string; captions?: string; duration: string; uploadDate: string; bron: string; toestemming: boolean; ondertiteling?: boolean }

export interface Credit { label: string; name: string; url: string | null; logo: string | null }

export const site = data as typeof data & {
  credits: Credit[];
  owner: { name: string; address: Address | null; kvk: string | null; btw: string | null };
  videos: Video[];
};
export interface Coach {
  slug: string; name: string; role: string; alt: string;
  intro: string | null; achtergrond: string | null; expertise: string[]; projecten: string[];
  quote: string | null; linkedin: string | null;
}
export const coaches = coachData as Coach[];
export const cases = caseData as Array<Record<string, any>>;

/** Hoofdactie op de hele site: naar de contactpagina. */
export const start = { href: "/contact", label: "Start de versnelling" };
export const telHref = "tel:" + site.phone.e164;

/** De drie onderdelen van het aanbod (volgorde en teksten in aanbod.json). */
export const aanbod = aanbodData.map((a) => ({ ...a, href: `/aanbod/${a.id}` }));

export const nav: { href: string; label: string; sub?: { href: string; label: string }[] }[] = [
  { href: "/aanbod", label: "Aanbod", sub: aanbod.map((a) => ({ href: a.href, label: a.naam })) },
  { href: "/cases", label: "Cases" },
  { href: "/subsidie", label: "Subsidie" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
];

export const kennismakingBody = "Beste Versnellingscoach,\n\nIk wil graag kennismaken.\n\nOrganisatie:\nWaar gaat het om (project, organisatie of training):\nKorte toelichting:\nTelefoonnummer:\n";

const defaultBody = "Beste Versnellingscoach,\n\n\n\nOrganisatie:\nTelefoonnummer:\n";

/** Mailto-link met passend onderwerp; wordt bij de build gerenderd en werkt dus ook zonder JavaScript. */
export function mail(subject: string, body: string = defaultBody): string {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const kennismaking = mail("Kennismaking Versnellingscoach", kennismakingBody);

/**
 * Beeld waarvoor nog geen toestemming is bevestigd (klantlogo's, video) tonen we alleen op
 * Vercel-previews (afgeschermd) of als SHOW_UNCONFIRMED=true. Op productie blijft het weg
 * totdat in de data "toestemming": true staat.
 */
export const showUnconfirmed = process.env.VERCEL_ENV === "preview" || process.env.SHOW_UNCONFIRMED === "true";
export const mag = (item: { toestemming?: boolean }) => item.toestemming === true || showUnconfirmed;

/** Alleen indexeren op de productieomgeving als dat expliciet is aangezet (ALLOW_INDEXING=true in Vercel). */
export const indexable = process.env.VERCEL_ENV === "production" && process.env.ALLOW_INDEXING === "true";

export const orgId = site.url + "/#organisatie";
export const serviceId = site.url + "/#versnellingscoach";

export function serviceSchema(name: string, description: string, path: string) {
  return {
    "@type": "Service",
    "@id": site.url + path,
    name,
    description,
    serviceType: name,
    provider: { "@id": serviceId },
    areaServed: { "@type": "Country", name: "Nederland" },
  };
}

/** Video op id, alleen als die getoond mag worden (toestemming of preview). */
export function video(id: string): Video | null {
  const v = site.videos.find((x) => x.id === id);
  return v && mag(v) ? v : null;
}

/** Structured data voor de video's die op een pagina staan. */
export function videoSchema(...ids: string[]) {
  return ids.map(video).filter((v): v is Video => !!v).map((v) => ({
    "@type": "VideoObject",
    name: v.titel,
    description: v.beschrijving,
    thumbnailUrl: site.url + v.poster,
    contentUrl: site.url + v.src,
    uploadDate: v.uploadDate,
    duration: v.duration,
    inLanguage: "nl-NL",
  }));
}
