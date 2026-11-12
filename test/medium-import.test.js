import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { findDuplicate, readFrontmatterFields, runImport } from '../tools/medium-import/importer.js';
import { renderReport } from '../tools/medium-import/report.js';

const exportDir = fileURLToPath(new URL('./fixtures/medium-export', import.meta.url));

async function workspace() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'medium-import-'));
  const requests = [];
  const png = Buffer.from('89504e470d0a1a0a', 'hex');
  // Stand-in for the network: the PNG downloads, the extension-less image is gone.
  const fetchImpl = async (url) => {
    requests.push(url);
    if (url.includes('NoExtensionHere')) return { ok: false, status: 404 };
    return { ok: true, status: 200, headers: new Map([['content-type', 'image/png']]), arrayBuffer: async () => png };
  };
  const options = { exportDir, postsDir: path.join(dir, 'posts'), assetsDir: path.join(dir, 'assets'), manifestPath: path.join(dir, 'manifest.json'), fetchImpl };
  return { dir, options, requests, read: (name) => fs.readFile(path.join(dir, 'posts', name), 'utf8') };
}

test('findDuplicate matches by Medium story, then slug, then title', () => {
  const existing = [
    { file: 'a.md', slug: 'renamed-by-hand', title: 'A new title', mediumId: '4f2a9c1b7d3e' },
    { file: 'b.md', slug: 'feature-flags-are-debt', title: 'Something else', mediumId: null },
    { file: 'c.md', slug: 'cqrs', title: 'Notes on CQRS!', mediumId: null },
  ];
  assert.deepEqual(findDuplicate({ mediumId: '4f2a9c1b7d3e', slug: 'x', title: 'X' }, existing), { reason: 'medium-id', file: 'a.md' });
  assert.deepEqual(findDuplicate({ mediumId: 'ffff0000ffff', slug: 'feature-flags-are-debt', title: 'X' }, existing), { reason: 'slug', file: 'b.md' });
  assert.deepEqual(findDuplicate({ mediumId: null, slug: 'notes', title: 'notes on  cqrs' }, existing), { reason: 'title', file: 'c.md' });
  assert.equal(findDuplicate({ mediumId: null, slug: 'new', title: 'Brand new' }, existing), null);
});

test('readFrontmatterFields reads quoted and bare values', () => {
  assert.deepEqual(
    readFrontmatterFields('---\ntitle: "A \\"quoted\\" title"\nslug: my-slug\nmediumUrl: \'https://medium.com/p/abc12345\'\ndraft: true\n---\nbody\ntitle: not this'),
    { title: 'A "quoted" title', slug: 'my-slug', mediumUrl: 'https://medium.com/p/abc12345' },
  );
});

