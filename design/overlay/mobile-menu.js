/* port: mobile menu toggle. See DESIGN-DEBT.md entry 6.

   The design drew a <button> with aria-label="Open menu" and a matching "Close menu" button
   inside the panel, so this is button semantics rather than a checkbox standing in for one:
   aria-expanded on the control, Escape to close, close when a link inside is used, and focus
   moved into the panel on open and back to the button on close.

   Visual state stays in CSS. This is not a client framework. */
(function () {
  var panel = document.getElementById('mobile-menu');
  var opener = document.querySelector('header button[aria-label="Open menu"]');
  if (!panel || !opener) return;

  var closer = panel.querySelector('button[aria-label="Close menu"]');
  var returnFocusTo = null;

  function setOpen(isOpen) {
    panel.hidden = !isOpen;
    opener.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      returnFocusTo = document.activeElement;
      (closer || panel.querySelector('a') || panel).focus();
    } else if (returnFocusTo) {
      returnFocusTo.focus();
    }
  }

  opener.setAttribute('aria-controls', 'mobile-menu');
  setOpen(false);
  opener.addEventListener('click', function () { setOpen(true); });
  if (closer) closer.addEventListener('click', function () { setOpen(false); });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });
})();
