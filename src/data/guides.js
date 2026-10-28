// What each guide carries besides its copy: the photographs (real site images only, alt text
// written from the photo), where they sit, and the schema the article points at. Keyed by the
// guide's slug. The copy itself is design/copy/guides/<slug>.md. Section keys are the Markdown's
// ## headings exactly; src/lib/guides.js fails the build if one stops matching, so a retitled
// section cannot silently lose its photo. See DESIGN-DEBT.md entry 145.
import business from './business.json';

const MENU_ITEM_ID = business.siteUrl + '/birria-ramen#menuitem';   // defined on /birria-ramen, never redefined
const RESTAURANT_ID = business.siteUrl + '/#restaurant';

export const GUIDES = {
  'what-is-birria-ramen': {
    hero: {
      src: '/images/dishes/birria-ramen.jpg', w: 1265, h: 929,
      srcset: '/images/dishes/birria-ramen-800.webp 800w, /images/dishes/birria-ramen.jpg 1265w',
      alt: 'A bowl of birria ramen: noodles in red consommé with shredded birria beef, corn, sliced radish and cilantro, limes on the side',
    },
    sections: {
      'Birria vs Birria Ramen vs Birria Tacos': [
        { src: '/images/dishes/quesabirrias-hero.jpg', w: 1588, h: 751, alt: 'Quesabirria tacos topped with radish and cilantro, with cups of consommé and salsa and wedges of lime' },
      ],
      'Fifteen Recipes and the Trunk of a Car': [
        { src: '/images/site/brothers.jpg', w: 1600, h: 1600, ratio: '4 / 3', alt: "Alex and Roberto Rivas, the brothers who own Señor Tequila's, laughing together in the dining room in front of a painted mural, one in a chef's apron" },
      ],
      // the three /birria-ramen uses
      'What to Drink With It': [
        { src: '/images/site/drinks/michelada.webp', w: 600, h: 600, alt: 'A michelada in a glass mug with a chili-salt rim and a lime wedge, on ice' },
        { src: '/images/site/drinks/mexican-coke.webp', w: 600, h: 600, alt: 'A cold Mexican Coca-Cola in the glass bottle' },
        { src: '/images/site/drinks/negra-modelo.webp', w: 600, h: 600, alt: 'A cold bottle of Negra Modelo' },
      ],
    },
    schema: { about: { '@id': MENU_ITEM_ID }, mentions: [{ '@id': MENU_ITEM_ID }] },
    // the copy repeats these business facts, so a change in business.json stops the build
    facts: { street: '20021 Century Blvd', phone: '301-569-4574', hours: business.hours },
  },
  'holiday-party-germantown-md': {
    hero: {
      src: '/images/site/international-room-long-tables.webp', w: 1600, h: 900,
      srcset: '/images/site/international-room-long-tables.webp 1600w',
      alt: 'The International Room set for a party: long tables of hand-painted chairs, a turquoise wall hung with painted masks, and a buffet line with chafing dishes on a striped runner',
    },
    sections: {
      'Headcount to Room Size': [
        { src: '/images/site/mexican-room.webp', w: 1400, h: 933, alt: 'The Mexican Room set for dinner: long tables, painted wooden chairs, a star lantern and hand-painted portraits on the walls' },
      ],
      'Company Holiday Party Ideas That Work in a Restaurant': [
        { src: '/images/site/addon-mariachi-ensemble.jpg', w: 1600, h: 900, alt: 'A seven-piece mariachi in black and silver charro suits playing between the tables' },
      ],
      // the gift box photo /holiday-parties uses
      "Why Groups Choose Señor Tequila's": [
        { src: '/images/site/holiday-gift-box.webp', w: 1000, h: 1000, ratio: '4 / 3', alt: 'A pyramid of 24 numbered holiday gift boxes in kraft paper, each printed with a Christmas design: a tree, stockings, mittens, reindeer, a gingerbread man, a snowman' },
      ],
    },
    // prices and the capacity table are not Offers here: those belong to /holiday-parties and /private-parties
    schema: { about: { '@id': RESTAURANT_ID } },
    facts: { street: '20021 Century Blvd', phone: '301-569-4574' },
  },
};

// the hero's sizes: the guide column is at most 760px wide
export const HERO_SIZES = '(max-width: 767px) 92vw, 760px';

// For Base.astro's LCP_IMAGE map: each guide's hero, the same strings as its <img>. A draft's
// entry is harmless (no route exists to match it).
export const GUIDE_LCP = Object.fromEntries(Object.entries(GUIDES).map(([slug, g]) =>
  ['/guides/' + slug, { href: g.hero.src, srcset: g.hero.srcset, sizes: HERO_SIZES }]));
