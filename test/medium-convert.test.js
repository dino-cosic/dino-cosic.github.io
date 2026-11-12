import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { validateArticle } from '../lib/article-schema.js';
import { convertMediumPost, mediumIdFrom, parseFileName, renderArticleFile } from '../tools/medium-import/convert.js';

const dir = new URL('./fixtures/medium-export/posts/', import.meta.url);
const convert = (name) => convertMediumPost(fs.readFileSync(new URL(name, dir), 'utf8'), name);

const MODERN = '2024-03-18_Running-Azure-Functions-in-Docker-4f2a9c1b7d3e.html';
const OLDER = '2021-06-02_Why-I-Stopped-Mocking-DbContext-a1b2c3d4e5f6.html';
const BARE = '2022-01-10_Feature-flags-are-debt-deadbeef0123.html';

test('file names give the draft marker, the date and the story id', () => {
  assert.deepEqual(parseFileName(MODERN), { isDraft: false, date: '2024-03-18', id: '4f2a9c1b7d3e' });
  assert.deepEqual(parseFileName('draft_Notes-on-CQRS-0011223344ff.html'), { isDraft: true, date: null, id: '0011223344ff' });
  assert.equal(mediumIdFrom('https://medium.com/@someone/a-title-4f2a9c1b7d3e?source=rss'), '4f2a9c1b7d3e');
  assert.equal(mediumIdFrom('https://medium.com/p/4f2a9c1b7d3e'), '4f2a9c1b7d3e');
  assert.equal(mediumIdFrom('https://example.com/blog/a-post/'), null);
});

test('metadata is extracted from a current export file', () => {
  const article = convert(MODERN);
  assert.equal(article.kind, 'article');
  assert.equal(article.title, 'Running Azure Functions in Docker');
  assert.equal(article.description, 'What changes when a Function App leaves the consumption plan and moves into a container.');
  assert.equal(article.date, '2024-03-18');
  assert.equal(article.slug, 'running-azure-functions-in-docker');
  assert.equal(article.mediumUrl, 'https://medium.com/@dino.cosic/running-azure-functions-in-docker-4f2a9c1b7d3e');
  assert.equal(article.mediumId, '4f2a9c1b7d3e');
});

