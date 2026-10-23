const root = document.documentElement;
const CAREER_START = new Date(2019, 2, 1); // March 2019

// ---- dynamic dates ----
const now = new Date();
const years = Math.floor((now - CAREER_START) / (365.25 * 24 * 3600 * 1000));
document.querySelectorAll('[data-years]').forEach((el) => { el.textContent = String(years); });
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(now.getFullYear()); });

// ---- header ----
const bar = document.querySelector('.bar');
const toggle = document.querySelector('.bar-toggle');
const nav = document.getElementById('site-nav');

const scrim = document.querySelector('.bar-scrim');
const desktop = window.matchMedia('(min-width: 760px)');

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Close' : 'Menu';
  nav.classList.toggle('is-open', open);
  root.classList.toggle('menu-open', open);
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
scrim.addEventListener('click', () => setMenu(false));
desktop.addEventListener('change', () => setMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});

// ---- scroll: header rule + the thread's progress ----
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    root.style.setProperty('--p', max > 0 ? String(Math.min(1, window.scrollY / max)) : '0');
    bar.classList.toggle('is-scrolled', window.scrollY > 8);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---- current section in the nav ----
const links = [...nav.querySelectorAll('a')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    links.forEach((a) => {
      if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => spy.observe(s));

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
