// Turns one HTML file from a Medium export into article metadata plus Markdown.
// Pure: no file or network access, so it can be tested against fixtures.
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from '@joplin/turndown-plugin-gfm';
import { slugify } from '../../lib/slug.js';

// Elements the converter knows how to carry into Markdown. Anything else is kept as raw HTML
// (or as a visible marker when it has no text) and listed in the report.
const SUPPORTED = new Set([
  'p', 'a', 'strong', 'b', 'em', 'i', 'u', 'code', 'pre', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
  'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'del', 's', 'strike', 'sup', 'sub', 'mark', 'kbd', 'div', 'section', 'span', 'figure', 'figcaption',
]);

const REVIEW_MARK = 'MANUAL REVIEW';
const clean = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
const normaliseTitle = (title) => clean(title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export { normaliseTitle };

/** Medium ids are the hex suffix of a story URL or export file name. */
export function mediumIdFrom(value) {
  if (!value) return null;
  const text = String(value).split(/[?#]/)[0].replace(/\.html?$/i, '').replace(/\/+$/, '');
  const match = text.match(/(?:^|[-/_])([0-9a-f]{8,16})$/i);
  return match ? match[1].toLowerCase() : null;
}

/** Export files are named YYYY-MM-DD_Title-<id>.html, or draft_Title-<id>.html for unpublished ones. */
export function parseFileName(fileName) {
  const base = String(fileName).split(/[\\/]/).pop();
  const dated = base.match(/^(\d{4}-\d{2}-\d{2})_/);
  return {
    isDraft: /^draft_/i.test(base),
    date: dated ? dated[1] : null,
    id: mediumIdFrom(base),
  };
}

function truncate(text, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 60)).replace(/[\s,;:.]+$/, '')}…`;
}

function createTurndown() {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  turndown.use(gfm);
  // Turndown pads list markers to four columns ("-   item"); write the usual single space instead.
  turndown.addRule('listItem', {
    filter: 'li',
    replacement(content, node, options) {
      const parent = node.parentNode;
      let prefix = `${options.bulletListMarker} `;
      if (parent.nodeName === 'OL') {
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = `${Number(parent.getAttribute('start') || 1) + index}. `;
      }
      const body = content.replace(/^\n+/, '').replace(/\n+$/, '\n').replace(/\n/gm, `\n${' '.repeat(prefix.length)}`);
      return prefix + body + (node.nextSibling && !/\n$/.test(body) ? '\n' : '');
    },
  });
  // Kept as inline HTML: Markdown has no syntax for these, and dropping the tag changes meaning (x² vs x2).
  turndown.keep(['sup', 'sub', 'kbd', 'mark']);
  // Anything unknown that still has content is preserved verbatim rather than flattened to text.
  turndown.keep((node) => node.nodeType === 1 && !SUPPORTED.has(node.nodeName.toLowerCase()));
  return turndown;
}

/**
 * @param {string} html      Contents of one export file.
 * @param {string} fileName  Its file name; used for the draft marker, the date and the id.
 * @returns {object} kind ('article' | 'draft' | 'response'), metadata, markdown, images, unsupported, notes.
 */
export function convertMediumPost(html, fileName) {
  const $ = cheerio.load(html);
  const file = parseFileName(fileName);
  const notes = [];
  const unsupported = [];

  // ---- locate the body; exports differ between years, so fall back step by step ----
  let $body = $('section[data-field="body"]').first();
  if (!$body.length) $body = $('.e-content').first();
  if (!$body.length) {
    $body = $('article').first();
    if (!$body.length) $body = $('body').first();
    notes.push('The usual body container was not found; the whole page was converted. Check for stray header or footer text.');
  }

  // ---- metadata ----
  const $titleGraf = $body.find('.graf--title').first();
  const title = clean($('h1.p-name').first().text()) || clean($titleGraf.text()) || clean($('head > title').text());
  const published = $('time.dt-published').attr('datetime') || $('meta[property="article:published_time"]').attr('content') || null;
  const publishedDate = published && !Number.isNaN(new Date(published).getTime()) ? new Date(published).toISOString().slice(0, 10) : null;
  const date = publishedDate || file.date;
  const mediumUrl = $('a.p-canonical').attr('href') || $('link[rel="canonical"]').attr('href') || null;
  const mediumId = mediumIdFrom(mediumUrl) || file.id;
  // Older exports have no canonical link. Every story also answers at medium.com/p/<id>.
  const resolvedUrl = mediumUrl || (mediumId && !file.isDraft ? `https://medium.com/p/${mediumId}` : null);

  const tags = [];
  $('a[rel~="tag"], .p-category, ul.tags a').each((_, el) => { tags.push(clean($(el).text())); });
  $('meta[property="article:tag"]').each((_, el) => { tags.push(clean($(el).attr('content'))); });
  for (const keyword of ($('meta[name="keywords"]').attr('content') ?? '').split(',')) tags.push(clean(keyword));
  const uniqueTags = [...new Map(tags.filter(Boolean).map((t) => [t.toLowerCase(), t])).values()];

  const $subtitleGraf = $body.find('.graf--subtitle').first();
  const summary = clean($('section[data-field="subtitle"]').first().text());
  const hadTitleGraf = $titleGraf.length > 0;

  // ---- clean up the body before conversion ----
  $body.find('header, footer, style, noscript').remove();
  if ($titleGraf.length && normaliseTitle($titleGraf.text()) === normaliseTitle(title)) $titleGraf.remove();
  // Exports without Medium's classes repeat the title as a plain h1 at the top of the body.
  $body.find('h1').filter((_, el) => normaliseTitle($(el).text()) === normaliseTitle(title)).first().remove();
  const subtitle = clean($subtitleGraf.text());
  $subtitleGraf.remove();

  // Medium opens every section with a divider. The first is decoration, later ones are real breaks.
  $body.find('div.section-divider').each((i, el) => { if (i === 0) $(el).remove(); else $(el).replaceWith('<hr>'); });

  const marker = (label, detail) => {
    const $p = $('<p></p>');
    $p.append($('<strong></strong>').text(`[${REVIEW_MARK}: ${label}]`));
    if (detail) { $p.append(' '); $p.append(/^https?:\/\//.test(detail) ? $('<a></a>').attr('href', detail).text(detail) : $('<span></span>').text(detail)); }
    return $p;
  };

  // Embeds (gists, videos, tweets) only exist as a frame pointing back at Medium or the source.
  $body.find('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    const gist = src.replace(/\.js$/, '');
    unsupported.push({ element: 'script', detail: src });
    $(el).replaceWith(marker(/gist\.github\.com/.test(src) ? 'embedded gist, paste the code here' : 'embedded script', gist));
  });
  $body.find('script').remove();
  $body.find('iframe').each((_, el) => {
    const src = $(el).attr('src') || '';
    unsupported.push({ element: 'iframe', detail: src || '(no source)' });
    const $figure = $(el).closest('figure');
    const caption = clean($figure.find('figcaption').text());
    const $marker = marker('embedded content was not exported', src);
    if (caption) $marker.append($('<em></em>').text(` ${caption}`));
    ($figure.length ? $figure : $(el)).replaceWith($marker);
  });

  // Link cards become plain links to the same target.
  $body.find('.graf--mixtapeEmbed').each((_, el) => {
    const $a = $(el).find('a[href]').first();
    const label = clean($(el).find('strong').first().text()) || clean($a.text()) || $a.attr('href');
    if ($a.length) $(el).replaceWith($('<p></p>').append($('<a></a>').attr('href', $a.attr('href')).text(label)));
  });

  // Images: alt text from the image, else from the caption; the caption is kept as the image title.
  const images = [];
  const toImage = ($img, caption) => {
    const src = $img.attr('src') || $img.attr('data-src') || '';
    if (!src) return null;
    const alt = clean($img.attr('alt')) || caption;
    if (!alt) notes.push(`Image without alt text: ${src}`);
    if (!images.some((image) => image.url === src)) images.push({ url: src, alt });
    const $new = $('<img>').attr('src', src).attr('alt', alt).attr('data-converted', '1');
    if (caption) $new.attr('title', caption.replace(/"/g, '\''));
    return $('<p></p>').append($new);
  };
  $body.find('figure').each((_, el) => {
    const $figure = $(el);
    const $imgs = $figure.find('img');
    if (!$imgs.length) return;
    const caption = clean($figure.find('figcaption').text());
    const parts = $imgs.toArray().map((img) => toImage($(img), caption)).filter(Boolean);
    $figure.replaceWith(parts.length ? parts : marker('figure without an image source'));
  });
  $body.find('img').each((_, el) => {
    if ($(el).attr('data-converted')) return; // came out of a figure above
    const $p = toImage($(el), '');
    if (!$p) { $(el).remove(); return; }
    if ($(el).closest('p, li, td, th, a').length) $(el).replaceWith($p.children()); // inline: keep position
    else $(el).replaceWith($p);
  });

  // Code blocks: Medium separates lines with <br> and keeps the language in a data attribute.
  $body.find('pre').each((_, el) => {
    const $pre = $(el);
    $pre.find('br').replaceWith('\n');
    const language = clean($pre.attr('data-code-block-lang') || ($pre.find('code').attr('class') ?? '').match(/language-(\S+)/)?.[1] || '').toLowerCase();
    const $code = $('<code></code>').text($pre.text().replace(/ /g, ' ').replace(/\n+$/, ''));
    if (language && language !== 'plaintext' && language !== 'text') $code.attr('class', `language-${language}`);
    $pre.replaceWith($('<pre></pre>').append($code));
  });

  // Headings: the page title is the only h1, so Medium's large heading becomes h2 and its small one h3.
  const levels = { h1: 'h2', h2: 'h2', h3: 'h2', h4: 'h3', h5: 'h4', h6: 'h4' };
  const hasSmallOnly = !$body.find('h1, h2, h3').length && $body.find('h4').length > 0;
  $body.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
    el.tagName = hasSmallOnly && el.tagName === 'h4' ? 'h2' : levels[el.tagName];
  });

  // Whatever is left that we do not recognise: keep it, and say so.
  $body.find('*').each((_, el) => {
    const name = el.tagName?.toLowerCase();
    if (!name || SUPPORTED.has(name)) return;
    const $el = $(el);
    if ($el.parentsUntil($body).toArray().some((parent) => !SUPPORTED.has(parent.tagName?.toLowerCase()))) return; // reported with its ancestor
    const source = $el.attr('src') || $el.attr('href') || $el.attr('data-src') || '';
    unsupported.push({ element: name, detail: source || truncate(clean($el.text()), 80) || '(empty)' });
    if (!clean($el.text())) $el.replaceWith(marker(`unsupported <${name}> element`, source));
  });

  $body.find('p').each((_, el) => { if (!clean($(el).text()) && !$(el).find('img').length) $(el).remove(); });

  // ---- description ----
  const firstParagraph = clean($body.find('p').filter((_, el) => clean($(el).text()).length > 40 && !$(el).text().includes(REVIEW_MARK)).first().text());
  let description = subtitle || summary;
  let descriptionSource = 'subtitle';
  if (!description || normaliseTitle(description) === normaliseTitle(title)) {
    description = truncate(firstParagraph);
    descriptionSource = 'first-paragraph';
  }

  // ---- classify ----
  const text = clean($body.text());
  const wordCount = text ? text.split(' ').length : 0;
  const headingCount = $body.find('h2, h3, h4').length;
  let kind = 'article';
  if (file.isDraft || !date) kind = 'draft';
  // Replies to other people's stories are exported next to real stories. They have no title block.
  else if (!hadTitleGraf && headingCount === 0 && images.length === 0 && wordCount < 150) kind = 'response';

  const markdown = `${createTurndown().turndown($body.html() ?? '').replace(/ /g, ' ').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()}\n`;

  // ---- what a person should look at ----
  if (!title) notes.push('No title found.');
  if (!uniqueTags.length) notes.push('No tags in the export. Add at least one tag before publishing.');
  if (descriptionSource === 'first-paragraph') notes.push(description ? 'No subtitle in the export; the description was taken from the first paragraph. Rewrite it.' : 'No description could be derived. Write one.');
  if (!resolvedUrl) notes.push('No Medium URL in the export; "mediumUrl" is empty.');
  else if (!mediumUrl) notes.push(`No Medium URL in the export; "mediumUrl" was rebuilt from the story id as ${resolvedUrl}. Check that it opens.`);
  if (!publishedDate && file.date) notes.push('Publication date taken from the file name.');
  if (unsupported.length) notes.push(`${unsupported.length} element${unsupported.length === 1 ? '' : 's'} could not be converted cleanly. Search the file for "${REVIEW_MARK}" and for raw HTML.`);
  if (kind === 'article' && wordCount < 150) notes.push(`Very short (${wordCount} words). Check that the content is complete.`);

  return {
    kind,
    title,
    description,
    date,
    mediumUrl: resolvedUrl,
    mediumId,
    tags: uniqueTags,
    slug: slugify(title) || (mediumId ? `medium-${mediumId}` : ''),
    markdown,
    images,
    unsupported,
    notes,
    wordCount,
  };
}

/** The Markdown file for a converted article. Field order is fixed so reruns produce identical files. */
export function renderArticleFile(article, markdown = article.markdown) {
  const q = (value) => JSON.stringify(value ?? '');
  const lines = [
    '---',
    `title: ${q(article.title)}`,
    `description: ${q(article.description)}`,
    `date: ${article.date}`,
    'updated:',
    `slug: ${q(article.slug)}`,
    article.tags.length ? `tags:\n${article.tags.map((tag) => `  - ${q(tag)}`).join('\n')}` : 'tags: []',
    'coverImage:',
    'coverAlt:',
    article.mediumUrl ? `mediumUrl: ${q(article.mediumUrl)}` : 'mediumUrl:',
    'canonicalUrl:',
    // Imported articles start as drafts: nothing reaches production until someone has read it.
    'draft: true',
    '---',
  ];
  return `${lines.join('\n')}\n\n${markdown}`;
}
