// Helpers for the Google reviews rail. Kept out of the page so a data refresh never needs a
// code edit. See DESIGN-DEBT.md entry 92.

/** 5717 -> "over 5,700". Rounded down, so it stays true as the count climbs. */
export function roundedTotal(total) {
  const floored = Math.floor(Number(total) / 100) * 100;
  return `over ${floored.toLocaleString('en-US')}`;
}

/** "2026-09-14" -> "September 2026". Reviewers get a month, not a precise day. */
export function reviewMonth(iso) {
  const [y, m] = String(iso || '').split('-');
  if (!y || !m) return '';
  const name = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'][Number(m) - 1];
  return name ? `${name} ${y}` : '';
}

/** "Dee Williams" -> "DW". Falls back to one letter, then to a neutral dot. */
export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '·';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** A star row for one review's own rating rather than five hard-coded stars. */
export function stars(rating) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}
