// Runs the real Eleventy build in a sandbox: a temporary copy of the files the site is built from,
// with this test's own articles added. The repository itself is never written to, so test
// articles cannot reach src/, dist/ or a deploy.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const eleventy = path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs');
// Everything the production build reads. If the build starts reading something else, the sandbox
// build fails, which is the cue to add it here.
const SITE_FILES = ['package.json', 'eleventy.config.js', 'src', 'lib', 'css', 'js', 'assets'];
const SITE_URL = 'https://example.test';

const fixtures = {
  'zz-test-published.md': `---
title: "Build test: published article"
description: "A published fixture & its description."
date: 2020-01-02
updated: 2020-02-03
slug: "zz-test-published"
tags:
  - ZZ Test Tag
  - .NET
mediumUrl: "https://medium.com/@dino.cosic/build-test-aaaabbbbcccc"
draft: false
---

Intro paragraph.

## First section

\`\`\`csharp
var answer = 42; // {{ not a template }}
\`\`\`

### Detail

Text.

## Second section

| A | B |
| - | - |
| 1 | 2 |
`,
  'zz-test-canonical.md': `---
title: "Build test: canonical elsewhere"
description: "A fixture whose canonical URL points at another site."
date: 2020-01-03
updated: "2020-01-20"
tags:
  - ZZ Test Tag
canonicalUrl: "https://elsewhere.example/original/"
---

Body.
`,
  'zz-test-draft.md': `---
title: "Build test: draft article"
description: "A draft fixture."
date: 2020-01-04
tags: []
draft: true
---

Draft body.
`,
};
const INVALID = 'zz-test-invalid.md';

let sandbox;
let posts;
let out;

function build(outDir, env = {}) {
  return spawnSync(process.execPath, [eleventy, `--output=${outDir}`, '--quiet'], {
    cwd: sandbox, encoding: 'utf8', env: { ...process.env, SITE_URL, BLOG_DRAFTS: '', ...env },
  });
}

const read = (file) => fs.readFileSync(path.join(out, file), 'utf8');
const has = (file) => fs.existsSync(path.join(out, file));

// A fingerprint of the real articles folder, compared before and after the run.
const realPosts = path.join(root, 'src/blog/posts');
const snapshot = () => fs.readdirSync(realPosts).sort().map((name) => `${name}:${fs.statSync(path.join(realPosts, name)).mtimeMs}`);
let before_;

before(() => {
  before_ = snapshot();
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'site-sandbox-'));
  for (const name of SITE_FILES) fs.cpSync(path.join(root, name), path.join(sandbox, name), { recursive: true });
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(sandbox, 'node_modules'), 'dir');
  posts = path.join(sandbox, 'src/blog/posts');
  for (const [name, content] of Object.entries(fixtures)) fs.writeFileSync(path.join(posts, name), content);
  out = path.join(sandbox, 'dist');
  const result = build(out);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
after(() => { fs.rmSync(sandbox, { recursive: true, force: true }); });

test('the test build never writes to the repository', () => {
  assert.deepEqual(snapshot(), before_);
  for (const name of Object.keys(fixtures)) assert.ok(!fs.existsSync(path.join(realPosts, name)), `${name} leaked into src/blog/posts`);
});

test('stylesheets, scripts and images are copied through unchanged', () => {
  for (const file of ['css/site.css', 'css/tokens.css', 'js/main.js', 'js/hero-scene.js', 'assets/og.png']) {
    assert.deepEqual(fs.readFileSync(path.join(out, file)), fs.readFileSync(path.join(root, file)), `${file} differs from its source`);
  }
});

