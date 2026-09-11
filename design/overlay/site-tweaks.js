/* port: homepage behaviour the design drew but never wired. See DESIGN-DEBT.md entry 19.
   Vanilla JavaScript, no framework, no dependencies. Everything degrades to the static
   page if this file fails to run. */
(function () {
  var isHome = document.body.getAttribute('data-route') === '/';

  /* ---- 1. the Tonight carousel -------------------------------------------------------
     The design hard-codes Thursday as "tonight". The kickoff call asked for a day-aware
     carousel, so today's card is promoted to the front, gets the badge and the green
     border, and the eyebrow follows. */
  function tonightCarousel() {
    var rail = document.querySelector('[data-dc-tpl="91"][data-rail]');
    if (!rail) return;
    var cards = [].slice.call(rail.children);
    if (!cards.length) return;

    var DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    var today = DAYS[new Date().getDay()];

    var badge = rail.querySelector('[data-dc-tpl="96"]');
    var ACTIVE = 'rgb(56, 176, 73)';
    var IDLE = 'rgb(42, 40, 32)';

    var todayCard = null;
    cards.forEach(function (card) {
      var label = (card.textContent || '').match(/(Sundays|Mondays|Tuesdays|Wednesdays|Thursdays|Fridays|Saturdays)/);
      card.setAttribute('data-day', label ? label[1] : '');
      card.style.borderColor = IDLE;
      if (label && label[1] === today) todayCard = card;
    });

    if (todayCard) {
      if (badge && !todayCard.contains(badge)) {
        var host = todayCard.querySelector('[data-dc-tpl="94"]') || todayCard.firstElementChild;
        if (host) host.appendChild(badge);
      }
      todayCard.style.borderColor = ACTIVE;
      // Rotate the week so tonight leads, keeping the days in their natural order after it.
      var start = cards.indexOf(todayCard);
      cards.slice(start).concat(cards.slice(0, start)).forEach(function (c) { rail.appendChild(c); });
      // Moving children makes the browser keep its old scroll offset, which can leave the
      // rail parked at the far end. Tonight has to be the card you actually see first.
      var behavior = rail.style.scrollBehavior;
      rail.style.scrollBehavior = 'auto';
      rail.scrollLeft = 0;
      rail.style.scrollBehavior = behavior;
    }

    var eyebrow = document.querySelector('[data-dc-tpl="79"]');
    if (eyebrow && todayCard) {
      var singular = today.replace(/s$/, '');
      eyebrow.textContent = singular + ' · every week';
    }

    /* ---- the arrows, which the design drew but left inert ---- */
    var prev = document.querySelector('[data-dc-tpl="84"]');
    var next = document.querySelector('[data-dc-tpl="87"]');
    function step() {
      var first = rail.firstElementChild;
      if (!first) return 260;
      var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 12;
      return first.getBoundingClientRect().width + gap;
    }
    function sync() {
      if (!prev || !next) return;
      var max = rail.scrollWidth - rail.clientWidth - 1;
      prev.disabled = rail.scrollLeft <= 0;
      next.disabled = rail.scrollLeft >= max;
    }
    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
    rail.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  /* ---- 1b. the Google reviews carousel ------------------------------------------------
             Same treatment as the Tonight rail: the scrollbar is hidden in tweaks.css, so the
             arrows are the only way to move it. One card per click, disabled at each end. */
          function reviewsCarousel() {
            var rail = document.querySelector('[data-dc-tpl="150"]');
            if (!rail) return;
            var prev = document.querySelector('[data-reviews-prev]');
            var next = document.querySelector('[data-reviews-next]');
            if (!prev || !next) return;

            function step() {
              var first = rail.firstElementChild;
              if (!first) return 340;
              var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 12;
              return first.getBoundingClientRect().width + gap;
            }
            function sync() {
              var max = rail.scrollWidth - rail.clientWidth - 1;
              prev.disabled = rail.scrollLeft <= 0;
              next.disabled = rail.scrollLeft >= max;
            }
            prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
            next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
            rail.addEventListener('scroll', sync, { passive: true });
            window.addEventListener('resize', sync);
            sync();
          }

  /* ---- 2. the signature dish filters --------------------------------------------------
     Chips are buttons with no behaviour in the design. Each card is categorised from its
     own title, so the mapping survives a copy change. */
  function dishFilters() {
    var chips = [].slice.call(document.querySelectorAll('button[data-dc-tpl="123"]'));
    var cards = [].slice.call(document.querySelectorAll('button[data-dc-tpl="126"]'));
    if (!chips.length || !cards.length) return;

    var RULES = [
      ['Tacos', /taco|birria|pastor|perrones|asada|quesabirria/i],
      ['Fajitas & Molcajetes', /fajita|molcajete/i],
      ['Margaritas', /margarita|cantarito|paloma|michelada|tequila|mezcal/i],
      ['Desserts', /churro|flan|tres leches|dulcer|volc|cheesecake|ice cream/i]
    ];
    cards.forEach(function (card) {
      var text = card.textContent || '';
      var hits = RULES.filter(function (r) { return r[1].test(text); }).map(function (r) { return r[0]; });
      card.setAttribute('data-category', hits.join('|'));
    });

    var grid = cards[0].parentElement;
    var empty = document.createElement('p');
    empty.setAttribute('data-empty-filter', '');
    empty.hidden = true;
    grid.appendChild(empty);

    function paint(chip, on) {
      chip.style.background = on ? 'rgb(56, 176, 73)' : 'transparent';
      chip.style.color = on ? 'rgb(12, 18, 13)' : 'rgba(234, 226, 214, 0.85)';
      chip.setAttribute('aria-pressed', String(on));
    }

    function apply(name) {
      var shown = 0;
      cards.forEach(function (card) {
        var on = (card.getAttribute('data-category') || '').split('|').indexOf(name) !== -1;
        card.setAttribute('data-filtered', on ? 'in' : 'out');
        if (on) shown++;
      });
      empty.hidden = shown > 0;
      if (!shown) empty.textContent = 'No ' + name.toLowerCase() + ' in the top sellers this week. See the full menu.';
      chips.forEach(function (c) { paint(c, (c.textContent || '').trim() === name); });
    }

    chips.forEach(function (chip) {
      chip.setAttribute('type', 'button');
      chip.addEventListener('click', function () { apply((chip.textContent || '').trim()); });
    });
    apply((chips[0].textContent || '').trim());
  }

  /* ---- 3. the social rail scrolls itself ------------------------------------------------
     The design marks this rail data-autoscroll and its script does the scrolling. The port
     has no such script, so the rail sat still. Pauses on hover, on focus, and for anyone
     who has asked for reduced motion. */
  function autoScrollRails() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    [].slice.call(document.querySelectorAll('[data-autoscroll]')).forEach(function (rail) {
      // The overflow check has to happen inside the loop, not once up front: at
      // DOMContentLoaded the images have no width yet, so the rail does not overflow and a
      // one-shot guard would switch the whole thing off before the page finished loading.
      var paused = false, last = null;
      var SPEED = 22; // pixels per second, slow enough to read
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (e) {
        rail.addEventListener(e, function () { paused = true; }, { passive: true });
      });
      ['mouseleave', 'focusout', 'touchend'].forEach(function (e) {
        rail.addEventListener(e, function () { paused = false; }, { passive: true });
      });
      function tick(now) {
        if (last === null) last = now;
        var dt = (now - last) / 1000;
        last = now;
        var max = rail.scrollWidth - rail.clientWidth;
        if (!paused && max > 4 && dt < 1) {
          var next = rail.scrollLeft + SPEED * dt;
          rail.scrollLeft = next >= max ? 0 : next;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---- 4. navigation order -------------------------------------------------------------
     "Our Story" moves ahead of "Menu" in the header nav, on every page. Done here rather
     than in the seven header variants so one rule covers them all and a future export
     cannot quietly undo it. */
  function navOrder() {
    var nav = document.querySelector('header nav');
    if (!nav) return;
    var links = [].slice.call(nav.querySelectorAll('a'));
    var story = links.filter(function (a) { return /our story/i.test(a.textContent || ''); })[0];
    var menu = links.filter(function (a) { return /^\s*menu\s*$/i.test(a.textContent || ''); })[0];
    if (story && menu && story !== menu && menu.parentNode === story.parentNode) {
      menu.parentNode.insertBefore(story, menu);
    }
  }

  /* ---- 5. the private events hub had seven inquiry forms ---------------------------------
     The design put a copy of the whole enquiry form inside every one of the seven FAQ
     answers. Seven forms on one page is wrong for the visitor and wrong for anything
     parsing the page. Keep the last one, which already sits at the foot of the section,
     and drop the six above it. The FAQ answers themselves are left intact. */
  function singleInquiryForm() {
    var forms = [].slice.call(document.querySelectorAll('form'));
    if (forms.length < 2) return;
    var keep = forms[forms.length - 1];
    forms.slice(0, -1).forEach(function (form) {
      // Take the heading that introduces each duplicate with it, when there is one.
      var block = form.parentElement;
      var hasOwnHeading = block && block !== keep.parentElement && /start here/i.test(block.textContent || '');
      (hasOwnHeading ? block : form).remove();
    });
  }

  function start() {
    try { if (isHome) tonightCarousel(); } catch (e) {}
    try { if (isHome) reviewsCarousel(); } catch (e) {}
    try { if (isHome) dishFilters(); } catch (e) {}
    try { autoScrollRails(); } catch (e) {}
    try { navOrder(); } catch (e) {}
    try { singleInquiryForm(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
