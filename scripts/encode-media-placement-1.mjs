// One-off, kept for the record: the web versions of the round 1 client media (DESIGN-DEBT 98).
// Reads incoming-media/ (git-ignored), writes public/images/. Run: node scripts/encode-media-placement-1.mjs out.txt
import sharp from 'sharp';
import fs from 'fs';
const IN = 'incoming-media/', SITE = 'public/images/site/', DISH = 'public/images/dishes/';
const SLATE = { r: 76, g: 105, b: 113 }, BLACK = { r: 0, g: 0, b: 0 };
const out = [];
// Upright, metadata-free pixels. sharp drops EXIF/ICC on output unless asked to keep them.
async function load(file) {
  const buf = await sharp(IN + file).rotate().toBuffer();
  const m = await sharp(buf).metadata();
  return { buf, w: m.width, h: m.height };
}
// rect in fractions of the upright image; ratio = w/h of the wanted box
async function crop(file, ratio, { x = null, y = null, w = null } = {}) {
  const s = await load(file);
  let cw = w ? Math.round(w * s.w) : s.w, ch = Math.round(cw / ratio);
  if (ch > s.h) { ch = s.h; cw = Math.round(ch * ratio); }
  let left = x === null ? Math.round((s.w - cw) / 2) : Math.round(x * s.w);
  let top = y === null ? Math.round((s.h - ch) / 2) : Math.round(y * s.h);
  left = Math.max(0, Math.min(left, s.w - cw)); top = Math.max(0, Math.min(top, s.h - ch));
  return { img: sharp(s.buf).extract({ left, top, width: cw, height: ch }), w: cw, h: ch };
}
// whole picture inside a ratio box on a flat ground, with a margin (fraction of the box)
async function contain(file, ratio, bg, pad = 0.025) {
  const s = await load(file);
  let bw = Math.max(s.w, Math.round(s.h * ratio)), bh = Math.round(bw / ratio);
  bw = Math.round(bw * (1 + pad * 2)); bh = Math.round(bh * (1 + pad * 2));
  const img = sharp({ create: { width: bw, height: bh, channels: 3, background: bg } })
    .composite([{ input: s.buf, left: Math.round((bw - s.w) / 2), top: Math.round((bh - s.h) / 2) }]).png();
  return { img: sharp(await img.toBuffer()), w: bw, h: bh };
}
async function write(src, path, width, fmt = 'webp', q = 82) {
  const tw = Math.min(width, src.w);
  let p = src.img.clone().resize({ width: tw });
  p = fmt === 'webp' ? p.webp({ quality: q }) : p.jpeg({ quality: q, mozjpeg: true });
  await p.toFile(path);
  const m = await sharp(path).metadata();
  out.push(`${path.replace('public', '')}\t${m.width}x${m.height}\t${(fs.statSync(path).size / 1024).toFixed(0)}KB\texif=${!!m.exif}`);
}
// menu pair: 320 thumbnail + full-size twin capped at 1254, the entry 89/90 pattern
async function pair(name, lg, thumb = lg) {
  await write(thumb, `${SITE}${name}.webp`, 320);
  await write(lg, `${SITE}${name}-lg.webp`, 1254);
}
const sq = (f, o) => crop(f, 1, o);

