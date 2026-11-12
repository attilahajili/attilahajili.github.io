document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  const projectCards = document.querySelectorAll('.project-card');
  const hero = document.querySelector('.home-hero');
  const backToTop = document.querySelector('.back-to-top');
  const countUpValues = document.querySelectorAll('[data-count]');
  const timeline = document.querySelector('[data-timeline]');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${(index % 5) * 60}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  if (countUpValues.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    countUpValues.forEach((element) => {
      element.textContent = '0';
    });

    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count);
        const suffix = element.dataset.suffix || '';
        const duration = 900;
        const startTime = performance.now();

        const updateCount = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const easedProgress = 1 - (1 - progress) ** 3;
          const value = Math.round(target * easedProgress);
          element.textContent = `${value}${progress === 1 ? suffix : ''}`;
          if (progress < 1) requestAnimationFrame(updateCount);
        };

        requestAnimationFrame(updateCount);
        countObserver.unobserve(element);
      });
    }, { threshold: 0.6 });

    countUpValues.forEach((element) => countObserver.observe(element));
  }

  if (timeline) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      timeline.classList.add('is-drawn');
    } else {
      const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timeline.classList.add('is-drawn');
            timelineObserver.unobserve(timeline);
          }
        });
      }, { threshold: 0.25 });

      timelineObserver.observe(timeline);
    }
  }

  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches && hero) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--mx', `${x}%`);
      hero.style.setProperty('--my', `${y}%`);
    });
  }

  if (projectCards.length && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    projectCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 8;
        const rotateX = (0.5 - (y / rect.height)) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  if (backToTop) {
    const updateBackToTop = () => {
      const visible = window.scrollY > 500;
      backToTop.classList.toggle('is-visible', visible);
    };

    updateBackToTop();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }
});
