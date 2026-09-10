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
      panel: await readFile(path.join(DIR, 'mobile-menu.html'), 'utf8'),
      js: await readFile(path.join(DIR, 'mobile-menu.js'), 'utf8'),
    };
  }
  return cached;
}

/** Inject the overlay into an already-loaded page. */
export async function applyOverlay(page) {
  const files = await overlayFiles();
  await page.evaluate(({ css, panel, js }) => {
    const style = document.createElement('style');
    style.id = 'port-overlay-css';
    style.textContent = css;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', panel);

    const script = document.createElement('script');
    script.textContent = js;
    document.body.appendChild(script);
  }, files);
}
