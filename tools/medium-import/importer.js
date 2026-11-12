// Runs a Medium import: reads the export, converts each story, copies images, writes Markdown,
// and returns a report. Safe to run repeatedly; see decide() for the overwrite rules.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { convertMediumPost, mediumIdFrom, normaliseTitle, renderArticleFile } from './convert.js';

const sha = (text) => createHash('sha256').update(text).digest('hex');
const exists = (p) => fs.access(p).then(() => true, () => false);

/** The few frontmatter fields the importer needs from articles that already exist. */
export function readFrontmatterFields(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fields = {};
  if (!block) return fields;
  for (const name of ['title', 'slug', 'mediumUrl']) {
    const line = block[1].match(new RegExp(`^${name}:[ \\t]*(.*)$`, 'm'));
    if (!line) continue;
    let value = line[1].trim();
    if (/^".*"$/.test(value)) { try { value = JSON.parse(value); } catch { value = value.slice(1, -1); } }
    else if (/^'.*'$/.test(value)) value = value.slice(1, -1).replace(/''/g, "'");
    if (value) fields[name] = value;
  }
  return fields;
}

export async function readExistingArticles(postsDir) {
  if (!(await exists(postsDir))) return [];
  const articles = [];
  for (const name of (await fs.readdir(postsDir)).filter((n) => n.endsWith('.md')).sort()) {
    const file = path.join(postsDir, name);
    const fields = readFrontmatterFields(await fs.readFile(file, 'utf8'));
    articles.push({
      file,
      slug: fields.slug || name.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
      title: fields.title || '',
      mediumId: mediumIdFrom(fields.mediumUrl),
    });
  }
  return articles;
}

/**
 * Does this story already exist? Checked in order of certainty:
 * the same Medium story, then the same URL slug, then the same title.
 * @returns {{reason: 'medium-id'|'slug'|'title', file: string} | null}
 */
export function findDuplicate(candidate, existing) {
  const byId = candidate.mediumId && existing.find((a) => a.mediumId && a.mediumId === candidate.mediumId);
  if (byId) return { reason: 'medium-id', file: byId.file };
  const bySlug = candidate.slug && existing.find((a) => a.slug === candidate.slug);
  if (bySlug) return { reason: 'slug', file: bySlug.file };
  const title = normaliseTitle(candidate.title);
  const byTitle = title && existing.find((a) => normaliseTitle(a.title) === title);
  if (byTitle) return { reason: 'title', file: byTitle.file };
  return null;
}

async function findExportFiles(exportDir) {
  if (!(await exists(exportDir))) throw new Error(`Export folder not found: ${exportDir}`);
  if ((await fs.stat(exportDir)).isFile()) {
    throw new Error(`${exportDir} is a file. Unzip the Medium export first and pass the extracted folder.`);
  }
  const candidates = [path.join(exportDir, 'posts'), exportDir];
  for (const dir of candidates) {
    if (!(await exists(dir))) continue;
    const files = (await fs.readdir(dir)).filter((n) => /\.html?$/i.test(n)).sort();
    if (files.length) return files.map((n) => path.join(dir, n));
  }
  throw new Error(`No HTML files found in ${exportDir} or its "posts" folder. Pass the folder you get after unzipping the Medium export.`);
}

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/avif': '.avif' };

