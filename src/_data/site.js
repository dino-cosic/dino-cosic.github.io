// One place for site-wide values. SITE_URL is set by the deploy workflow from the GitHub Pages
// configuration, so a custom domain is picked up without editing this file.
const url = (process.env.SITE_URL || 'https://dino-cosic.github.io').replace(/\/+$/, '');

export default {
  url,
  language: 'en',
  title: 'Dino Cosic, Senior Software Engineer and Technical Lead',
  author: { name: 'Dino Cosic', x: '@Dino_Codes' },
  email: 'dino.cosic95@gmail.com',
  ogImage: '/assets/og.png',
  analyticsId: 'G-JBLGCJDQLL',
  mediumProfile: 'https://medium.com/@dino.cosic',
  // Date of the last meaningful change to index.html, used in the sitemap.
  homeLastmod: '2026-11-11',
  blog: {
    title: 'Writing',
    description: 'Notes from production work: software architecture, legacy modernization, .NET and Azure, and AI-assisted engineering.',
    feedPath: '/blog/feed.xml',
  },
};
