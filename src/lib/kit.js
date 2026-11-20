// Shared pieces for the pages laid out from Surge's PAGE-TEMPLATES.md (first used by the
// 16 November batch: /bar, /valentines-day, /mexican-restaurant-clarksburg-md, /catering/cost).
// The look is src/components/kit/Kit.astro; this file holds the data side: the photographs with
// their one alt text each, the breadcrumb and Service schema, and the review excerpts, which are
// checked against src/data/reviews.json so a quote can never drift from what was posted.
// See DESIGN-DEBT.md entry 166.
import business from '../data/business.json';
import reviews from '../data/reviews.json';
import { roundedTotal } from './reviews.js';
import { RESTAURANT_ID } from './authored.js';

// Real photographs only, already in public/images. `s` marks one that has an 800px WebP beside it
// (<name>-800.webp). One alt per photo, written from the photo.
export const PHOTOS = {
  barRoom: { src: '/images/site/dining-room-night.webp', w: 1500, h: 880, s: true, alt: 'The bar area on a busy night: guests at painted tables under a flower ceiling and woven lanterns, the lit heart-shaped back bar and TVs along the wall' },
  barFull: { src: '/images/site/friendsgiving/friendsgiving-full-bar-area.webp', w: 1600, h: 1069, s: true, alt: 'The bar area full from end to end, football on the TVs either side of the glowing back bar, flowers and lanterns overhead' },
  cantarito: { src: '/images/dishes/cantarito.jpg', w: 1024, h: 1536, s: true, alt: 'A bartender garnishing three Cantaritos in painted clay cups with chili-salt rims and citrus' },
  margaritas: { src: '/images/dishes/big-mami.jpg', w: 1600, h: 2400, s: true, alt: 'A wooden board of handcrafted margaritas in six colors, with chamoy and Tajín rims and fresh berries' },
  tequilaFlight: { src: '/images/site/tequila-flight-lg.webp', w: 1254, h: 1254, alt: 'Three tequila pours on a dark wooden flight board with chili-salt rims, lime wedges and a dish of salt' },
  longTable: { src: '/images/site/watch-party-room.jpg', w: 1200, h: 1600, s: true, alt: 'Fans in jerseys filling a long table in the bar area on a match night, TVs glowing above the back bar' },
  mexicanRoom: { src: '/images/site/mexican-room.webp', w: 1400, h: 933, s: true, alt: 'The Mexican Room set for dinner: long tables, painted wooden chairs, a star lantern and hand-painted portraits on orange walls' },
  mariachi: { src: '/images/site/addon-mariachi-ensemble.jpg', w: 1600, h: 900, s: true, alt: 'A seven-piece mariachi in burgundy charro suits with guitars, a violin and a trumpet, in front of a wall of flowers' },
  fajitaMazatlan: { src: '/images/dishes/fajita-mazatlan.jpg', w: 1600, h: 722, s: true, alt: 'A fajita skillet of shrimp, steak and chicken with tortillas, rice, beans and guacamole on the side' },
  volcan: { src: '/images/dishes/volcan-de-xocolate.jpg', w: 1600, h: 910, s: true, alt: 'A warm chocolate cake topped with vanilla ice cream, chocolate sauce and candied pecans' },
  chimichanga: { src: '/images/dishes/cheesecake-chimichanga.jpg', w: 1594, h: 1026, s: true, alt: 'A fried cheesecake chimichanga split open over ice cream, covered in wild berry sauce with a mint leaf' },
  exterior: { src: '/images/site/exterior-dusk.webp', w: 1058, h: 595, s: true, alt: "The front of Señor Tequila's at dusk: the lit green sign over the entrance, mariachi statues by the door and string lights over the patio" },
  quesabirria: { src: '/images/dishes/quesabirrias-hero.jpg', w: 1588, h: 751, s: true, alt: 'Quesabirria tacos topped with radish and cilantro, with cups of consommé and salsa and wedges of lime' },
  patio: { src: '/images/site/patio-tulum.webp', w: 1200, h: 675, s: true, alt: 'The outdoor patio set with tables under teal umbrellas and string lights' },
  platters: { src: '/images/site/quince-platters.jpg', w: 1400, h: 1050, s: true, alt: 'A table covered edge to edge with party platters: a molcajete, tacos, tortas, shrimp, fries and margaritas' },
  intlRoom: { src: '/images/site/international-room-long-tables.webp', w: 1600, h: 900, s: true, alt: 'The International Room: long tables of hand-painted chairs under a turquoise wall hung with painted masks' },
  cincoTacos: { src: '/images/dishes/tacos-cinco-mamalones.jpg', w: 1579, h: 1201, s: true, alt: 'Five street tacos with different fillings around a bowl of green salsa, with lime wedges' },
};
export const photoSrcset = (p) => (p.s ? `${p.src.replace(/\.(jpg|webp)$/, '-800.webp')} 800w, ${p.src} ${p.w}w` : undefined);
// for Base.astro's LCP_IMAGE map: the same strings the hero <img> carries
export const kitLcp = (p, sizes) => (p.s ? { href: p.src, srcset: photoSrcset(p), sizes } : p.src);
export const HERO_SIZES = { split: '(max-width: 767px) 92vw, 46vw', stats: '100vw' };

