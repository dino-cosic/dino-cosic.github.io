import { slugify } from '../../../lib/slug.js';

// Defaults for every article in this folder. The URL comes from "slug" when set, otherwise from
// the file name (a leading YYYY-MM-DD- in the file name is ignored).
export default {
  layout: 'layouts/post.njk',
  ogType: 'article',
  eleventyComputed: {
    permalink: (data) => `/blog/${data.slug || slugify(data.page.fileSlug)}/`,
  },
};
