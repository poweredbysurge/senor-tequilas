/**
 * The port overlay: everything this port deliberately adds on top of the design.
 *
 * design/pages/ is never edited, so verification injects these at render time. Phase 3
 * applies the same three files statically when markup moves into src/. Keeping one
 * definition means what gets verified and what gets built cannot drift apart.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = path.join(ROOT, 'design', 'overlay');

let cached = null;

export async function overlayFiles() {
  if (!cached) {
    cached = {
      css: await readFile(path.join(DIR, 'mobile-nav.css'), 'utf8'),
      tweaksCss: await readFile(path.join(DIR, 'site-tweaks.css'), 'utf8'),
      panel: await readFile(path.join(DIR, 'mobile-menu.html'), 'utf8'),
      js: await readFile(path.join(DIR, 'mobile-menu.js'), 'utf8'),
      tweaksJs: await readFile(path.join(DIR, 'site-tweaks.js'), 'utf8'),
    };
  }
  return cached;
}

/**
 * Inject the overlay into an already-loaded page.
 *
 * The route is stamped on <body> exactly as the built site does it, because several of the
 * tweak rules are scoped to one page and would otherwise apply everywhere or nowhere.
 */
export async function applyOverlay(page) {
  const files = await overlayFiles();
  const url = new URL(page.url());
  // design/pages/<slug>.html during verification, /<path> in the built site
  const slug = url.pathname.replace(/^.*\//, '').replace(/\.html$/, '');
  const route = slug === 'home' ? '/' : url.pathname.includes('/design/pages/') ? `/${slug}` : url.pathname;

  await page.evaluate(({ css, tweaksCss, panel, js, tweaksJs, route }) => {
    document.body.setAttribute('data-route', route);

    for (const [id, text] of [['port-overlay-css', css], ['port-tweaks-css', tweaksCss]]) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = text;
      document.head.appendChild(style);
    }

    document.body.insertAdjacentHTML('beforeend', panel);

    for (const text of [js, tweaksJs]) {
      const script = document.createElement('script');
      script.textContent = text;
      document.body.appendChild(script);
    }
  }, { ...files, route });
}