test('a first import converts articles, copies images, and reports everything else', async () => {
  const { dir, options, requests, read } = await workspace();
  const report = await runImport(options);

  assert.equal(report.discovered, 6);
  assert.deepEqual(report.converted.map((c) => [path.basename(c.file), c.action]), [
    ['why-i-stopped-mocking-dbcontext.md', 'created'],
    ['feature-flags-are-debt.md', 'created'],
    ['running-azure-functions-in-docker.md', 'created'],
  ]);
  assert.deepEqual(report.skipped.map((s) => s.source).sort(), ['2023-09-01_Great-write-up--One-thing-I-would-add-99aa88bb77cc.html', 'draft_Notes-on-CQRS-0011223344ff.html']);
  assert.equal(report.duplicates.length, 1);
  assert.match(report.duplicates[0].source, /--copy--/);
  assert.equal(report.errors.length, 0);

  // The image is stored locally and the article points at it; a larger size was requested first.
  const docker = await read('running-azure-functions-in-docker.md');
  assert.match(docker, /!\[[^\]]+\]\(\/assets\/blog\/running-azure-functions-in-docker\/01\.png "/);
  assert.ok(!docker.includes('cdn-images-1.medium.com'));
  assert.ok(requests.includes('https://cdn-images-1.medium.com/max/1600/1*AbCdEf123456.png'));
  await fs.access(path.join(dir, 'assets/running-azure-functions-in-docker/01.png'));

  // The failed download is reported and the remote URL is left in place rather than a broken path.
  assert.equal(report.missingImages.length, 1);
  assert.match(report.missingImages[0].reason, /404/);
  assert.ok((await read('why-i-stopped-mocking-dbcontext.md')).includes('https://cdn-images-1.medium.com/max/800/0*NoExtensionHere'));

  assert.deepEqual(report.unsupported.map((u) => u.element).sort(), ['details', 'iframe', 'video']);
  assert.equal(report.needsReview.length, 3);
  assert.match(docker, /\ndraft: true\n/);

  const text = renderReport(report);
  for (const heading of ['Articles discovered (6)', 'Successfully converted (3)', 'Requiring manual review (3)', 'Missing images (1)', 'Unsupported HTML elements (3)', 'Duplicate articles (1)', 'Conversion errors (0)']) {
    assert.ok(text.includes(`## ${heading}`), `report is missing "${heading}"`);
  }
});

test('running the import again changes nothing', async () => {
  const { options, requests, read } = await workspace();
  await runImport(options);
  const before = await read('running-azure-functions-in-docker.md');
  const downloads = requests.filter((r) => r.includes('AbCdEf')).length;

  const second = await runImport(options);
  assert.deepEqual(second.converted.map((c) => c.action), ['unchanged', 'unchanged', 'unchanged']);
  assert.equal(await read('running-azure-functions-in-docker.md'), before);
  assert.equal(requests.filter((r) => r.includes('AbCdEf')).length, downloads, 'an image that is already on disk is not downloaded again');
});

test('an article edited by hand is never overwritten without confirmation', async () => {
  const { options, read } = await workspace();
  await runImport(options);
  const file = path.join(options.postsDir, 'feature-flags-are-debt.md');
  const edited = (await fs.readFile(file, 'utf8')).replace('draft: true', 'draft: false').concat('\nA paragraph I added myself.\n');
  await fs.writeFile(file, edited);

  const plain = await runImport(options);
  assert.equal(await read('feature-flags-are-debt.md'), edited);
  assert.deepEqual(plain.protected.map((p) => [path.basename(p.file), p.reason]), [['feature-flags-are-debt.md', 'Edited since it was imported']]);

  const declined = await runImport({ ...options, overwrite: true, confirm: async () => false });
  assert.equal(await read('feature-flags-are-debt.md'), edited);
  assert.equal(declined.protected.length, 1);

  const asked = [];
  const accepted = await runImport({ ...options, overwrite: true, confirm: async (f) => { asked.push(f); return true; } });
  assert.equal(asked.length, 1);
  assert.equal(accepted.converted.find((c) => c.file.endsWith('feature-flags-are-debt.md')).action, 'overwritten');
  assert.ok(!(await read('feature-flags-are-debt.md')).includes('A paragraph I added myself.'));
});

test('an article written by hand blocks an import that would collide with it', async () => {
  const { options, read } = await workspace();
  await fs.mkdir(options.postsDir, { recursive: true });
  const own = '---\ntitle: "Feature flags are debt"\nslug: "feature-flags-are-debt"\ndraft: false\n---\n\nMy own version.\n';
  await fs.writeFile(path.join(options.postsDir, 'feature-flags-are-debt.md'), own);

  const report = await runImport({ ...options, overwrite: true, confirm: async () => true });
  assert.equal(await read('feature-flags-are-debt.md'), own);
  assert.equal(report.duplicates.filter((d) => /same slug already exists/.test(d.reason)).length, 1);
  assert.equal(report.converted.length, 2);
});

test('an existing article that carries the Medium URL is recognised even after a rename', async () => {
  const { options, read } = await workspace();
  await fs.mkdir(options.postsDir, { recursive: true });
  const own = '---\ntitle: "Flags are debt, revisited"\nslug: "flags-revisited"\nmediumUrl: "https://medium.com/@dino.cosic/feature-flags-are-debt-deadbeef0123"\n---\n\nRewritten.\n';
  await fs.writeFile(path.join(options.postsDir, 'flags-revisited.md'), own);

  const report = await runImport(options);
  assert.equal(await read('flags-revisited.md'), own);
  assert.deepEqual(report.protected.map((p) => path.basename(p.file)), ['flags-revisited.md']);
  await assert.rejects(fs.access(path.join(options.postsDir, 'feature-flags-are-debt.md')), 'no second copy is created');
});

test('a dry run writes nothing and downloads nothing', async () => {
  const { dir, options, requests } = await workspace();
  const report = await runImport({ ...options, dryRun: true });
  assert.equal(report.converted.length, 3);
  assert.equal(requests.length, 0);
  assert.deepEqual(await fs.readdir(dir), []);
  assert.match(renderReport(report), /Dry run: nothing was written/);
});

test('drafts and replies can be included on request', async () => {
  const { options } = await workspace();
  const report = await runImport({ ...options, includeDrafts: true, includeResponses: true });
  assert.equal(report.converted.length, 5);
  assert.equal(report.skipped.length, 0);
});

test('a folder that is not a Medium export fails with a clear message', async () => {
  const { dir, options } = await workspace();
  await assert.rejects(runImport({ ...options, exportDir: dir }), /No HTML files found/);
  await assert.rejects(runImport({ ...options, exportDir: path.join(dir, 'missing') }), /Export folder not found/);
});