/** Copy one image next to the article. Returns the public path, or throws with the reason. */
async function fetchImage(url, dir, baseName, publicDir, fetchImpl) {
  // A previous run may already have saved it, under whatever extension the server reported.
  if (await exists(dir)) {
    const saved = (await fs.readdir(dir)).find((n) => n.startsWith(`${baseName}.`));
    if (saved) return `${publicDir}/${saved}`;
  }
  if (!/^https?:\/\//.test(url)) throw new Error('not an http(s) URL');

  // Medium serves the same image at any width; ask for a larger one than the export links to.
  const larger = url.replace(/\/max\/\d+\//, '/max/1600/');
  let response = null;
  for (const attempt of larger === url ? [url] : [larger, url]) {
    try {
      const r = await fetchImpl(attempt, { signal: AbortSignal.timeout(30_000) });
      if (r.ok) { response = r; break; }
      response = r;
    } catch (error) {
      response = { ok: false, status: error.name === 'TimeoutError' ? 'timeout' : error.message };
    }
  }
  if (!response?.ok) throw new Error(`download failed (${response?.status ?? 'no response'})`);

  const type = (response.headers?.get?.('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const fromUrl = path.extname(new URL(url).pathname).toLowerCase();
  const ext = EXTENSIONS[type] || (/^\.(jpe?g|png|gif|webp|svg|avif)$/.test(fromUrl) ? fromUrl.replace('.jpeg', '.jpg') : null);
  if (!ext) throw new Error(`not an image (content type "${type || 'unknown'}")`);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${baseName}${ext}`), Buffer.from(await response.arrayBuffer()));
  return `${publicDir}/${baseName}${ext}`;
}

/**
 * @param {object} options
 * @param {string} options.exportDir     Extracted Medium export (the folder that contains "posts").
 * @param {string} options.postsDir      Where article Markdown lives.
 * @param {string} options.assetsDir     Where article images live on disk.
 * @param {string} [options.assetsUrl]   The same folder as a site path.
 * @param {string} options.manifestPath  Record of what earlier runs wrote.
 * @param {boolean} [options.dryRun]     Report only; write and download nothing.
 * @param {boolean} [options.overwrite]  Offer to replace hand-edited articles (still asks confirm()).
 * @param {(file: string) => Promise<boolean>} [options.confirm]
 */
export async function runImport({
  exportDir, postsDir, assetsDir, assetsUrl = '/assets/blog', manifestPath,
  dryRun = false, overwrite = false, confirm = async () => false,
  includeDrafts = false, includeResponses = false, downloadImages = true, fetchImpl = globalThis.fetch,
}) {
  const files = await findExportFiles(exportDir);
  const existing = await readExistingArticles(postsDir);
  const manifest = (await exists(manifestPath)) ? JSON.parse(await fs.readFile(manifestPath, 'utf8')) : { version: 1, articles: {} };
  const rel = (p) => path.relative(process.cwd(), p) || p;

  const report = {
    generatedAt: new Date().toISOString(), exportDir: rel(exportDir), dryRun,
    discovered: files.length, converted: [], skipped: [], protected: [], needsReview: [],
    missingImages: [], unsupported: [], duplicates: [], errors: [],
  };
  const seen = []; // stories already handled in this run, to catch duplicates inside the export

  for (const file of files) {
    const source = path.basename(file);
    try {
      const article = convertMediumPost(await fs.readFile(file, 'utf8'), source);

      if (article.kind === 'draft' && !includeDrafts) { report.skipped.push({ source, title: article.title, reason: 'Unpublished Medium draft (use --include-drafts to import it)' }); continue; }
      if (article.kind === 'response' && !includeResponses) { report.skipped.push({ source, title: article.title, reason: `Looks like a reply to another story: ${article.wordCount} words, no title block (use --include-responses if it is an article)` }); continue; }
      if (!article.title || !article.slug) { report.errors.push({ source, message: 'No title could be extracted, so no file name or URL can be generated.' }); continue; }
      if (!article.date) article.date = new Date().toISOString().slice(0, 10);

      const twin = findDuplicate(article, seen);
      if (twin) { report.duplicates.push({ source, title: article.title, reason: `Same ${twin.reason === 'medium-id' ? 'Medium story' : twin.reason} as ${twin.file} in this export. Only the first was imported.` }); continue; }
      seen.push({ file: source, slug: article.slug, title: article.title, mediumId: article.mediumId });

      // ---- decide where it goes and whether we may write there ----
      const duplicate = findDuplicate(article, existing);
      let target = path.join(postsDir, `${article.slug}.md`);
      let action = 'created';
      if (duplicate && duplicate.reason !== 'medium-id') {
        report.duplicates.push({ source, title: article.title, reason: `An article with the same ${duplicate.reason} already exists at ${rel(duplicate.file)} and is not linked to this Medium story. Not imported. If it is the same article, set its "mediumUrl" to ${article.mediumUrl ?? 'the Medium URL'}.` });
        continue;
      }
      if (duplicate) {
        target = duplicate.file;
        const current = await fs.readFile(target, 'utf8');
        const recorded = manifest.articles[article.mediumId];
        const untouched = recorded && recorded.hash === sha(current);
        if (untouched) action = 'updated';
        else if (overwrite && (await confirm(rel(target)))) action = 'overwritten';
        else {
          report.protected.push({ source, title: article.title, file: rel(target), reason: recorded ? 'Edited since it was imported' : 'Exists and was not created by the importer' });
          continue;
        }
        // Keep the slug the existing file already publishes under, so its URL and image folder stay put.
        article.slug = existing.find((a) => a.file === target)?.slug || article.slug;
      }

      // ---- images ----
      let markdown = article.markdown;
      const missing = [];
      for (const [index, image] of article.images.entries()) {
        const baseName = String(index + 1).padStart(2, '0');
        const publicDir = `${assetsUrl}/${article.slug}`;
        if (dryRun || !downloadImages) {
          if (!downloadImages) missing.push({ url: image.url, reason: 'downloads disabled (--no-images); the article still points at Medium' });
          continue;
        }
        try {
          const local = await fetchImage(image.url, path.join(assetsDir, article.slug), baseName, publicDir, fetchImpl);
          markdown = markdown.split(image.url).join(local);
        } catch (error) {
          missing.push({ url: image.url, reason: error.message });
        }
      }
      for (const m of missing) report.missingImages.push({ source, file: rel(target), ...m });

      // ---- write ----
      const content = renderArticleFile(article, markdown);
      if (action === 'updated' && (await fs.readFile(target, 'utf8')) === content) action = 'unchanged';
      if (!dryRun) {
        if (action !== 'unchanged') {
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, content);
        }
        if (article.mediumId) manifest.articles[article.mediumId] = { file: path.relative(path.dirname(manifestPath), target), hash: sha(content) };
      }
      if (action === 'created') existing.push({ file: target, slug: article.slug, title: article.title, mediumId: article.mediumId });

      const reasons = [...article.notes];
      if (missing.length) reasons.push(`${missing.length} image${missing.length === 1 ? '' : 's'} could not be copied and still point at Medium.`);
      report.converted.push({ source, file: rel(target), title: article.title, action, images: article.images.length - missing.length, words: article.wordCount });
      if (reasons.length) report.needsReview.push({ source, file: rel(target), title: article.title, reasons });
      for (const u of article.unsupported) report.unsupported.push({ source, file: rel(target), ...u });
    } catch (error) {
      report.errors.push({ source, message: error.message });
    }
  }

  if (!dryRun) {
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return report;
}
