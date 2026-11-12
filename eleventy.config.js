import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { feedPlugin } from '@11ty/eleventy-plugin-rss';
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight';
import { validateArticle, validateArticles } from './lib/article-schema.js';
import { absoluteUrl, blogPostingJsonLd, buildTagIndex, buildToc, isoDate, isoDateTime, lastModified, readableDate, readingTime, relatedPosts, tagSlug } from './lib/blog.js';
import { configureMarkdown } from './lib/markdown.js';
import site from './src/_data/site.js';

// Root-relative URLs such as /assets/og.png map to files in src/.
const siteDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');
const POSTS_GLOB = 'src/blog/posts/*.md';

// Drafts render while writing (`npm run dev`) and are left out of every production build.
// BLOG_DRAFTS=1 (`npm run preview:drafts`) checks drafts in a production-style build locally;
// the deploy workflow never sets it.
const showDrafts = process.env.ELEVENTY_RUN_MODE === 'serve' || process.env.BLOG_DRAFTS === '1';

export default function (eleventyConfig) {
  // Stylesheets, scripts and images are copied through untouched. Every page is a template in src/.
  eleventyConfig.addPassthroughCopy('src/css');
  eleventyConfig.addPassthroughCopy('src/js');
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addWatchTarget('./lib/');

  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: site.blog.feedPath,
    collection: { name: 'posts', limit: 0, sort: 'descending' },
    metadata: {
      language: site.language,
      title: `${site.author.name}, ${site.blog.title}`,
      subtitle: site.blog.description,
      base: `${site.url}/`,
      author: { name: site.author.name },
    },
  });
  eleventyConfig.amendLibrary('md', configureMarkdown);

  eleventyConfig.addPreprocessor('drafts', 'md', (data) => {
    if (data.draft && !showDrafts) return false;
  });

  const getPosts = (collectionApi) => collectionApi.getFilteredByGlob(POSTS_GLOB).sort((a, b) => b.date - a.date || a.url.localeCompare(b.url));

  // Newest first. Invalid metadata stops the build here, before anything is written.
  eleventyConfig.addCollection('posts', (collectionApi) => {
    const posts = getPosts(collectionApi);
    const toCheck = (post) => ({ file: post.inputPath, data: post.data, body: post.rawInput, url: post.url });

    validateArticles(posts.filter((p) => !p.data.draft).map(toCheck), { siteDir });
    // A draft is work in progress: say what is missing, but keep the dev server running.
    for (const draft of posts.filter((p) => p.data.draft)) {
      const errors = validateArticle(draft.data, { body: draft.rawInput, siteDir });
      if (errors.length) console.warn(`[blog] Draft ${draft.inputPath} is not ready to publish:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    }
    return posts;
  });
  // The homepage on its own, so the sitemap can read its last-modified date.
  eleventyConfig.addCollection('home', (collectionApi) => collectionApi.getFilteredByGlob('src/index.njk'));
  eleventyConfig.addCollection('blogTags', (collectionApi) => buildTagIndex(getPosts(collectionApi)));

  eleventyConfig.addFilter('readableDate', readableDate);
  eleventyConfig.addFilter('isoDate', isoDate);
  // Frontmatter dates arrive as Date objects, or as strings when quoted; both filters accept either.
  eleventyConfig.addFilter('isoDateTime', isoDateTime);
  eleventyConfig.addFilter('readingTime', readingTime);
  eleventyConfig.addFilter('lastModified', lastModified);
  eleventyConfig.addFilter('toc', buildToc);
  eleventyConfig.addFilter('tagSlug', tagSlug);
  eleventyConfig.addFilter('absUrl', (value) => absoluteUrl(value, site.url));
  eleventyConfig.addFilter('related', (posts, url, tags) => relatedPosts(posts, url, tags));
  eleventyConfig.addFilter('neighbours', (posts, url) => {
    const i = posts.findIndex((post) => post.url === url);
    return i === -1 ? {} : { newer: posts[i - 1], older: posts[i + 1] };
  });
  eleventyConfig.addFilter('blogPostingJsonLd', (data) => blogPostingJsonLd({ ...data, site }));
}

export const config = {
  dir: { input: 'src', output: 'dist' },
  // Markdown is not run through a template engine, so articles can show {{ }} and ${{ }} in code freely.
  markdownTemplateEngine: false,
  htmlTemplateEngine: 'njk',
};
