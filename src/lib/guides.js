// The Guides section: which guides exist, and each one's Markdown turned into blocks the template
// renders (DESIGN-DEBT.md entry 145). The copy is used verbatim. A small parser rather than a
// Markdown renderer, because the template needs the structure, not finished HTML: the H1 goes in
// the header, the FAQ becomes the site's accordion and the FAQPage schema, the review quotes become
// pull quotes, the "Related:" line becomes cards, and photos go into named sections. The Markdown
// these guides use is small: one #, ##, paragraphs, **bold**, [links](/path), "- " lists and one
// pipe table. Anything else fails the build rather than rendering wrong.
import { getCollection } from 'astro:content';
import { GUIDES } from '../data/guides.js';
import { assertFacts } from './authored.js';

// Drafts never build. A local preview sets GUIDES_DRAFTS=1 (npm run build:drafts, into
// dist-drafts/), and that is refused on Vercel so a draft cannot reach a deploy by accident.
const SHOW_DRAFTS = process.env.GUIDES_DRAFTS === '1';
if (SHOW_DRAFTS && process.env.VERCEL) throw new Error('GUIDES_DRAFTS=1 is for a local preview only, never a deploy');

export async function publishedGuides() {
  const all = await getCollection('guides', (e) => SHOW_DRAFTS || !e.data.draft);
  return all.sort((a, b) => b.data.date_published - a.data.date_published || b.data.date_modified - a.data.date_modified);
}

export const guideUrl = (g) => g.data.url;
export const isoDate = (d) => d.toISOString().slice(0, 10);
export const longDate = (d) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }).format(d);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const plain = (md) => md.replace(LINK_RE, '$1').replace(/\*\*(.+?)\*\*/g, '$1');
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A link to a guide that is not published (a draft) is dropped: its words stay, the link does not.
function inline(md, live) {
  return esc(md)
    .replace(LINK_RE, (_, text, href) => (/^\/guides\//.test(href) && !live.has(href)) ? text : `<a href="${href}" class="gd-link">${text}</a>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** One guide's body as { h1, lead[], sections[{ title, id, blocks[] }], faq[], related[], words }. */
export function parseGuide(entry, published) {
  const live = new Set(published.map(guideUrl));
  const cfg = GUIDES[entry.data.slug];
  if (!cfg) throw new Error(`guide ${entry.data.slug}: no photos in src/data/guides.js`);
  if (cfg.facts) assertFacts(entry.data.url, cfg.facts);
  for (const v of Object.values(entry.data)) {
    if (typeof v === 'string' && /[–—]/.test(v)) throw new Error(`guide ${entry.data.slug}: an en or em dash in the frontmatter`);
  }
  if (/[–—]/.test(entry.body)) throw new Error(`guide ${entry.data.slug}: an en or em dash in the copy`);

  const raw = entry.body.replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  let h1 = null;
  const lead = [];
  const sections = [];
  let faq = [];
  let related = [];
  let cur = null;

  const blocksOf = () => (cur ? cur.blocks : lead);
  for (let i = 0; i < raw.length; i++) {
    const b = raw[i];
    if (/^# /.test(b)) { if (h1) throw new Error('two H1s'); h1 = b.slice(2).trim(); continue; }
    if (/^## /.test(b)) { cur = { title: b.slice(3).trim(), blocks: [] }; cur.id = slugify(cur.title); sections.push(cur); continue; }
    if (/^#{3,} /.test(b)) throw new Error(`guide ${entry.data.slug}: ### headings are not supported: ${b}`);

    if (/^\*\*Related:\*\*/.test(b)) {
      related = [...b.matchAll(LINK_RE)].map(([, text, href]) => ({ text, href }))
        .filter((r) => !/^\/guides\//.test(r.href) || live.has(r.href));   // a draft guide never shows
      continue;
    }

    if (cur && /FAQ$/i.test(cur.title)) {
      const q = b.match(/^\*\*(.+\?)\*\*$/);
      if (q) {
        const a = raw[++i];
        if (!a || /^\*\*/.test(a)) throw new Error(`guide ${entry.data.slug}: FAQ "${q[1]}" has no answer`);
        const links = [...a.matchAll(LINK_RE)];
        faq.push({ q: q[1], a: plain(a), ...(links[0] ? { link: { text: links[0][1], href: links[0][2] } } : {}) });
        continue;
      }
    }

    if (b.split('\n').every((l) => /^- /.test(l))) {
      const items = b.split('\n').map((l) => inline(l.slice(2), live));
      const prev = blocksOf().at(-1);
      if (prev && prev.type === 'list') prev.items.push(...items);   // "- a\n\n- b" is one list
      else blocksOf().push({ type: 'list', items });
      continue;
    }
    if (b.split('\n').every((l) => /^\|.*\|$/.test(l))) {
      const rows = b.split('\n').filter((l) => !/^\|[\s|:-]+\|$/.test(l)).map((l) => l.slice(1, -1).split('|').map((c) => inline(c.trim(), live)));
      blocksOf().push({ type: 'table', head: rows[0], rows: rows.slice(1) });
      continue;
    }
    // a review: the quoted words, then a line that is only the bold attribution
    const cite = raw[i + 1] && raw[i + 1].match(/^\*\*([^*]+review)\*\*$/i);
    if (/^".*"$/s.test(b) && cite) {
      blocksOf().push({ type: 'quote', text: esc(b), cite: esc(cite[1]) });
      i++;
      continue;
    }
    if (/^[#>|*-]\S/.test(b) && !/^\*\*/.test(b)) throw new Error(`guide ${entry.data.slug}: unsupported Markdown: ${b.slice(0, 60)}`);
    blocksOf().push({ type: 'p', html: inline(b, live) });
  }
  if (!h1) throw new Error(`guide ${entry.data.slug}: no H1`);

  // photos: after the first paragraph of their section
  for (const [title, imgs] of Object.entries(cfg.sections || {})) {
    const s = sections.find((x) => x.title === title);
    if (!s) throw new Error(`guide ${entry.data.slug}: photo section "${title}" is not a ## heading in the copy`);
    const at = s.blocks.findIndex((x) => x.type === 'p');
    s.blocks.splice(at < 0 ? 0 : at + 1, 0, { type: 'figure', imgs });
  }
  // the FAQ section renders as the accordion only
  for (const s of sections) if (/FAQ$/i.test(s.title)) s.faq = true;

  const words = plain(entry.body).split(/\s+/).filter((w) => /\w/.test(w)).length;
  return { h1, lead, sections, faq, related, words, minutes: Math.max(1, Math.round(words / 230)), cfg };
}
