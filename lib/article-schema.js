// Frontmatter schema for blog articles. The build calls validateArticles() and fails on any error.
import fs from 'node:fs';
import path from 'node:path';
import { isValidSlug, slugify } from './slug.js';

export const FIELDS = {
  required: ['title', 'description', 'date', 'tags'],
  optional: ['updated', 'slug', 'coverImage', 'coverAlt', 'mediumUrl', 'canonicalUrl', 'draft'],
};

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isHttpUrl = (v) => {
  if (typeof v !== 'string') return false;
  try { return ['https:', 'http:'].includes(new URL(v).protocol); } catch { return false; }
};

export function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Markdown body without fenced code, so a "# comment" inside a code block is not read as a heading.
const stripFences = (markdown) => String(markdown ?? '').replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '');

/**
 * Validate one article.
 * @param {object} data      Frontmatter values.
 * @param {object} [options]
 * @param {string} [options.body]     Raw Markdown body, checked for heading hierarchy.
 * @param {string} [options.siteDir]  Folder that root-relative URLs map to (src/). When given, local coverImage paths must exist.
 * @returns {string[]} Human-readable problems. Empty when the article is valid.
 */
export function validateArticle(data = {}, { body, siteDir } = {}) {
  const errors = [];

  if (!isText(data.title)) errors.push('"title" is required and must be a non-empty string.');
  if (!isText(data.description)) errors.push('"description" is required: one or two sentences used on the listing, in search results and in link previews.');

  const date = toDate(data.date);
  if (data.date === undefined || data.date === null || data.date === '') errors.push('"date" is required (publication date, written as YYYY-MM-DD).');
  else if (!date) errors.push(`"date" is not a valid date: ${JSON.stringify(data.date)}. Use YYYY-MM-DD.`);

  if (data.updated !== undefined && data.updated !== null && data.updated !== '') {
    const updated = toDate(data.updated);
    if (!updated) errors.push(`"updated" is not a valid date: ${JSON.stringify(data.updated)}. Use YYYY-MM-DD or leave it empty.`);
    else if (date && updated < date) errors.push('"updated" is earlier than "date".');
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    errors.push('"tags" is required: a list with at least one tag.');
  } else {
    const seen = new Map();
    for (const tag of data.tags) {
      if (!isText(tag)) { errors.push(`"tags" contains an empty or non-text entry: ${JSON.stringify(tag)}.`); continue; }
      const key = slugify(tag);
      if (!key) errors.push(`Tag ${JSON.stringify(tag)} has no letters or digits, so it cannot get a URL.`);
      else if (seen.has(key)) errors.push(`Tags ${JSON.stringify(seen.get(key))} and ${JSON.stringify(tag)} resolve to the same URL (/blog/tags/${key}/). Keep one.`);
      else seen.set(key, tag);
    }
  }

  if (data.slug !== undefined && data.slug !== null && data.slug !== '' && !isValidSlug(data.slug)) {
    errors.push(`"slug" must be lowercase letters, digits and single hyphens: ${JSON.stringify(data.slug)}.`);
  }

  if (data.coverImage) {
    if (typeof data.coverImage !== 'string') errors.push('"coverImage" must be a path such as /assets/blog/my-article/cover.webp.');
    else if (data.coverImage.startsWith('/')) {
      if (siteDir && !fs.existsSync(path.join(siteDir, data.coverImage))) errors.push(`"coverImage" points to a file that does not exist: ${data.coverImage}.`);
    } else if (!isHttpUrl(data.coverImage)) errors.push(`"coverImage" must start with "/" (a file in this repo) or be a full URL: ${JSON.stringify(data.coverImage)}.`);
  }
  if (data.coverAlt !== undefined && data.coverAlt !== null && typeof data.coverAlt !== 'string') errors.push('"coverAlt" must be text.');

  for (const field of ['mediumUrl', 'canonicalUrl']) {
    if (data[field] && !isHttpUrl(data[field])) errors.push(`"${field}" must be a full URL starting with https://: ${JSON.stringify(data[field])}.`);
  }

  if (data.draft !== undefined && data.draft !== null && typeof data.draft !== 'boolean') {
    errors.push(`"draft" must be true or false, got ${JSON.stringify(data.draft)}.`);
  }

  if (body !== undefined && /^#\s+\S/m.test(stripFences(body))) {
    errors.push('The body contains a level-1 heading ("# ..."). The title is the page\'s only h1; start sections at "## ".');
  }

  return errors;
}

export class ArticleValidationError extends Error {
  constructor(problems) {
    const lines = problems.flatMap(({ file, errors }) => [`\n  ${file}`, ...errors.map((e) => `    - ${e}`)]);
    const count = problems.reduce((n, p) => n + p.errors.length, 0);
    super(`Invalid article metadata (${count} problem${count === 1 ? '' : 's'}):${lines.join('\n')}\n`);
    this.name = 'ArticleValidationError';
    this.problems = problems;
  }
}

/**
 * Validate a set of articles, including uniqueness of URLs and titles across the set.
 * @param {{file: string, data: object, body?: string, url?: string}[]} articles
 * @returns {{file: string, errors: string[]}[]} One entry per article with problems.
 */
export function collectProblems(articles, { siteDir } = {}) {
  const byFile = new Map();
  const add = (file, error) => byFile.set(file, [...(byFile.get(file) ?? []), error]);

  const urls = new Map();
  const titles = new Map();
  for (const article of articles) {
    for (const error of validateArticle(article.data, { body: article.body, siteDir })) add(article.file, error);

    if (article.url) {
      if (urls.has(article.url)) add(article.file, `URL ${article.url} is already used by ${urls.get(article.url)}. Give one of them a different "slug".`);
      else urls.set(article.url, article.file);
    }
    const title = typeof article.data?.title === 'string' ? article.data.title.trim().toLowerCase() : '';
    if (title) {
      if (titles.has(title)) add(article.file, `Title duplicates ${titles.get(title)}. Every article needs a unique title.`);
      else titles.set(title, article.file);
    }
  }
  return [...byFile].map(([file, errors]) => ({ file, errors }));
}

export function validateArticles(articles, options) {
  const problems = collectProblems(articles, options);
  if (problems.length) throw new ArticleValidationError(problems);
}
