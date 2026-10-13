// The notification a manager gets when someone sends an inquiry form. One template, four
// forms. Tables and inline styles throughout, because that is what mail clients render; the
// colours and type are the site's own tokens. See DESIGN-DEBT.md entry 107.

export const FORMS = {
  catering: { label: 'Catering', guests: 'Headcount', details: 'Event details', promise: 'We reply within one business day.', event: true },
  'private-party': { label: 'Private party', guests: 'Guests', details: 'About the party', promise: 'We reply fast. Same day, usually within the hour.', event: true },
  quinceanera: { label: 'Quinceañera', guests: 'Guests', details: 'About the celebration', promise: 'We reply fast. Same day, usually within the hour.', event: true },
  wedding: { label: 'Wedding', guests: 'Guests', details: 'What they are celebrating', promise: 'We reply fast. Same day, usually within the hour.', event: true },
  // The contact form: a message, not an event, so no date or head count, and email is the way back.
  contact: { label: 'Contact', details: 'Message', promise: 'We reply within one business day.', event: false },
};

const T = {
  bg: '#121210', panel: '#1C1B18', inset: '#161511', line: '#2A2820', cream: '#F6EFE4', text: '#EAE2D6',
  muted: '#A39C8F', gold: '#D6BC85', goldDeep: '#B99C66', green: '#38B049', ink: '#0C120D', red: '#BF1E2E',
};
const DISPLAY = "'Archivo Black', 'Arial Black', Arial, sans-serif";
const BODY = "Barlow, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LABEL = "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif";

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function formatPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(raw || '').trim();
}
export function telHref(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return 'tel:' + (d.length === 10 ? '+1' + d : d.length === 11 && d[0] === '1' ? '+' + d : d);
}
// "2026-11-14" is a calendar date, not an instant, so it is formatted in UTC to stay put.
export function formatDate(iso, opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return '';
  const d = new Date(iso + 'T00:00:00Z');
  return isNaN(d) ? '' : new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' }).format(d);
}
const formatSent = (when) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }).format(when) + ' ET';

export function buildInquiryEmail(inq, { business, when = new Date() } = {}) {
  const f = FORMS[inq.form];
  const phone = formatPhone(inq.phone);
  const date = formatDate(inq.date);
  const shortDate = formatDate(inq.date, { weekday: 'short', month: 'short', day: 'numeric' });
  const guests = inq.guests ? String(inq.guests) : '';
  const first = String(inq.name).trim().split(/\s+/)[0];
  const site = business.siteUrl;
  const address = `${business.streetAddress}, ${business.addressLocality}, ${business.addressRegion} ${business.postalCode}`;

  const noun = f.event ? 'inquiry' : 'message';
  const email = String(inq.email || '').trim();
  const subject = `New ${f.label.toLowerCase()} ${noun}: ${inq.name}` + (guests ? `, ${guests} guests` : '') + (shortDate ? `, ${shortDate}` : '');
  const preheader = [inq.name, phone, email].filter(Boolean).join(', ') + (date ? `. ${date}` : '') + (guests ? `. ${guests} guests` : '') + '.';
  const mailto = email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Señor Tequila\'s: your ' + (f.event ? f.label.toLowerCase() + ' inquiry' : 'message'))}` : '';
  const primary = `display: inline-block; background: ${T.green}; color: ${T.ink}; font-family: ${BODY}; font-weight: 800; font-size: 17px; text-decoration: none; padding: 15px 24px; border-radius: 12px; margin: 0 8px 8px 0;`;
  const secondary = `display: inline-block; border: 1.5px solid ${T.goldDeep}; color: ${T.text}; font-family: ${BODY}; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 20px; border-radius: 12px; margin: 0 8px 8px 0;`;
  const buttons = (phone ? `<a href="${esc(telHref(inq.phone))}" style="${primary}">Call ${esc(first)} at ${esc(phone)}</a>` : '')
    + (email ? `<a href="${esc(mailto)}" style="${phone ? secondary : primary}">Email ${esc(phone ? email : first)}</a>` : '');

  const row = (label, value) => `
            <tr>
              <td style="padding: 14px 0; border-top: 1px solid ${T.line}; width: 132px; vertical-align: top; font-family: ${LABEL}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.gold};">${esc(label)}</td>
              <td style="padding: 14px 0; border-top: 1px solid ${T.line}; vertical-align: top; font-family: ${BODY}; font-size: 16px; line-height: 1.5; color: ${T.cream}; font-weight: 600;">${value}</td>
            </tr>`;
  const none = `<span style="color: ${T.muted}; font-weight: 400;">Not given</span>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Barlow:wght@400;600;700;800&family=Barlow+Condensed:wght@600&display=swap');
  body { margin: 0; padding: 0; background: ${T.bg}; }
  a { color: ${T.gold}; }
  @media (max-width: 620px) {
    .st-pad { padding-left: 22px !important; padding-right: 22px !important; }
    .st-h1 { font-size: 28px !important; }
    .st-name { font-size: 24px !important; }
  }
