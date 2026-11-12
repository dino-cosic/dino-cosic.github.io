import assert from 'node:assert/strict';
import { test } from 'node:test';
import MarkdownIt from 'markdown-it';
import { blogPostingJsonLd, buildTagIndex, buildToc, readingTime, relatedPosts } from '../lib/blog.js';
import { configureMarkdown } from '../lib/markdown.js';

const post = (url, date, tags) => ({ url, date: new Date(date), data: { title: url, tags } });

test('readingTime rounds to whole minutes and never reports zero', () => {
  assert.equal(readingTime('<p>short</p>'), 1);
  assert.equal(readingTime(`<p>${'word '.repeat(660)}</p>`), 3);
});

test('markdown headings get unique ids and feed a nested table of contents', () => {
  const md = configureMarkdown(new MarkdownIt({ html: true }));
  const html = md.render('## Setup\n\n### Install `npm`\n\n## Setup\n\n#### Too deep\n');
  assert.match(html, /<h2 id="setup">/);
  assert.match(html, /<h3 id="install-npm">/);
  assert.match(html, /<h2 id="setup-2">/);
  assert.deepEqual(buildToc(html), [
    { id: 'setup', text: 'Setup', children: [{ id: 'install-npm', text: 'Install npm', children: [] }] },
    { id: 'setup-2', text: 'Setup', children: [] },
  ]);
});

test('a heading whose own slug was taken by a numbered duplicate still gets a unique id', () => {
  const md = configureMarkdown(new MarkdownIt({ html: true }));
  const ids = [...md.render('## A\n\n## A\n\n## A-2\n\n## A\n').matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ['a', 'a-2', 'a-2-2', 'a-3']);
});

test('markdown images become lazy figures with captions, tables scroll, external links are marked', () => {
  const md = configureMarkdown(new MarkdownIt({ html: true }));
  const html = md.render('![Alt text](/assets/blog/a.png "A caption")\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n[out](https://example.com) [in](/blog/)\n');
  assert.match(html, /<figure><img src="\/assets\/blog\/a\.png" alt="Alt text" loading="lazy" decoding="async"><figcaption>A caption<\/figcaption><\/figure>/);
  assert.match(html, /<div class="table-wrap"[^>]*><table>/);
  assert.match(html, /<a href="https:\/\/example\.com" rel="noopener">/);
  assert.match(html, /<a href="\/blog\/">/);
});

test('related posts are ranked by shared tags, then recency, and exclude the current post', () => {
  const posts = [
    post('/a/', '2026-01-01', ['AI', 'Architecture']),
    post('/b/', '2026-02-01', ['AI']),
    post('/c/', '2026-03-01', ['AI', 'Architecture']),
    post('/d/', '2026-04-01', ['DevOps']),
  ];
  assert.deepEqual(relatedPosts(posts, '/a/', ['AI', 'Architecture']).map((p) => p.url), ['/c/', '/b/']);
  assert.deepEqual(relatedPosts(posts, '/d/', ['DevOps']), []);
});

test('the tag index groups posts under one slug per tag', () => {
  const index = buildTagIndex([post('/a/', '2026-01-01', ['.NET', 'AI']), post('/b/', '2026-02-01', ['AI'])]);
  assert.deepEqual(index.map((t) => [t.slug, t.posts.length]), [['ai', 2], ['dotnet', 1]]);
});

test('structured data is valid JSON and cannot close its script element', () => {
  const json = blogPostingJsonLd({
    title: 'Using </script> safely', description: 'd', date: new Date('2026-11-11'), updated: null,
    url: 'https://example.com/blog/x/', image: 'https://example.com/og.png', tags: ['AI'],
    site: { url: 'https://example.com', language: 'en', author: { name: 'Dino Cosic' } },
  });
  assert.ok(!json.includes('</script>'));
  const data = JSON.parse(json);
  assert.equal(data['@type'], 'BlogPosting');
  assert.equal(data.headline, 'Using </script> safely');
  assert.equal(data.dateModified, data.datePublished);
});
