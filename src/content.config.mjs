// The Guides section's articles, as a content collection (DESIGN-DEBT.md entry 145). The loader
// reads the approved copy where it already lives, design/copy/guides/, rather than a copy of it
// under src/content/, so there is one file per guide and the published text cannot drift from
// the approved one. A new guide is one Markdown file dropped in that folder, plus its photos in
// src/data/guides.js. `draft: true` keeps a guide out of the build entirely: see src/lib/guides.js.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './design/copy/guides' }),
  schema: z.object({
    slug: z.string(),
    url: z.string().regex(/^\/guides\/[a-z0-9-]+$/),
    title_tag: z.string(),
    meta_description: z.string(),
    byline: z.string(),
    date_published: z.coerce.date(),
    date_modified: z.coerce.date(),
    article_section: z.enum(['Menu', 'Private Events']),
    primary_keyword: z.string().optional(),
    draft: z.boolean(),
  }),
});

export const collections = { guides };