</style>
</head>
<body style="margin: 0; padding: 0; background: ${T.bg};">
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: ${T.bg};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${T.bg};">
  <tr>
    <td align="center" style="padding: 28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background: ${T.panel}; border: 1px solid ${T.line}; border-radius: 18px; overflow: hidden;">
        <tr><td style="height: 5px; line-height: 5px; font-size: 0; background: ${T.green};">&nbsp;</td></tr>
        <tr>
          <td class="st-pad" style="padding: 26px 36px 0;">
            <a href="${esc(site)}" style="text-decoration: none;"><img src="${esc(site)}/images/site/logo-email.png" width="164" height="38" alt="Señor Tequila's" style="display: block; border: 0; width: 164px; height: auto;"></a>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 26px 36px 0;">
            <div style="font-family: ${LABEL}; font-weight: 600; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.gold};">${esc(f.label)} · Website ${noun}</div>
            <div class="st-h1" style="font-family: ${DISPLAY}; font-size: 34px; line-height: 1.02; text-transform: uppercase; color: ${T.cream}; margin-top: 8px;">New <span style="color: ${T.green};">${esc(f.label)}</span> ${noun}</div>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 22px 36px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${T.inset}; border: 1px solid rgba(185, 156, 102, 0.35); border-radius: 16px;">
              <tr>
                <td style="padding: 22px 22px 6px;">
                  <div style="font-family: ${LABEL}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.gold};">${phone ? 'Call back' : 'Write back'}</div>
                  <div class="st-name" style="font-family: ${DISPLAY}; font-size: 28px; line-height: 1.08; text-transform: uppercase; color: ${T.cream}; margin-top: 6px;">${esc(inq.name)}</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 22px 14px;">${buttons}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 20px 36px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${f.event ? row('Date', date ? esc(date) : none) + row(f.guests, guests ? esc(guests) : none) : ''}${row('Email', email ? `<a href="${esc(mailto)}" style="color: ${T.cream}; text-decoration: none;">${esc(email)}</a>` : none)}${f.event ? '' : row('Phone', phone ? esc(phone) : none)}
            </table>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 6px 36px 0;">
            <div style="border-top: 1px solid ${T.line}; padding-top: 14px; font-family: ${LABEL}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.gold};">${esc(f.details)}</div>
            <div style="margin-top: 10px; border-left: 3px solid ${T.goldDeep}; padding: 4px 0 4px 16px; font-family: ${BODY}; font-size: 16px; line-height: 1.65; color: ${T.text}; white-space: pre-wrap;">${inq.details ? esc(inq.details) : `<span style="color: ${T.muted};">Nothing written.</span>`}</div>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 24px 36px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(56, 176, 73, 0.1); border: 1px solid rgba(56, 176, 73, 0.45); border-radius: 12px;">
              <tr><td style="padding: 14px 18px; font-family: ${BODY}; font-size: 14px; line-height: 1.55; color: ${T.text};"><strong style="color: ${T.cream}; font-weight: 700;">What the site promised:</strong> ${esc(f.promise)}${f.event ? ' No deposit until they say yes.' : ''}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 22px 36px 28px; font-family: ${BODY}; font-size: 13px; line-height: 1.6; color: ${T.muted};">
            Sent ${esc(formatSent(when))} from <a href="${esc(site + inq.page)}" style="color: ${T.gold}; text-decoration: none; font-weight: 700;">${esc(site.replace(/^https?:\/\//, '') + inq.page)}</a>
          </td>
        </tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
        <tr>
          <td align="center" style="padding: 18px 20px 0; font-family: ${BODY}; font-size: 12px; line-height: 1.6; color: ${T.muted};">
            ${esc(business.name)} · ${esc(address)}<br>
            This is an automatic notification from the website. ${email ? 'Replying to this email goes straight to the guest.' : 'The guest did not give an email address, so reply by phone.'}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    `NEW ${f.label.toUpperCase()} ${noun.toUpperCase()}`,
    '',
    `Name: ${inq.name}`,
    `Phone: ${phone || 'Not given'}`,
    `Email: ${email || 'Not given'}`,
    ...(f.event ? [`Date: ${date || 'Not given'}`, `${f.guests}: ${guests || 'Not given'}`] : []),
    '',
    `${f.details}:`,
    inq.details || 'Nothing written.',
    '',
    `What the site promised: ${f.promise}` + (f.event ? ' No deposit until they say yes.' : ''),
    '',
    `Sent ${formatSent(when)} from ${site}${inq.page}`,
    `${business.name}, ${address}`,
  ].join('\n');

  return { subject, html, text };
}

// What the guest gets back when they leave an email address: that it arrived, what happens
// next, and a copy of what they sent. Same tokens as the manager's notification.
export function buildConfirmationEmail(inq, { business }) {
  const f = FORMS[inq.form];
  const first = String(inq.name).trim().split(/\s+/)[0];
  const site = business.siteUrl;
  const address = `${business.streetAddress}, ${business.addressLocality}, ${business.addressRegion} ${business.postalCode}`;
  const ourPhone = formatPhone(business.telephone);
  const date = formatDate(inq.date);
  const what = f.event ? `${f.label.toLowerCase()} request` : 'message';
  const next = inq.phone ? `We will call you at ${formatPhone(inq.phone)}.` : 'We will write back to this address.';
  const subject = `We got your ${what}, ${first}`;
  const line = (label, value) => value ? `
            <tr>
              <td style="padding: 12px 0; border-top: 1px solid ${T.line}; width: 132px; vertical-align: top; font-family: ${LABEL}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.gold};">${esc(label)}</td>
              <td style="padding: 12px 0; border-top: 1px solid ${T.line}; vertical-align: top; font-family: ${BODY}; font-size: 15px; line-height: 1.55; color: ${T.text}; white-space: pre-wrap;">${esc(value)}</td>
            </tr>` : '';
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Barlow:wght@400;600;700;800&family=Barlow+Condensed:wght@600&display=swap');
  body { margin: 0; padding: 0; background: ${T.bg}; }
  @media (max-width: 620px) { .st-pad { padding-left: 22px !important; padding-right: 22px !important; } .st-h1 { font-size: 28px !important; } }
</style>
</head>
<body style="margin: 0; padding: 0; background: ${T.bg};">
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: ${T.bg};">${esc(f.promise + ' ' + next)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${T.bg};">
  <tr>
    <td align="center" style="padding: 28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background: ${T.panel}; border: 1px solid ${T.line}; border-radius: 18px; overflow: hidden;">
        <tr><td style="height: 5px; line-height: 5px; font-size: 0; background: ${T.green};">&nbsp;</td></tr>
        <tr><td class="st-pad" style="padding: 26px 36px 0;"><a href="${esc(site)}" style="text-decoration: none;"><img src="${esc(site)}/images/site/logo-email.png" width="164" height="38" alt="Señor Tequila's" style="display: block; border: 0; width: 164px; height: auto;"></a></td></tr>
        <tr>
          <td class="st-pad" style="padding: 26px 36px 0;">
            <div style="font-family: ${LABEL}; font-weight: 600; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.gold};">${esc(business.addressLocality)}, ${esc(business.addressRegion)}</div>
            <div class="st-h1" style="font-family: ${DISPLAY}; font-size: 34px; line-height: 1.02; text-transform: uppercase; color: ${T.cream}; margin-top: 8px;">Got it, <span style="color: ${T.green};">${esc(first)}</span></div>
            <div style="font-family: ${BODY}; font-size: 17px; line-height: 1.65; color: ${T.text}; margin-top: 16px;">Thanks for writing to ${esc(business.name)}. Your ${esc(what)} is with our team. ${esc(f.promise)} ${esc(next)}</div>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 22px 36px 0;">
            <a href="${esc(telHref(business.telephone))}" style="display: inline-block; background: ${T.green}; color: ${T.ink}; font-family: ${BODY}; font-weight: 800; font-size: 16px; text-decoration: none; padding: 14px 22px; border-radius: 12px;">Need us sooner? Call ${esc(ourPhone)}</a>
          </td>
        </tr>
        <tr>
          <td class="st-pad" style="padding: 26px 36px 0;">
            <div style="font-family: ${LABEL}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.gold}; padding-bottom: 10px;">What you sent</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${line('Name', inq.name)}${line('Phone', inq.phone ? formatPhone(inq.phone) : '')}${f.event ? line('Date', date) + line(f.guests, inq.guests ? String(inq.guests) : '') : ''}${line(f.event ? 'Details' : 'Message', inq.details)}
            </table>
          </td>
        </tr>
        <tr><td class="st-pad" style="padding: 22px 36px 28px; font-family: ${BODY}; font-size: 13px; line-height: 1.6; color: ${T.muted};">If you did not send this, you can ignore it. Nothing else will be emailed to you.</td></tr>
      </table>
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px;">
        <tr><td align="center" style="padding: 18px 20px 0; font-family: ${BODY}; font-size: 12px; line-height: 1.6; color: ${T.muted};">${esc(business.name)} · ${esc(address)} · <a href="${esc(site)}" style="color: ${T.gold}; text-decoration: none;">${esc(site.replace(/^https?:\/\//, ''))}</a></td></tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  const text = [
    `Got it, ${first}.`,
    '',
    `Thanks for writing to ${business.name}. Your ${what} is with our team. ${f.promise} ${next}`,
    `Need us sooner? Call ${ourPhone}.`,
    '',
    'What you sent:',
    `Name: ${inq.name}`,
    ...(inq.phone ? [`Phone: ${formatPhone(inq.phone)}`] : []),
    ...(f.event && date ? [`Date: ${date}`] : []),
    ...(f.event && inq.guests ? [`${f.guests}: ${inq.guests}`] : []),
    ...(inq.details ? ['', inq.details] : []),
    '',
    'If you did not send this, you can ignore it. Nothing else will be emailed to you.',
    `${business.name}, ${address}`,
  ].join('\n');
  return { subject, html, text };
}