test('formatting survives conversion to Markdown', () => {
  const { markdown } = convert(MODERN);
  // The title and subtitle live in frontmatter, not in the body.
  assert.ok(!markdown.includes('# Running Azure Functions in Docker'));
  assert.ok(!markdown.startsWith('What changes when'));
  assert.match(markdown, /^Most teams meet Azure Functions on the \*\*consumption plan\*\*\./);
  assert.match(markdown, /is \*not\* hard/);
  assert.match(markdown, /\[documentation\]\(https:\/\/learn\.microsoft\.com\/azure\/azure-functions\/\)/);
  assert.match(markdown, /Use `func init --docker` to start\./);
  assert.match(markdown, /^## The Dockerfile$/m);
  assert.match(markdown, /^### Things to check$/m);
  assert.match(markdown, /^- Storage connection strings\n- The `FUNCTIONS_WORKER_RUNTIME` setting$/m);
  assert.match(markdown, /^1\. Build the image\n2\. Run it locally$/m);
  assert.match(markdown, /^> If it works on the consumption plan/m);
  assert.match(markdown, /\| Plan \| Cold start \|\n\| --- \| --- \|\n\| Consumption \| Seconds \|/);
  assert.match(markdown, /```dockerfile\nFROM mcr\.microsoft\.com\/azure-functions\/dotnet-isolated:8\.0\nENV AzureWebJobsScriptRoot=\/home\/site\/wwwroot\nCOPY --from=build \/out \/home\/site\/wwwroot\n```/);
  assert.match(markdown, /^---$/m, 'the break between Medium sections is kept');
  assert.match(markdown, /\[Azure\/azure-functions-docker\]\(https:\/\/github\.com\/Azure\/azure-functions-docker\)/);
});

test('images keep their caption as alt text and title, and are listed for download', () => {
  const article = convert(MODERN);
  assert.deepEqual(article.images, [{ url: 'https://cdn-images-1.medium.com/max/800/1*AbCdEf123456.png', alt: 'The container sits behind the same "trigger" bindings.' }]);
  assert.ok(article.markdown.includes('](https://cdn-images-1.medium.com/max/800/1*AbCdEf123456.png "The container sits behind the same \'trigger\' bindings.")'));
});

test('embeds are flagged with their source instead of being dropped', () => {
  const article = convert(MODERN);
  assert.deepEqual(article.unsupported, [{ element: 'iframe', detail: 'https://medium.com/media/0a1b2c3d4e5f/href' }]);
  assert.match(article.markdown, /MANUAL REVIEW: embedded content was not exported.*https:\/\/medium\.com\/media\/0a1b2c3d4e5f\/href.*host\.json/);
  assert.ok(article.notes.some((n) => /could not be converted cleanly/.test(n)));
});

test('an older export layout still converts, with gaps filled and flagged', () => {
  const article = convert(OLDER);
  assert.equal(article.kind, 'article');
  assert.equal(article.title, 'Why I Stopped Mocking DbContext');
  assert.equal(article.date, '2021-06-02', 'date falls back to the file name');
  assert.equal(article.mediumUrl, 'https://medium.com/p/a1b2c3d4e5f6', 'URL is rebuilt from the story id');
  assert.match(article.description, /^Mocking DbContext gives you tests that pass/);
  assert.ok(article.description.length <= 161);
  assert.match(article.markdown, /^## The test that lied$/m, 'a lone small heading is promoted to a section heading');
  assert.match(article.markdown, /```\nvar mock = new Mock<AppDbContext>\(\);\nmock\.Setup\(c => c\.Orders\)\.Returns\(orders\);\n\n\/\/ passes, and proves nothing\n```/);
  assert.match(article.markdown, /O\(n<sup>2<\/sup>\)/);
  for (const expected of [/Image without alt text/, /description was taken from the first paragraph/, /rebuilt from the story id/, /date taken from the file name/, /No tags/]) {
    assert.ok(article.notes.some((n) => expected.test(n)), `missing note ${expected}`);
  }
});

test('unknown elements are preserved and reported, never silently dropped', () => {
  const article = convert(OLDER);
  assert.deepEqual(article.unsupported.map((u) => u.element), ['video', 'details']);
  assert.match(article.markdown, /MANUAL REVIEW: unsupported <video> element.*https:\/\/example\.com\/demo\.mp4/);
  assert.match(article.markdown, /<details><summary>Full stack trace<\/summary><p>System\.InvalidOperationException at line 42<\/p><\/details>/);
});

test('a page without any Medium markup falls back to the whole document', () => {
  const article = convert(BARE);
  assert.equal(article.title, 'Feature flags are debt');
  assert.equal(article.date, '2022-01-10');
  assert.deepEqual(article.tags, ['Feature Flags', '.NET']);
  assert.equal(article.mediumId, 'deadbeef0123');
  assert.equal(article.markdown, 'Every flag you add is a branch you promise to delete later, and later rarely arrives on its own schedule.\n\n## Paying it down\n\nRemove the flag in the same sprint the rollout finishes.\n');
  assert.ok(article.notes.some((n) => /usual body container was not found/.test(n)));
});

test('drafts and replies are told apart from articles', () => {
  assert.equal(convert('draft_Notes-on-CQRS-0011223344ff.html').kind, 'draft');
  assert.equal(convert('2023-09-01_Great-write-up--One-thing-I-would-add-99aa88bb77cc.html').kind, 'response');
});

test('generated frontmatter is a draft and passes validation once tags are added', () => {
  const article = convert(BARE);
  const file = renderArticleFile(article);
  assert.match(file, /^---\ntitle: "Feature flags are debt"\n/);
  assert.match(file, /\ndate: 2022-01-10\n/);
  assert.match(file, /\nslug: "feature-flags-are-debt"\n/);
  assert.match(file, /\ntags:\n  - "Feature Flags"\n  - "\.NET"\n/);
  assert.match(file, /\nmediumUrl: "https:\/\/medium\.com\/@dino\.cosic\/feature-flags-are-debt-deadbeef0123"\n/);
  assert.match(file, /\ndraft: true\n---\n\nEvery flag/);
  assert.deepEqual(validateArticle({ ...article, draft: true }, { body: article.markdown }), []);
  assert.match(renderArticleFile(convert(MODERN)), /\ntags: \[\]\n/);
});
