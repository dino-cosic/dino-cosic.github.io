import './chrome.js';

const root = document.documentElement;
const CAREER_START = new Date(2019, 2, 1); // March 2019

// ---- dynamic dates ----
const years = Math.floor((new Date() - CAREER_START) / (365.25 * 24 * 3600 * 1000));
document.querySelectorAll('[data-years]').forEach((el) => { el.textContent = String(years); });

const nav = document.getElementById('site-nav');

// ---- current section in the nav ----
// Only in-page links take part; "Writing" leads to /blog/ and has no section here.
const links = [...nav.querySelectorAll('a[href^="#"]')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const hero = document.querySelector('.hero');
const spy = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (entry.target === hero) {
      links.forEach((a) => a.removeAttribute('aria-current'));
      continue;
    }
    links.forEach((a) => {
      if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => spy.observe(s));
if (hero) spy.observe(hero);

// ---- contact: copy the address for people without a mail client ----
const copyBtn = document.querySelector('.copy');
const copyStatus = document.querySelector('.copy-status');
const copyLabel = document.querySelector('.copy-label');
if (copyBtn && navigator.clipboard) {
  copyBtn.hidden = false;
  let reset = 0;
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copy);
      copyBtn.classList.add('is-done');
      copyLabel.textContent = 'Copied';
      copyStatus.textContent = 'Email address copied';
    } catch {
      copyStatus.textContent = 'Could not copy. Select the address instead.';
    }
    clearTimeout(reset);
    reset = setTimeout(() => {
      copyBtn.classList.remove('is-done');
      copyLabel.textContent = 'Copy email';
      copyStatus.textContent = '';
    }, 2000);
  });
}

// ---- hero: Three.js when available, SVG drawing otherwise ----
async function startHero() {
  if (!root.classList.contains('gl')) return;
  try {
    const { initHeroScene } = await import('./hero-scene.js');
    initHeroScene({
      canvas: document.getElementById('portrait-gl'),
      svg: document.getElementById('portrait'),
      still: root.classList.contains('still'),
    });
  } catch (err) {
    root.classList.add('gl-failed');
  }
}
startHero();
