import data from "./site.json";
import coachData from "./coaches.json";

export interface Address { street: string; postalCode: string; city: string }
export interface Video { src: string; poster: string; captions?: string; duration: string; uploadDate: string }

export interface Credit { label: string; name: string; url: string | null; logo: string | null }

export const site = data as typeof data & {
  credits: Credit[];
  owner: { name: string; address: Address | null; kvk: string | null; btw: string | null };
  video: Video | null;
};
export const coaches = coachData;
export const telHref = "tel:" + site.phone.e164;

export const nav = [
  { href: "/aanpak", label: "Aanpak" },
  { href: "/cases", label: "Cases" },
  { href: "/trainingen", label: "Trainingen" },
  { href: "/brabant", label: "Subsidie Brabant" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
];

export const kennismakingBody = "Beste Versnellingscoach,\n\nIk wil graag kennismaken en ons woningbouwproject bespreken.\n\nOrganisatie:\nProject en aantal woningen:\nWaar loopt het nu vast:\nTelefoonnummer:\n";

const defaultBody = "Beste Versnellingscoach,\n\n\n\nOrganisatie:\nTelefoonnummer:\n";

/** Mailto-link met passend onderwerp; wordt bij de build gerenderd en werkt dus ook zonder JavaScript. */
export function mail(subject: string, body: string = defaultBody): string {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const kennismaking = mail("Kennismaking Versnellingscoach", kennismakingBody);

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

export function videoSchema() {
  const v = site.video;
  if (!v) return [];
  return [{
    "@type": "VideoObject",
    name: "Zo brengt een Versnellingscoach woningbouw in beweging",
    description: "Op de bouwplaats van Blossem in Breda laat Marleen Zantingh zien hoe een onafhankelijke procesregisseur gemeente, ontwikkelaar en woningcorporatie samen laat werken.",
    thumbnailUrl: site.url + v.poster,
    contentUrl: site.url + v.src,
    uploadDate: v.uploadDate,
    duration: v.duration,
    inLanguage: "nl-NL",
  }];
}
