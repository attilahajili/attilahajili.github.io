document.addEventListener('DOMContentLoaded', () => {
  const typingNode = document.querySelector('.typing-text');
  if (!typingNode) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    typingNode.textContent = 'Mathematics student';
    typingNode.setAttribute('aria-label', 'Mathematics student');
    return;
  }

  const phrases = [
    'Mathematics student',
    'Interested in game development',
    'Interested in cybersecurity',
    'Chess player'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const tick = () => {
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      charIndex += 1;
      typingNode.textContent = currentPhrase.slice(0, charIndex);
      if (charIndex === currentPhrase.length) {
        isDeleting = true;
        setTimeout(tick, 1300);
        return;
      }
    } else {
      charIndex -= 1;
      typingNode.textContent = currentPhrase.slice(0, charIndex);
      if (charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }

    const speed = isDeleting ? 50 : 90;
    setTimeout(tick, speed);
  };

  tick();
});
