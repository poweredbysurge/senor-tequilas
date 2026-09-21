import { chromium } from 'playwright';
const routes=['/','/menu','/our-story','/takeout-delivery','/taco-tuesday','/private-parties',
  '/private-parties/weddings-receptions','/private-parties/quinceaneras-celebrations','/catering','/contact',
  '/happy-hour','/birria-tacos','/quesabirria-tacos','/street-tacos','/fajitas-molcajetes','/la-dulceria',
  '/margaritas','/tequila-bar','/karaoke','/late-night','/game-day','/mexican-restaurant-gaithersburg-md'];
const b=await chromium.launch({channel:'chrome'});
const p=await b.newPage({viewport:{width:1440,height:900}});
let none=[];
for(const r of routes){
  await p.goto('http://localhost:4321'+r,{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(450);
  const res=await p.evaluate(()=>{
    const links=[...document.querySelectorAll('header nav a, [data-screen-label*="Header"] nav a')];
    const cur=links.filter(a=>a.getAttribute('aria-current')==='page');
    return { total:links.length, marked:cur.map(a=>({t:a.textContent.trim(), c:getComputedStyle(a).color})) };
  });
  const green=res.marked.filter(m=>m.c==='rgb(56, 176, 73)');
  const label=res.marked.map(m=>m.t).join(', ')||'(none)';
  if(!res.marked.length) none.push(r);
  console.log(`${r.padEnd(42)} ${String(res.marked.length)} marked  green=${green.length}  ${label}`);
}
console.log('\nroutes with no nav match:', none.length); none.forEach(r=>console.log('   '+r));
await b.close();
