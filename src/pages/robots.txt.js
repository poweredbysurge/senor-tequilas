// The sitemap line is absolute and on the production domain, from business.json.
// See DESIGN-DEBT.md entry 55.
import business from '../data/business.json';

export function GET() {
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      '# WordPress cruft that must stay out of the index',
      'Disallow: /author/',
      'Disallow: /feed/',
      'Disallow: /comments/feed/',
      '',
      `Sitemap: ${business.siteUrl}/sitemap.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
