// What each guide carries besides its copy: the photographs (real site images only, alt text
// written from the photo), where they sit, and the schema the article points at. Keyed by the
// guide's slug. The copy itself is design/copy/guides/<slug>.md. Section keys are the Markdown's
// ## headings exactly; src/lib/guides.js fails the build if one stops matching, so a retitled
// section cannot silently lose its photo. See DESIGN-DEBT.md entry 145.
import business from './business.json';
import { HOURS_NOV16 } from '../lib/kit.js';

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
      srcset: '/images/site/international-room-long-tables-800.webp 800w, /images/site/international-room-long-tables.webp 1600w',
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
  // ---- the 16 November batch: built to PAGE-TEMPLATES 4.4 (`blueprint`), DESIGN-DEBT.md entry 166.
  // Each photo carries a caption, which is also its title attribute; `cta` is the closing pair of
  // buttons and the first one is the mid-article card's button.
  'super-bowl-germantown-md': {
    blueprint: true,
    hero: {
      src: '/images/site/friendsgiving/friendsgiving-full-bar-area.webp', w: 1600, h: 1069,
      srcset: '/images/site/friendsgiving/friendsgiving-full-bar-area-800.webp 800w, /images/site/friendsgiving/friendsgiving-full-bar-area.webp 1600w',
      alt: 'The bar area full from end to end, football on the TVs either side of the glowing back bar, flowers and lanterns overhead',
    },
    sections: {
      'Three ways to watch in Germantown': [
        { src: '/images/site/game-day-jerseys-1.webp', w: 720, h: 900, alt: 'Three friends at the bar in Ravens and Commanders jerseys, one holding a football', caption: 'Game day in the bar area.' },
        { src: '/images/site/game-day-jerseys-2.webp', w: 720, h: 900, alt: 'A guest in a Washington shirt cheering with her hands up as the bar celebrates a play' },
        { src: '/images/site/game-day-jerseys-4.webp', w: 720, h: 900, alt: 'A table of fans raising their drinks over wings, nachos and a football' },
      ],
      "The room at Señor Tequila's": [
        { src: '/images/site/dining-room-night.webp', w: 1500, h: 880, srcset: '/images/site/dining-room-night-800.webp 800w, /images/site/dining-room-night.webp 1500w', alt: 'The bar area on a busy night: guests at painted tables under a flower ceiling and woven lanterns, the lit heart-shaped back bar and TVs along the wall', caption: 'The bar area: 108 seats and 13-plus TVs.' },
      ],
      'What to order for the game': [
        { src: '/images/dishes/tacos-cinco-mamalones.jpg', w: 1579, h: 1201, ratio: '1 / 1', srcset: '/images/dishes/tacos-cinco-mamalones-800.webp 800w, /images/dishes/tacos-cinco-mamalones.jpg 1579w', alt: 'Five street tacos with different fillings around a bowl of green salsa, with lime wedges', caption: 'Cinco Mamalones, Birria Fries and Mexican Chicken Wings.' },
        { src: '/images/dishes/birria-fries.jpg', w: 1600, h: 871, ratio: '1 / 1', srcset: '/images/dishes/birria-fries-800.webp 800w, /images/dishes/birria-fries.jpg 1600w', alt: 'Fries under shredded birria and white queso on a long plate, with a cup of consommé behind' },
        { src: '/images/dishes/mexican-chicken-wings.jpg', w: 1253, h: 1050, ratio: '1 / 1', srcset: '/images/dishes/mexican-chicken-wings-800.webp 800w, /images/dishes/mexican-chicken-wings.jpg 1253w', alt: 'Bone-in chicken wings in a wire basket with two dipping sauces, carrot and celery sticks' },
      ],
    },
    schema: { about: { '@id': RESTAURANT_ID } },
    cta: [{ label: 'See Game Day', href: '/game-day' }, { label: "Valentine's Day Dinner", href: '/valentines-day' }],
    facts: { street: '20021 Century Blvd', phone: '301-569-4574' },
  },
  'vegetarian-mexican-food-germantown': {
    blueprint: true,
    hero: {
      src: '/images/dishes/enchiladas-de-espinaca.jpg', w: 1600, h: 849,
      srcset: '/images/dishes/enchiladas-de-espinaca-800.webp 800w, /images/dishes/enchiladas-de-espinaca.jpg 1600w',
      alt: 'Spinach and cheese enchiladas in yellow squash blossom cream sauce with queso fresco, crema and micro greens',
    },
    sections: {
      'The vegetarian mains': [
        { src: '/images/site/dish-garden-fajita-lg.webp', w: 1254, h: 1254, alt: 'A skillet of grilled vegetables with tortillas, rice, black beans and salad on the side', caption: 'The Garden Fajita and Dos Chiles Rellenos.' },
        { src: '/images/site/dish-dos-chiles-rellenos-lg.webp', w: 1254, h: 1254, alt: 'Two stuffed poblano peppers in red salsa with crema, beside a mound of rice' },
      ],
      'Vegetarian starters and sides': [
        { src: '/images/dishes/guacamole.jpg', w: 1530, h: 900, ratio: '1 / 1', srcset: '/images/dishes/guacamole-800.webp 800w, /images/dishes/guacamole.jpg 1530w', alt: 'A bowl of fresh guacamole with tomato and onion, ringed by tortilla chips', caption: 'Guacamole, Esquites and Plátanos Fritos.' },
        { src: '/images/dishes/esquites.jpg', w: 1600, h: 1067, ratio: '1 / 1', srcset: '/images/dishes/esquites-800.webp 800w, /images/dishes/esquites.jpg 1600w', alt: 'A bowl of grilled street corn with cotija, chili powder, cilantro and a lime wedge' },
        { src: '/images/site/dish-platanos-fritos-lg.webp', w: 1254, h: 1254, alt: 'Fried sweet plantain slices drizzled with crema around a tortilla bowl of refried beans and cotija' },
      ],
      'Meatless Fridays: the seafood': [
        { src: '/images/dishes/fridas-salmon.jpg', w: 1556, h: 1151, ratio: '4 / 3', srcset: '/images/dishes/fridas-salmon-800.webp 800w, /images/dishes/fridas-salmon.jpg 1556w', alt: 'A grilled salmon fillet under yellow flor de calabaza sauce with rice, grilled zucchini and squash', caption: "Frida's Salmon." },
      ],
      'Dessert is all vegetarian': [
        { src: '/images/dishes/volcan-de-xocolate.jpg', w: 1600, h: 910, srcset: '/images/dishes/volcan-de-xocolate-800.webp 800w, /images/dishes/volcan-de-xocolate.jpg 1600w', alt: 'A warm chocolate cake topped with vanilla ice cream, chocolate sauce and candied pecans', caption: 'The Volcán de Xocolate.' },
      ],
    },
    schema: { about: { '@id': RESTAURANT_ID } },
    cta: [{ label: 'See the Full Menu', href: '/menu' }, { label: 'Reserve a Table', href: business.reserveUrl, external: true }],
    // the closing section repeats the weekly hours
    facts: { street: '20021 Century Blvd', phone: '301-569-4574', hours: HOURS_NOV16, reviews: { rating: 4.6, moreThan: 5700 } },
  },
};

// the hero's sizes: the guide column is at most 760px wide
export const HERO_SIZES = '(max-width: 767px) 92vw, 760px';

// For Base.astro's LCP_IMAGE map: each guide's hero, the same strings as its <img>. A draft's
// entry is harmless (no route exists to match it).
export const GUIDE_LCP = Object.fromEntries(Object.entries(GUIDES).map(([slug, g]) =>
  ['/guides/' + slug, { href: g.hero.src, srcset: g.hero.srcset, sizes: HERO_SIZES }]));
