// Build-time helpers for the blog: reading time, table of contents, related articles, structured data.
import { slugify } from './slug.js';

const WORDS_PER_MINUTE = 220;

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
export const stripTags = (html) => decode(String(html ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

export function readingTime(html) {
  const text = stripTags(html);
  const words = text ? text.split(' ').length : 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Nested table of contents from the h2/h3 headings of rendered article HTML. */
export function buildToc(html) {
  const toc = [];
  const pattern = /<h([23])\b[^>]*?\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  for (const [, level, id, inner] of String(html ?? '').matchAll(pattern)) {
    const entry = { id, text: stripTags(inner), children: [] };
    if (level === '2' || toc.length === 0) toc.push(entry);
    else toc.at(-1).children.push(entry);
  }
  return toc;
}

export const tagSlug = (tag) => slugify(tag);

// A tag page with a single article only repeats that article, so search engines skip it until
// the tag has this many.
const MIN_POSTS_TO_INDEX_TAG = 2;

/** Tags across all posts, most used first: [{ name, slug, posts, indexed }]. */
export function buildTagIndex(posts) {
  const tags = new Map();
  for (const post of posts) {
    for (const name of post.data.tags ?? []) {
      const slug = tagSlug(name);
      if (!slug) continue;
      if (!tags.has(slug)) tags.set(slug, { name, slug, posts: [] });
      tags.get(slug).posts.push(post);
    }
  }
  return [...tags.values()]
    .map((tag) => ({ ...tag, indexed: tag.posts.length >= MIN_POSTS_TO_INDEX_TAG }))
    .sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name));
}

/** The latest change across posts: each post's "updated" date, or its publication date. Null when empty. */
export function lastModified(posts) {
  const times = posts.map((post) => new Date(post.data.updated || post.date).getTime());
  return times.length ? new Date(Math.max(...times)) : null;
}

/** Other posts that share tags with this one, strongest overlap first, newest first on ties. */
export function relatedPosts(posts, currentUrl, tags = [], limit = 3) {
  const own = new Set(tags.map(tagSlug));
  return posts
    .filter((post) => post.url !== currentUrl)
    .map((post) => ({ post, shared: (post.data.tags ?? []).filter((t) => own.has(tagSlug(t))).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.post.date - a.post.date)
    .slice(0, limit)
    .map(({ post }) => post);
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const readableDate = (date) => DATE_FORMAT.format(new Date(date));
export const isoDateTime = (date) => new Date(date).toISOString();
export const isoDate = (date) => isoDateTime(date).slice(0, 10);

export const absoluteUrl = (value, base) => (/^https?:\/\//.test(value) ? value : `${base.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`);

/** schema.org BlogPosting for one article, as a JSON string that is safe inside a <script> element. */
export function blogPostingJsonLd({ title, description, date, updated, url, image, tags, site }) {
  const person = { '@type': 'Person', name: site.author.name, url: `${site.url}/` };
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: new Date(date).toISOString(),
    dateModified: new Date(updated || date).toISOString(),
    author: person,
    publisher: person,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    image: [image],
    keywords: (tags ?? []).join(', '),
    inLanguage: site.language,
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
