// Shared pieces for the authored pages built on the /friendsgiving pattern (/holiday-parties,
// /new-years-eve, /birria-ramen). The style strings are /friendsgiving's own, held once here so the
// three pages cannot drift from each other. /friendsgiving keeps its own copy and is not changed.
import business from '../data/business.json';

export const EYEBROW = "display: flex; align-items: center; gap: 10px; font-family: 'Barlow Condensed', 'Barlow Condensed Fallback', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: rgb(214, 188, 133);";
export const RULE = 'width: 26px; height: 1px; background: rgba(214, 188, 133, 0.7);';
export const H1 = "color: rgb(246, 239, 228); font-family: 'Archivo Black', 'Archivo Black Fallback', sans-serif; font-size: clamp(24px, 2.9vw, 38px); line-height: 1.06; margin: 10px 0px 0px; text-transform: uppercase; text-wrap: balance;";
export const H2 = "color: rgb(246, 239, 228); font-family: 'Archivo Black', 'Archivo Black Fallback', sans-serif; font-size: clamp(26px, 4.6vw, 42px); line-height: 1.04; margin: 10px 0px 0px; text-transform: uppercase; text-wrap: balance;";
export const LEAD = 'font-size: 16px; line-height: 1.7; color: rgba(234, 226, 214, 0.85); margin: 16px 0px 0px; max-width: 54ch; text-wrap: pretty;';
export const P = 'font-size: 15px; line-height: 1.7; color: rgba(234, 226, 214, 0.85); margin: 14px 0px 0px; max-width: 62ch; text-wrap: pretty;';
export const LINK = 'color: rgb(214, 188, 133); font-weight: 700;';
export const WRAP = 'max-width: 1180px; margin: 0px auto; padding: 0px clamp(18px, 4.5vw, 48px);';
export const SECTION = (bg) => `background: ${bg}; border-top: 1px solid rgba(185, 156, 102, 0.2); padding: clamp(40px, 6.4vw, 84px) 0px; scroll-margin-top: 70px;`;
export const CARD = 'background: rgb(28, 27, 24); border: 1px solid rgb(42, 40, 32); border-radius: 16px; padding: 18px 20px;';
export const CARD_EYEBROW = "font-family: 'Barlow Condensed', 'Barlow Condensed Fallback', sans-serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: rgb(214, 188, 133);";
export const CARD_TITLE = "font-family: 'Archivo Black', 'Archivo Black Fallback', sans-serif; font-size: 16px; text-transform: uppercase; color: rgb(246, 239, 228); margin-top: 5px; line-height: 1.15;";
export const BTN_PRIMARY = 'display: inline-flex; align-items: center; justify-content: center; background: rgb(56, 176, 73); color: rgb(12, 18, 13); font-weight: 800; font-size: 15px; padding: 16px 24px; border-radius: 12px; min-height: 52px; box-sizing: border-box; box-shadow: rgba(56, 176, 73, 0.35) 0px 0px 30px; border: 0px; cursor: pointer; font-family: inherit;';
export const BTN_GHOST = 'display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid rgba(185, 156, 102, 0.75); color: rgb(234, 226, 214); font-weight: 700; font-size: 15px; padding: 16px 24px; border-radius: 12px; min-height: 52px; box-sizing: border-box; background: rgba(18, 18, 16, 0.4);';
export const FRAME = 'border-radius: 16px; overflow: hidden; border: 1px solid rgb(42, 40, 32); background: rgb(28, 27, 24);';
export const IMG = 'display: block; width: 100%; height: 100%; object-fit: cover;';
export const SMALL = 'font-size: 12px; line-height: 1.55; color: rgba(234, 226, 214, 0.65); margin: 14px 0px 0px; max-width: 72ch;';
export const QUOTE = "margin: 0px; font-family: 'Archivo Black', 'Archivo Black Fallback', sans-serif; font-size: clamp(18px, 2.4vw, 24px); line-height: 1.25; text-transform: uppercase; color: rgb(246, 239, 228); text-wrap: balance;";
export const CITE = "font-family: 'Barlow Condensed', 'Barlow Condensed Fallback', sans-serif; font-weight: 600; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: rgb(214, 188, 133); margin-top: 12px;";

// the inquiry form, the same fields and styling as the forms on /private-parties
export const FORM = 'background: rgb(28, 27, 24); border: 1px solid rgba(185, 156, 102, 0.35); border-radius: 18px; padding: 22px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 22px; max-width: 760px;';
export const LABEL = 'display: grid; gap: 6px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: rgb(214, 188, 133);';
export const FIELD = 'font: inherit; font-size: 15px; letter-spacing: 0px; text-transform: none; padding: 13px 14px; min-height: 48px; border-radius: 10px; border: 1px solid rgb(58, 56, 47); background: rgb(18, 18, 16); color: rgb(234, 226, 214); box-sizing: border-box; width: 100%;';

export const PHONE_DISPLAY = business.telephone.replace(/^\+1-/, '');
export const PHONE_HREF = 'tel:' + business.telephone.replace(/[^+\d]/g, '');

// The copy repeats the address, the phone and the hours in prose, verbatim, where a sentence reads
// better than a lookup. CLAUDE.md keeps those facts in business.json only, so each page states the
// facts its prose assumes and the build stops if business.json no longer agrees with them.
export function assertFacts(page, { street, phone, hours } = {}) {
  const bad = [];
  if (street && business.streetAddress !== street) bad.push(`street "${business.streetAddress}" vs "${street}"`);
  if (phone && PHONE_DISPLAY !== phone) bad.push(`phone "${PHONE_DISPLAY}" vs "${phone}"`);
  if (hours && JSON.stringify(business.hours) !== JSON.stringify(hours)) bad.push('the weekly hours');
  if (bad.length) throw new Error(`${page}: business.json changed under copy that repeats it (${bad.join(', ')}). Update the page copy.`);
}

// FAQ: one list renders the accordion and the FAQPage schema, so they cannot drift. A `link`
// wraps one phrase of the answer on the page only; the schema carries the same words as text.
export function faqHtml(f) {
  if (!f.link) return f.a;
  const i = f.a.indexOf(f.link.text);
  if (i < 0) throw new Error(`FAQ link text "${f.link.text}" is not in the answer`);
  return `${f.a.slice(0, i)}<a href="${f.link.href}" style="${LINK}">${f.link.text}</a>${f.a.slice(i + f.link.text.length)}`;
}
export const faqLd = (faq) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

// the review count is always read live, never typed: "4.6 stars across over 5,700"
export const RESTAURANT_ID = business.siteUrl + '/#restaurant';
export const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
