// Blog enhancements. Every page reads fully without this file; it adds search on the listing,
// copy buttons on code blocks, the current-section marker in the table of contents, and diagrams.
import './chrome.js';

// ---- listing: search across titles, descriptions and tags ----
const form = document.querySelector('[data-search-form]');
if (form) {
  const input = form.querySelector('input');
  const status = document.querySelector('[data-search-status]');
  const entries = [...document.querySelectorAll('[data-entry]')];
  const list = document.querySelector('[data-entries]');
  form.hidden = false;

  const apply = () => {
    const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const entry of entries) {
      const match = terms.every((term) => entry.dataset.search.includes(term));
      entry.hidden = !match;
      if (match) shown += 1;
    }
    // The lead treatment belongs to the newest article of the full list, not to a search result.
    list.classList.toggle('is-filtered', terms.length > 0);
    if (!terms.length) status.textContent = '';
    else if (shown === 0) status.textContent = `No articles match “${input.value.trim()}”.`;
    else status.textContent = `${shown} ${shown === 1 ? 'article matches' : 'articles match'} “${input.value.trim()}”.`;
  };

  form.addEventListener('submit', (e) => e.preventDefault());
  input.addEventListener('input', apply);
  const initial = new URLSearchParams(location.search).get('q');
  if (initial) { input.value = initial; apply(); }
}

// ---- article: copy buttons on code blocks ----
const blocks = document.querySelectorAll('.prose pre[class*="language-"]:not(.language-mermaid)');
if (navigator.clipboard) {
  for (const pre of blocks) {
    const wrap = document.createElement('div');
    wrap.className = 'code';
    pre.replaceWith(wrap);
    wrap.append(pre);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    wrap.append(button);

    let reset = 0;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent.replace(/\n$/, ''));
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Copy failed';
      }
      clearTimeout(reset);
      reset = setTimeout(() => { button.textContent = 'Copy'; }, 2000);
    });
  }
}

// ---- article: table of contents ----
const toc = document.querySelector('[data-toc]');
if (toc) {
  // Beside the article on wide screens it stays open; stacked above it on small ones it starts closed.
  const wide = window.matchMedia('(min-width: 60.0625rem)');
  const sync = () => { toc.open = wide.matches; };
  sync();
  wide.addEventListener('change', sync);

  const links = new Map([...toc.querySelectorAll('a')].map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const headings = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const mark = () => {
    // The current section is the last heading that has passed the top third of the viewport.
    const line = window.innerHeight / 3;
    let current = null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= line) current = heading;
      else break;
    }
    for (const [id, link] of links) {
      if (current && id === current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mark(); });
  }, { passive: true });
  mark();
}

// ---- article: Mermaid diagrams, loaded only on pages that contain one ----
const diagrams = [...document.querySelectorAll('.prose pre.language-mermaid')];
if (diagrams.length) {
  import('https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs')
    .then(async ({ default: mermaid }) => {
      const style = getComputedStyle(document.documentElement);
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: style.getPropertyValue('--font-display'),
      });
      const nodes = diagrams.map((pre) => {
        const figure = document.createElement('div');
        figure.className = 'diagram';
        figure.textContent = pre.textContent;
        pre.replaceWith(figure);
        return figure;
      });
      await mermaid.run({ nodes });
    })
    .catch(() => { /* the diagram source stays readable as a code block */ });
}
