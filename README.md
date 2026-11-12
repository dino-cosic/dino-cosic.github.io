# dino-cosic.github.io

Personal portfolio and technical blog.

The portfolio is plain HTML, CSS and JavaScript, with Three.js (loaded from a CDN) for the hero. The blog is Markdown, turned into static HTML by [Eleventy](https://www.11ty.dev/) at build time. There is no framework, backend, database or CMS.

## Commands

```sh
npm install              # once
npm run dev              # local site with live reload at http://localhost:8080, drafts included
npm run build            # production build into dist/ (drafts excluded)
npm run preview          # production build, then serve dist/ at http://localhost:8080
npm run preview:drafts   # the same, with drafts included (never used by the deploy)
npm test                 # unit tests, Medium conversion tests and a full build check
npm run migrate:medium   # import articles from a Medium export (see below)
```

Node 20 or newer.

## Layout

```
index.html, 404.html     the portfolio pages, copied to dist/ unchanged
css/                     tokens.css, base.css, site.css (portfolio) and blog.css (blog pages only)
js/                      chrome.js (header, shared), main.js (homepage), blog.js (blog), hero-scene.js, portrait.js
assets/                  images; article images live in assets/blog/<article-slug>/
src/                     everything Eleventy renders
  _data/site.js          site URL, author, blog title and description
  _includes/             layouts (base, post) and partials (header, footer, article list)
  blog/index.njk         /blog/
  blog/tag.njk           /blog/tags/<tag>/
  blog/posts/*.md        the articles
  sitemap.njk, robots.njk
lib/                     build helpers: slugs, frontmatter validation, contents list, related articles
tools/medium-import/     the Medium importer
tools/build_portrait.py  regenerates the hero portrait strokes inside index.html
test/                    tests and Medium export fixtures
eleventy.config.js       build configuration
```

Notes on the portfolio pages:

- `index.html` holds all homepage content. The portrait strokes are inlined between the `portrait:start/end` markers; `tools/build_portrait.py` regenerates them from `data/dino-one-line.png` (needs pillow, numpy, scipy, scikit-image).
- `data/` is source material (résumé, copy, drawing). It is gitignored and kept only locally.
- The homepage header is written out in `index.html`; blog pages use `src/_includes/partials/header.njk`. A change to the navigation goes in both.
- When the homepage content changes, update `homeLastmod` in `src/_data/site.js` so the sitemap reflects it.
- All paths are root-relative, so the site works the same locally and on GitHub Pages.

## Writing

### 1. Create a new article

Add a Markdown file to `src/blog/posts/`. The file name becomes the URL unless `slug` is set. `src/blog/posts/formatting-reference.md` is a working sample of every supported element; copy it to start.

```yaml
---
title: "Spec-Driven Development in AI-Assisted Engineering"
description: "How structured specifications improve the reliability of AI-assisted software development."
date: 2026-11-11
updated:
slug: "spec-driven-development"
tags:
  - AI
  - Software Engineering
  - Architecture
coverImage: "/assets/blog/spec-driven-development/cover.webp"
coverAlt: "What the cover image shows"
mediumUrl: "https://medium.com/@dino.cosic/example"
canonicalUrl:
draft: false
---
```

| Field | Required | Meaning |
| --- | --- | --- |
| `title` | yes | Page title and the only `h1`. Must be unique across articles. |
| `description` | yes | One or two sentences. Shown on the listing, in search results and in link previews. |
| `date` | yes | Publication date, `YYYY-MM-DD`. |
| `tags` | yes | At least one. Each tag gets a page at `/blog/tags/<tag>/`. |
| `updated` | no | Date of the last substantial edit. Shown on the article and used in the sitemap. |
| `slug` | no | URL segment: lowercase letters, digits, hyphens. Defaults to the file name. |
| `coverImage` | no | Root-relative path or full URL. Also used as the link-preview image. |
| `coverAlt` | no | Alt text for the cover image. Leave empty if the image is decorative. |
| `mediumUrl` | no | The Medium version of the article. Adds an "also published on Medium" line. |
| `canonicalUrl` | no | Only when the canonical version lives somewhere else. See canonical URLs below. |
| `draft` | no | `true` keeps the article out of production. |

The build validates this. Missing or malformed fields, a second `h1` in the body, two tags that resolve to the same URL, a cover image that does not exist, or two articles with the same URL or title stop the build with a message naming the file and the field.

Writing rules worth knowing:

- Start sections at `##`. `##` and `###` headings form the "On this page" list.
- Fenced code blocks are highlighted at build time; name the language after the fence (` ```csharp `). A copy button is added in the browser.
- A ` ```mermaid ` block is drawn as a diagram in the browser. Mermaid is loaded from a CDN only on pages that contain one; without JavaScript the source is shown as code.
- Articles are not run through a template engine, so `{{ }}` and `${{ }}` in code samples are safe.
- Tables, blockquotes, ordered and unordered lists, links, inline code and raw HTML all work as in GitHub-flavoured Markdown.

A draft (`draft: true`) appears under `npm run dev`, marked as a draft, and is left out of `npm run build`, the feed and the sitemap.

### 2. Add images

Put images in `assets/blog/<article-slug>/` and reference them with a root-relative path:

```md
![What the image shows](/assets/blog/spec-driven-development/pipeline.webp "Optional caption shown under the image")
```

An image on its own line becomes a `<figure>`; the quoted title becomes its caption. Images are lazy-loaded. There is no image pipeline, so export images at a sensible size before committing them: WebP or AVIF, at most about 1600 px wide. Always write alt text.

### 3. Run the blog locally

```sh
npm run dev
```

Open <http://localhost:8080/blog/>. Pages reload when Markdown, templates, CSS or JS change. Drafts are visible here.

### 4. Build the production website

```sh
npm run build      # writes dist/
npm run preview    # the same build, served the way GitHub Pages serves it
npm run preview:drafts   # the same, with drafts, to check one before publishing
```

`dist/` is what gets deployed. It is gitignored.

### 5. Import Medium articles

1. On Medium: Settings, then "Security and apps", then "Download your information". Medium emails a link to a ZIP file.
2. Unzip it. The folder contains `posts/` with one HTML file per story. Put the folder at `./medium-export` (gitignored) or anywhere else.
3. Look before you write:

   ```sh
   npm run migrate:medium -- ./medium-export --dry-run
   ```

4. Run it for real:

   ```sh
   npm run migrate:medium -- ./medium-export
   ```

What it does:

- Reads only the export files. It does not scrape Medium or use any API. The one thing it fetches is the images your articles reference, which it saves to `assets/blog/<slug>/` (`--no-images` turns that off).
- Writes one Markdown file per published story to `src/blog/posts/`, with title, description, date, slug, `mediumUrl` and any tags found. Medium's export usually carries no tags, so expect to add them.
- Every imported article is written with `draft: true`. Nothing is published until you have read it and switched the flag.
- Skips unpublished Medium drafts and short posts that look like replies to other people's stories (`--include-drafts`, `--include-responses` to import them anyway).
- Embedded content that the export does not contain (gists, videos, tweets) is replaced by a visible `[MANUAL REVIEW: ...]` line with the embed's address. Unknown HTML is kept as raw HTML. Neither is dropped silently.

Running it again is safe:

- An imported file you have not touched is regenerated, or left alone if nothing changed.
- A file you have edited is never overwritten. `--overwrite` asks for each file before replacing it; `--overwrite --yes` replaces without asking.
- Stories are matched by their Medium URL, so renaming a file or changing its slug does not create a second copy.
- A story whose slug or title matches an article you wrote by hand is reported as a duplicate and not imported.

`tools/medium-import/manifest.json` records what the importer wrote; commit it with the imported articles.

### 6. Review migration results

Each run writes `reports/medium-import-report.md` (and a `.json` twin). It lists the articles discovered, those converted, those needing manual review and why, missing images, unsupported HTML elements, duplicates, existing articles left untouched, skipped files and conversion errors.

For each imported article:

1. Open it under `npm run dev` next to the Medium original.
2. Search the file for `MANUAL REVIEW` and for raw HTML, and fix what you find. Paste gist code in as fenced code blocks.
3. Add `tags`, check the `description`, add alt text where the report says an image has none.
4. Set `draft: false`.

The importer was built against the documented export layout and the fixture files in `test/fixtures/medium-export/`, which cover several structural variants. It has not yet been run against your real export. If the report shows something it handled badly, add that file to the fixtures and adjust `tools/medium-import/convert.js`.

### 7. Canonical URLs

By default every article declares its own URL on this site as canonical. That is what makes this site the primary home of the writing.

- Leave `canonicalUrl` empty for articles whose home is here, including those imported from Medium.
- Set `canonicalUrl` only when another site should stay the canonical source for a piece, for example a guest post published elsewhere first.
- `mediumUrl` is a plain link to the Medium copy. It does not affect canonical behaviour.

For an article that already exists on Medium, Medium currently declares itself canonical. Nothing in this repository changes that. To hand the canonical over, by hand, per story:

1. Publish the article here and confirm its final URL, `https://dino-cosic.github.io/blog/<slug>/`.
2. On Medium, open the story, choose "Edit story", open the "..." menu, then "More settings", then "Advanced settings", then "Customize canonical link" (Medium moves this menu from time to time).
3. Tick the box saying the story was originally published elsewhere, paste the URL from step 1, and save.
4. Leave the Medium story published. Its backlinks, claps and followers stay, and search engines are told that the version here is the original.

For new articles, publish here first. If you also want the piece on Medium, use Medium's "Import a story" with the URL from this site: it copies the text and sets the canonical link for you. Nothing here republishes to Medium automatically.

### 8. Publish through GitHub

1. Commit the Markdown file and its images.
2. Push to `main`, directly or through a pull request.

`.github/workflows/deploy.yml` then installs dependencies, runs the tests, builds the site and deploys `dist/` to GitHub Pages. If an article has invalid metadata the build step fails and the live site stays as it was; the workflow log names the file and the field.

The site URL used for canonical links, the feed and the sitemap comes from the Pages configuration at build time (`SITE_URL`), with `https://dino-cosic.github.io` as the local default in `src/_data/site.js`. If you add a custom domain in the repository's Pages settings, generated URLs follow it. The homepage's own meta tags in `index.html` are written by hand and would need the new domain typed in.

### 9. The RSS feed

`/blog/feed.xml` is an Atom feed with the full text of every published article, newest first. It is regenerated on each build, so publishing an article updates it. Every blog page advertises it with a `<link rel="alternate">` tag, which is how feed readers find it from the blog's address, and the footer links to it. Drafts are never included.

## Tests

`npm test` covers frontmatter validation, slug generation, Markdown rendering helpers, Medium HTML conversion, duplicate detection and reruns of the importer, and a real production build (routes, metadata, drafts excluded, the build failing on invalid metadata). The build test copies the files the site is built from into a temporary folder, adds its own articles there and builds that copy, so it never writes to the repository; a test checks this.

Tests and tools stay out of the published site: Eleventy reads only `src/`, and the passthrough copy takes only `index.html`, `404.html`, `css/`, `js/` and `assets/`. In the deploy workflow, tests run in a separate job on their own checkout, and the site is built from a clean checkout that tests never touched. The deploy needs both jobs to pass. The Medium importer's only output into the site is the articles it imports (as drafts in `src/blog/posts/`) and their images (in `assets/blog/`); its manifest stays in `tools/medium-import/`.