test('the homepage is built from the shared layout and site data', () => {
  const html = read('index.html');
  assert.match(html, /<title>Dino Cosic, Senior Software Engineer and Technical Lead<\/title>/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL}/">`));
  assert.match(html, new RegExp(`<meta property="og:url" content="${SITE_URL}/">`));
  assert.ok(!html.includes('dino-cosic.github.io'), 'no hardcoded production URL');
  assert.match(html, /<meta name="google-site-verification"/);
  assert.match(html, /<script type="importmap">/);
  assert.match(html, /<script type="module" src="\/js\/main\.js"><\/script>/);
  assert.ok(!html.includes('/css/blog.css') && !html.includes('/js/blog.js'), 'no blog bundle on the homepage');
  assert.equal((html.match(/<path d="M/g) ?? []).length > 100, true, 'the portrait strokes are inlined');
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, 'exactly one h1');
  // main.js highlights the current section by matching bare fragment links.
  assert.match(html, /<a href="#work">Work<\/a>/);
  assert.match(html, /<a class="bar-mark" href="#top"/);
  assert.ok(!html.includes('&amp;amp;'), 'nothing is escaped twice');
  assert.match(html, /\?subject=R%C3%A9sum%C3%A9%20request&amp;body=/);
});

test('blog pages link back to the homepage sections', () => {
  const html = read('blog/index.html');
  assert.match(html, /<a href="\/#work">Work<\/a>/);
  assert.match(html, /<a class="bar-mark" href="\/"/);
  assert.match(html, /<a href="\/blog\/" aria-current="page">Writing<\/a>/);
  assert.match(read('blog/zz-test-published/index.html'), /<a href="\/blog\/" aria-current="true">Writing<\/a>/);
});

test('the 404 page is generated and kept out of search results', () => {
  assert.match(read('404.html'), /<meta name="robots" content="noindex">/);
  assert.ok(!read('sitemap.xml').includes('404'));
});

test('the sitemap lists the homepage with a real date', () => {
  assert.match(read('sitemap.xml'), new RegExp(`<loc>${SITE_URL}/</loc>\\s*<lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`));
});

test('blog routes are generated', () => {
  for (const file of ['blog/index.html', 'blog/zz-test-published/index.html', 'blog/zz-test-canonical/index.html', 'blog/tags/zz-test-tag/index.html', 'blog/tags/dotnet/index.html', 'blog/feed.xml', 'sitemap.xml', 'robots.txt', 'css/blog.css', 'js/blog.js']) {
    assert.ok(has(file), `${file} was not generated`);
  }
});

test('drafts never reach a production build', () => {
  assert.ok(!has('blog/zz-test-draft/index.html'));
  for (const file of ['blog/index.html', 'blog/feed.xml', 'sitemap.xml']) assert.ok(!read(file).includes('draft article'), `${file} mentions the draft`);
});

test('the listing shows each article as plain HTML', () => {
  const html = read('blog/index.html');
  assert.match(html, /<a href="\/blog\/zz-test-published\/">Build test: published article<\/a>/);
  assert.match(html, /A published fixture &amp; its description\./);
  assert.match(html, /<time datetime="2020-01-02">2 January 2020<\/time>/);
  assert.match(html, /1 min read/);
  assert.match(html, /<a href="\/blog\/tags\/zz-test-tag\/">ZZ Test Tag<\/a>/);
  assert.match(html, /<title>Writing, Dino Cosic<\/title>/);
});

test('a tag page lists only the articles with that tag', () => {
  const html = read('blog/tags/dotnet/index.html');
  assert.match(html, /Build test: published article/);
  assert.ok(!html.includes('canonical elsewhere'));
  assert.match(html, /<title>Articles on \.NET, Dino Cosic<\/title>/);
});

test('a tag page with one article is kept out of search results; a busier one is indexed', () => {
  assert.match(read('blog/tags/dotnet/index.html'), /<meta name="robots" content="noindex, follow">/);
  assert.match(read('blog/tags/zz-test-tag/index.html'), /<meta name="robots" content="index, follow">/);
  assert.match(read('blog/zz-test-published/index.html'), /<meta name="robots" content="index, follow">/);
});

test('an article page carries its content, contents list and metadata', () => {
  const html = read('blog/zz-test-published/index.html');
  assert.match(html, /<title>Build test: published article, Dino Cosic<\/title>/);
  assert.match(html, /<meta name="description" content="A published fixture &amp; its description\.">/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL}/blog/zz-test-published/">`));
  assert.match(html, /<meta property="og:type" content="article">/);
  assert.match(html, new RegExp(`<meta property="og:image" content="${SITE_URL}/assets/og.png">`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta property="article:published_time" content="2020-01-02T00:00:00.000Z">/);
  assert.match(html, /<meta property="article:modified_time" content="2020-02-03T00:00:00.000Z">/);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, 'exactly one h1');
  assert.match(html, /<dt>Updated<\/dt><dd><time datetime="2020-02-03">3 February 2020<\/time>/);
  assert.match(html, /<a href="#first-section">First section<\/a>/);
  assert.match(html, /<a href="#detail">Detail<\/a>/);
  assert.match(html, /<h2 id="second-section">/);
  assert.match(html, /<pre class="language-csharp"><code class="language-csharp">.*<span class="token keyword">var<\/span>/);
  assert.ok(html.includes('{{ not a template }}'), 'template syntax inside code is left alone');
  assert.match(html, /also published <a href="https:\/\/medium\.com\/@dino\.cosic\/build-test-aaaabbbbcccc"/);
  assert.match(html, /Related articles[\s\S]*Build test: canonical elsewhere/);

  const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(jsonLd['@type'], 'BlogPosting');
  assert.equal(jsonLd.headline, 'Build test: published article');
  assert.equal(jsonLd.dateModified, '2020-02-03T00:00:00.000Z');
  assert.equal(jsonLd.mainEntityOfPage['@id'], `${SITE_URL}/blog/zz-test-published/`);
});

test('an explicit canonicalUrl is respected', () => {
  const html = read('blog/zz-test-canonical/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/elsewhere\.example\/original\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/elsewhere\.example\/original\/">/);
  assert.match(read('blog/zz-test-published/index.html'), new RegExp(`<meta property="og:url" content="${SITE_URL}/blog/zz-test-published/">`));
});

test('a quoted "updated" date renders like an unquoted one', () => {
  const html = read('blog/zz-test-canonical/index.html');
  assert.match(html, /<meta property="article:published_time" content="2020-01-03T00:00:00\.000Z">/);
  assert.match(html, /<meta property="article:modified_time" content="2020-01-20T00:00:00\.000Z">/);
  assert.match(html, /<time datetime="2020-01-20">20 January 2020<\/time>/);
});

test('every internal link and asset resolves to a generated file', () => {
  const pages = ['index.html', '404.html', 'blog/index.html', 'blog/zz-test-published/index.html', 'blog/tags/dotnet/index.html'];
  for (const page of pages) {
    for (const [, url] of read(page).matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const target = url.endsWith('/') ? `${url}index.html` : url;
      assert.ok(has(target), `${page} links to ${url}, which does not exist`);
    }
  }
});

test('the feed, sitemap and robots.txt use absolute URLs on the configured domain', () => {
  const feed = read('blog/feed.xml');
  assert.match(feed, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.match(feed, new RegExp(`<link href="${SITE_URL}/blog/zz-test-published/"`));
  assert.ok(feed.indexOf('zz-test-canonical') < feed.indexOf('zz-test-published'), 'newest entry first');
  const sitemap = read('sitemap.xml');
  for (const url of ['/', '/blog/', '/blog/zz-test-published/', '/blog/tags/zz-test-tag/']) assert.ok(sitemap.includes(`<loc>${SITE_URL}${url}</loc>`), `sitemap is missing ${url}`);
  assert.match(sitemap, /<loc>https:\/\/example\.test\/blog\/zz-test-published\/<\/loc>\s*<lastmod>2020-02-03<\/lastmod>/);
  // A tag's lastmod is its newest change; tags kept out of search results are left out of the sitemap.
  assert.match(sitemap, /<loc>https:\/\/example\.test\/blog\/tags\/zz-test-tag\/<\/loc>\s*<lastmod>2020-02-03<\/lastmod>/);
  assert.ok(!sitemap.includes('/blog/tags/dotnet/'), 'a one-article tag should not be in the sitemap');
  assert.match(read('robots.txt'), new RegExp(`Sitemap: ${SITE_URL}/sitemap.xml`));
});

test('drafts are rendered when drafts are switched on for local work', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-drafts-'));
  try {
    const result = build(dir, { BLOG_DRAFTS: '1' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(fs.readFileSync(path.join(dir, 'blog/zz-test-draft/index.html'), 'utf8'), /left out of the production build/);
    assert.match(result.stdout + result.stderr, /zz-test-draft\.md is not ready to publish/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the build fails, naming the file and the fields, when metadata is invalid', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-invalid-'));
  fs.writeFileSync(path.join(posts, INVALID), '---\ntitle: "Build test: no description or tags"\ndate: 2020-01-05\n---\n\n# A second h1\n');
  try {
    const result = build(dir);
    const output = result.stdout + result.stderr;
    assert.notEqual(result.status, 0, 'the build should exit with an error');
    assert.match(output, /Invalid article metadata \(3 problems\)/);
    assert.match(output, /zz-test-invalid\.md/);
    assert.match(output, /"description" is required/);
    assert.match(output, /"tags" is required/);
    assert.match(output, /level-1 heading/);
    assert.ok(!fs.existsSync(path.join(dir, 'blog/index.html')), 'nothing is written when validation fails');
  } finally {
    fs.rmSync(path.join(posts, INVALID), { force: true });
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
