import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ArticleValidationError, collectProblems, validateArticle, validateArticles } from '../lib/article-schema.js';

const valid = () => ({
  title: 'Spec-Driven Development in AI-Assisted Engineering',
  description: 'How structured specifications improve the reliability of AI-assisted software development.',
  date: new Date('2026-11-11'),
  updated: null,
  slug: 'spec-driven-development',
  tags: ['AI', 'Software Engineering', 'Architecture'],
  mediumUrl: 'https://medium.com/@dino.cosic/example',
  draft: false,
});

test('a complete article is valid', () => {
  assert.deepEqual(validateArticle(valid(), { body: '## Section\n\nText.' }), []);
});

test('each required field is reported when missing', () => {
  for (const field of ['title', 'description', 'date', 'tags']) {
    const data = valid();
    delete data[field];
    const errors = validateArticle(data);
    assert.equal(errors.length, 1, `${field}: ${errors.join(' | ')}`);
    assert.match(errors[0], new RegExp(`"${field}" is required`));
  }
});

test('empty values count as missing', () => {
  const errors = validateArticle({ ...valid(), title: '  ', description: '', tags: [] });
  assert.equal(errors.length, 3);
});

test('dates must be real dates, and updated cannot precede date', () => {
  assert.match(validateArticle({ ...valid(), date: 'next Tuesday' })[0], /"date" is not a valid date/);
  assert.match(validateArticle({ ...valid(), updated: 'soon' })[0], /"updated" is not a valid date/);
  assert.match(validateArticle({ ...valid(), updated: new Date('2026-01-01') })[0], /earlier than "date"/);
  assert.deepEqual(validateArticle({ ...valid(), updated: new Date('2026-12-01') }), []);
  assert.deepEqual(validateArticle({ ...valid(), date: '2026-11-11' }), []);
});

test('slug, URLs and draft are type-checked', () => {
  assert.match(validateArticle({ ...valid(), slug: 'Not A Slug' })[0], /"slug" must be lowercase/);
  assert.match(validateArticle({ ...valid(), mediumUrl: 'medium.com/x' })[0], /"mediumUrl" must be a full URL/);
  assert.match(validateArticle({ ...valid(), canonicalUrl: '/blog/x/' })[0], /"canonicalUrl" must be a full URL/);
  assert.match(validateArticle({ ...valid(), draft: 'yes' })[0], /"draft" must be true or false/);
});

test('tags that collide on the same URL are rejected', () => {
  assert.match(validateArticle({ ...valid(), tags: ['DevOps', 'devops'] })[0], /resolve to the same URL/);
  assert.match(validateArticle({ ...valid(), tags: ['AI', ''] })[0], /empty or non-text/);
});

test('a missing local cover image is reported, a remote one is accepted', () => {
  const siteDir = new URL('../src', import.meta.url).pathname;
  assert.match(validateArticle({ ...valid(), coverImage: '/assets/blog/nope.webp' }, { siteDir })[0], /does not exist/);
  assert.deepEqual(validateArticle({ ...valid(), coverImage: '/assets/og.png' }, { siteDir }), []);
  assert.deepEqual(validateArticle({ ...valid(), coverImage: 'https://example.com/a.png' }, { siteDir }), []);
  assert.match(validateArticle({ ...valid(), coverImage: 'assets/a.png' })[0], /must start with "\/"/);
});

test('a level-1 heading in the body is rejected, but not inside a code block', () => {
  assert.match(validateArticle(valid(), { body: 'Intro\n\n# Second title\n' })[0], /level-1 heading/);
  assert.deepEqual(validateArticle(valid(), { body: '## Ok\n\n```bash\n# a shell comment\nnpm ci\n```\n' }), []);
});

test('duplicate URLs and titles across articles are reported', () => {
  const problems = collectProblems([
    { file: 'a.md', data: valid(), url: '/blog/same/' },
    { file: 'b.md', data: { ...valid(), title: 'Another title' }, url: '/blog/same/' },
    { file: 'c.md', data: valid(), url: '/blog/other/' },
  ]);
  assert.equal(problems.length, 2);
  assert.match(problems.find((p) => p.file === 'b.md').errors[0], /already used by a\.md/);
  assert.match(problems.find((p) => p.file === 'c.md').errors[0], /Title duplicates a\.md/);
});

test('validateArticles throws one error that names every file and problem', () => {
  assert.doesNotThrow(() => validateArticles([{ file: 'ok.md', data: valid(), url: '/blog/ok/' }]));
  assert.throws(
    () => validateArticles([{ file: 'src/blog/posts/broken.md', data: { title: 'Only a title' }, url: '/blog/broken/' }]),
    (error) => {
      assert.ok(error instanceof ArticleValidationError);
      assert.match(error.message, /src\/blog\/posts\/broken\.md/);
      assert.match(error.message, /"description" is required/);
      assert.match(error.message, /"date" is required/);
      assert.match(error.message, /"tags" is required/);
      assert.match(error.message, /3 problems/);
      return true;
    },
  );
});
