// URL-friendly slugs for articles and tags. Shared by the Eleventy build and the Medium importer.

// Names that would otherwise lose their meaning once punctuation is stripped.
const SPECIAL = [
  [/c#/gi, 'csharp'],
  [/f#/gi, 'fsharp'],
  [/c\+\+/gi, 'cpp'],
  [/(^|[^a-z0-9])\.net/gi, '$1dotnet'],
  [/&/g, ' and '],
];

// Letters that Unicode decomposition does not reduce to ASCII.
const LETTERS = { đ: 'd', Đ: 'd', ß: 'ss', æ: 'ae', Æ: 'ae', ø: 'o', Ø: 'o', ł: 'l', Ł: 'l' };

export function slugify(input, { maxLength = 80 } = {}) {
  let s = String(input ?? '');
  for (const [pattern, replacement] of SPECIAL) s = s.replace(pattern, replacement);
  s = s
    .replace(/[đĐßæÆøØłŁ]/g, (ch) => LETTERS[ch])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length > maxLength) {
    // Cut on a word boundary so the slug never ends mid-word.
    const cut = s.slice(0, maxLength + 1);
    const lastDash = cut.lastIndexOf('-');
    s = (lastDash > 20 ? cut.slice(0, lastDash) : s.slice(0, maxLength)).replace(/-+$/g, '');
  }
  return s;
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isValidSlug = (value) => typeof value === 'string' && SLUG_PATTERN.test(value);
