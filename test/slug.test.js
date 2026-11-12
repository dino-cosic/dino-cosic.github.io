import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidSlug, slugify } from '../lib/slug.js';

test('slugify produces lowercase hyphenated slugs', () => {
  assert.equal(slugify('Spec-Driven Development in AI-Assisted Engineering'), 'spec-driven-development-in-ai-assisted-engineering');
  assert.equal(slugify('  Hello,   World!  '), 'hello-world');
  assert.equal(slugify("Don't mock what you don't own"), 'dont-mock-what-you-dont-own');
});

test('slugify keeps technology names meaningful', () => {
  assert.equal(slugify('.NET'), 'dotnet');
  assert.equal(slugify('Why .NET 9 matters'), 'why-dotnet-9-matters');
  assert.equal(slugify('ASP.NET Core'), 'asp-net-core');
  assert.equal(slugify('C#'), 'csharp');
  assert.equal(slugify('C++ & Rust'), 'cpp-and-rust');
  assert.equal(slugify('CI/CD'), 'ci-cd');
});

test('slugify transliterates accented and Bosnian letters', () => {
  assert.equal(slugify('Dino Ćosić'), 'dino-cosic');
  assert.equal(slugify('Đurđevdan žurka'), 'durdevdan-zurka');
  assert.equal(slugify('Résumé'), 'resume');
});

test('slugify cuts long titles on a word boundary', () => {
  const slug = slugify('A very long title that keeps going and going well past any sensible length for a URL segment on the web', { maxLength: 40 });
  assert.ok(slug.length <= 40);
  assert.ok(!slug.endsWith('-'));
  assert.ok('a-very-long-title-that-keeps-going-and-going-well-past'.startsWith(slug));
});

test('slugify returns an empty string when nothing usable is left', () => {
  assert.equal(slugify('!!!'), '');
  assert.equal(slugify(undefined), '');
});

test('isValidSlug accepts only clean slugs', () => {
  assert.ok(isValidSlug('spec-driven-development'));
  assert.ok(!isValidSlug('Spec-Driven'));
  assert.ok(!isValidSlug('double--hyphen'));
  assert.ok(!isValidSlug('-leading'));
  assert.ok(!isValidSlug('has space'));
});