// "more than 5,700": the copy's wording, the live count. Rounded down so it stays true.
export const moreThan = (total) => roundedTotal(total).replace(/^over /, 'more than ');
export const RATING = business.reviews.rating;
export const MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(`${business.name}, ${business.streetAddress}, ${business.addressLocality}, ${business.addressRegion} ${business.postalCode}`);
export const GOOGLE_REVIEWS_URL = business.sameAs.find((u) => u.includes('google.com/maps')) || business.reviews.writeUrl;
export const ADDRESS_LINE = `${business.streetAddress}, ${business.addressLocality}, ${business.addressRegion} ${business.postalCode}`;

/** A review excerpt for a card. Every part of `words` (split on "...") must be in the posted
    review, verbatim, or the build stops. */
export function reviewExcerpt(author, words) {
  const r = reviews.find((x) => x.author === author);
  if (!r) throw new Error(`review by ${author} is not in reviews.json`);
  for (const part of words.split('...').map((s) => s.trim()).filter(Boolean)) {
    if (!r.text.includes(part)) throw new Error(`review excerpt is not verbatim (${author}): "${part}"`);
  }
  return { author: r.author, rating: r.rating, date: r.date, words };
}

export const crumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: business.siteUrl + c.href })),
});

/** Service: what the page offers, provided by the Restaurant node Base.astro defines. No rating
    and no price markup. */
export const serviceLd = ({ url, name, serviceType, description, areaServed }) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': business.siteUrl + url + '#service',
  name,
  serviceType,
  description,
  url: business.siteUrl + url,
  provider: { '@id': RESTAURANT_ID },
  areaServed: (areaServed || ['Germantown, MD']).map((a) => ({ '@type': 'City', name: a })),
});

// "(301) 569-4574", the way the page copy writes it, from business.json
export const PHONE_PAREN = business.telephone.replace(/^\+1-(\d{3})-(\d{3})-(\d{4})$/, '($1) $2-$3');
// the weekly hours the 16 November copy repeats in prose; pages pass this to assertFacts()
export const HOURS_NOV16 = [
  { days: ['Monday', 'Tuesday', 'Wednesday'], opens: '15:00', closes: '22:00' },
  { days: ['Thursday'], opens: '15:00', closes: '00:00' },
  { days: ['Friday'], opens: '15:00', closes: '01:00' },
  { days: ['Saturday'], opens: '11:00', closes: '01:00' },
  { days: ['Sunday'], opens: '11:00', closes: '22:00' },
];
