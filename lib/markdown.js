// markdown-it adjustments for articles: heading ids, figures, scrollable tables, safe external links.
import { slugify } from './slug.js';

export function configureMarkdown(md) {
  // Stable ids on headings, so the table of contents and deep links have targets.
  md.core.ruler.push('heading_ids', (state) => {
    const seen = new Map();
    state.tokens.forEach((token, i) => {
      if (token.type !== 'heading_open') return;
      const text = (state.tokens[i + 1].children ?? [])
        .filter((t) => t.type === 'text' || t.type === 'code_inline')
        .map((t) => t.content)
        .join('');
      const base = slugify(text) || 'section';
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      token.attrSet('id', count ? `${base}-${count + 1}` : base);
    });
  });

  // An image alone in a paragraph becomes a <figure>; its Markdown title becomes the caption:
  //   ![Alt text](/assets/blog/post/diagram.webp "Caption shown under the image")
  md.core.ruler.push('figures', (state) => {
    const tokens = state.tokens;
    for (let i = 1; i < tokens.length - 1; i += 1) {
      const inline = tokens[i];
      if (inline.type !== 'inline' || tokens[i - 1].type !== 'paragraph_open') continue;
      const meaningful = inline.children.filter((c) => c.type !== 'softbreak' && !(c.type === 'text' && !c.content.trim()));
      if (meaningful.length !== 1 || meaningful[0].type !== 'image') continue;
      const image = meaningful[0];
      const title = image.attrGet('title');
      tokens[i - 1].tag = 'figure';
      tokens[i + 1].tag = 'figure';
      inline.children = [image];
      if (title) {
        image.attrs = image.attrs.filter(([name]) => name !== 'title');
        const caption = new state.Token('html_inline', '', 0);
        caption.content = `<figcaption>${md.utils.escapeHtml(title)}</figcaption>`;
        inline.children.push(caption);
      }
    }
  });

  const renderImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('loading', 'lazy');
    tokens[idx].attrSet('decoding', 'async');
    return renderImage(tokens, idx, options, env, self);
  };

  // Wide tables scroll inside their own box instead of pushing the page sideways.
  md.renderer.rules.table_open = () => '<div class="table-wrap" role="region" aria-label="Table" tabindex="0"><table>\n';
  md.renderer.rules.table_close = () => '</table></div>\n';

  const renderLink = md.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    if (/^https?:\/\//.test(tokens[idx].attrGet('href') ?? '')) tokens[idx].attrSet('rel', 'noopener');
    return renderLink(tokens, idx, options, env, self);
  };

  return md;
}