// ---- /menu dishes
await pair('dish-chile-relleno', await sq('menu-chile-relleno.jpg', { y: 0.075 }));
await pair('dish-tacos-dorados', await sq('menu-tacos-dorados.jpg', { w: 0.88, x: 0.03, y: 0.15 }));
await pair('dish-platanos-fritos', await sq('menu-platanos-fritos.jpg'));
await pair('dish-pozole', await sq('menu-pozole.jpg', { w: 0.86, x: 0.07, y: 0.11 }));
await pair('dish-fajita-taco-salad', await sq('menu-fajita-taco-salad.jpg'));
await pair('dish-birria-pizza', await sq('menu-birria-pizza.jpg'));
await pair('dish-garden-fajita', await sq('menu-garden-fajita.jpg'));
await pair('dish-enchiladas-de-carnitas', await sq('menu-enchiladas-de-carnitas.jpg'));
await pair('dish-jambalaya-burrito', await sq('menu-jambalaya-burrito.jpg', { x: 0.187 }));
await pair('dish-carne-asada', await sq('menu-carne-asada.jpg'));
await pair('dish-pollo-asado', await sq('menu-pollo-asado.jpg', { w: 0.547, x: 0.244, y: 0.03 }));
await pair('dish-dos-chiles-rellenos', await sq('menu-dos-chiles-rellenos.jpg', { w: 0.76, x: 0.12, y: 0.17 }));
await pair('dish-kids-mac-and-cheese', await sq('menu-kids-mac-and-cheese.jpg', { w: 0.82, x: 0.13, y: 0.13 }));
await pair('dish-kid-drinks', await contain('menu-kid-drinks.jpg', 1, BLACK, 0));
await pair('dish-aguas-frescas', await sq('menu-aguas-frescas.jpg', { x: 0.207 }));
// ---- /menu drinks
await pair('drink-virgin-mangonada', await sq('menu-virgin-mangonada.jpg', { y: 0.22 }));
await pair('drink-virgin-mojito', await sq('menu-virgin-mojito.jpg', { y: 0.07 }));
await pair('drink-frozen-pina-colada', await sq('pina-colada-1.jpg', { y: 0.21 }));
await pair('drink-pomegranate-margarita', await sq('margarita-pomegranate-1.jpg'));
await pair('drink-margarita-frozen', await sq('menu-margarita-frozen.jpg'));
await pair('drink-mangonada', await sq('menu-mangonada.jpg', { w: 0.7, x: 0.1, y: 0.18 }));
await pair('drink-bulldog', await sq('menu-bulldog.jpg'));
for (const [n, f] of [['drink-jamaica-margarita', 'menu-jamaica.png'], ['drink-jalapeno-margarita', 'menu-jalapeno.png'],
  ['drink-top-shelf-reposado', 'menu-top-shelf-reposado.png'], ['drink-fresca-margarita', 'menu-fresca.png'],
  ['drink-blue-diamond', 'menu-blue-diamond.png'], ['drink-miami-vice', 'menu-miami-vice.png'],
  ['drink-margarita-flight', 'menu-margarita-flight.png'], ['drink-mezcalita', 'menu-mezcalita.png'],
  ['drink-mexican-mojito', 'menu-mexican-mojito.png']]) await pair(n, await contain(f, 1, SLATE));
// ---- /menu happy hour and shooters
await pair('hh-handcrafted-margaritas', await sq('hh-handcrafted-1.jpg', { y: 0.12 }));
await pair('hh-platanitos', await sq('hh-platanitos-1.jpg'));
await pair('tequila-shooters-airplane', await contain('shooters-airplane-2.jpg', 1, BLACK, 0), await sq('shooters-airplane-2.jpg', { x: 0.293 }));

// ---- /happy-hour
await write(await crop('hh-group-1.jpg', 4 / 5, { y: 0.083 }), SITE + 'happy-hour-group.webp', 960, 'webp', 80);
await write(await sq('hh-handcrafted-1.jpg', { y: 0.12 }), SITE + 'happy-hour-handcrafted.webp', 640, 'webp', 80);
await write(await contain('hh-flight-1.png', 1, SLATE), SITE + 'happy-hour-flight.webp', 640, 'webp', 80);
await write(await sq('hh-platanitos-1.jpg'), SITE + 'happy-hour-platanitos.webp', 640, 'webp', 80);
await write(await sq('hh-margarita-2.jpg'), SITE + 'happy-hour-frozen-margarita.webp', 640, 'webp', 80);
// ---- /margaritas
await write(await crop('hh-handcrafted-1.jpg', 4 / 5, { y: 0.1 }), SITE + 'margaritas-hero.webp', 960, 'webp', 80);
await write(await crop('margarita-tamarindo-1.jpg', 4 / 3, { y: 0.385 }), SITE + 'margarita-tamarindo.webp', 800, 'webp', 80);
await write(await crop('margarita-pomegranate-1.jpg', 4 / 3, { y: 0.135 }), SITE + 'margarita-pomegranate.webp', 800, 'webp', 80);
await write(await contain('margarita-jamaica-1.png', 4 / 3, SLATE), SITE + 'margarita-jamaica.webp', 800, 'webp', 82);
await write(await contain('margarita-jalapeno-1.png', 4 / 3, SLATE), SITE + 'margarita-jalapeno.webp', 800, 'webp', 82);
// ---- dish cards, the /images/dishes pattern: one JPEG, 1600 on the long edge
await write(await crop('birria-pizza-1.jpg', 4 / 3, { y: 0.12 }), DISH + 'birria-pizza.jpg', 1600, 'jpeg', 80);
await write(await crop('tacos-dorados-1.jpg', 4 / 3, { y: 0.205 }), DISH + 'tacos-dorados.jpg', 1600, 'jpeg', 80);
await write(await crop('tacos-margaritas-1.jpg', 4 / 3, { y: 0.27 }), DISH + 'tacos-margaritas.jpg', 1600, 'jpeg', 80);
// ---- /karaoke and weddings
await write(await crop('karaoke-1.jpg', 4 / 5, { x: 0.11 }), SITE + 'karaoke-singing.webp', 960, 'webp', 82);
await write(await crop('wedding-table-2.jpg', 16 / 9, { y: 0.15 }), SITE + 'international-room-long-tables.webp', 1600, 'webp', 80);
fs.writeFileSync(process.argv[2], out.join('\n'));
console.log(out.length, 'files');
