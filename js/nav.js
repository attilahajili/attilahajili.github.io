document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelectorAll('.nav-link');
  const progress = document.querySelector('.scroll-progress');

  const setActiveLink = () => {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach((link) => {
      const target = link.getAttribute('href');
      const isActive = target === current || (current === '' && target === 'index.html');
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const handleScroll = () => {
    const scrolled = window.scrollY > 12;
    header.classList.toggle('is-scrolled', scrolled);

    if (progress) {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      progress.style.width = `${percent}%`;
    }
  };

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const opened = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(opened));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  setActiveLink();
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('load', setActiveLink);
});
