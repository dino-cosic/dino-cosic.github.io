// Site chrome shared by the homepage and the blog: the header menu, the header rule on scroll,
// the thread's progress, and the year in the footer.
const root = document.documentElement;

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

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
