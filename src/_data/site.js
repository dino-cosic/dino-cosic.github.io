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
  ogImageSize: { width: 1200, height: 630 },
  googleSiteVerification: '9rrFKu-za7_JffM9mlg_sImdzfKeu_5OdozHmUFJAsU',
  analyticsId: 'G-JBLGCJDQLL',
  mediumProfile: 'https://medium.com/@dino.cosic',
  blog: {
    title: 'Writing',
    description: 'Notes from production work: software architecture, legacy modernization, .NET and Azure, and AI-assisted engineering.',
    feedPath: '/blog/feed.xml',
  },
};
