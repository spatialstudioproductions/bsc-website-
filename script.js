// NAV — scrolled state
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 80);
});

// HERO — scroll-driven parallax + wash
const heroMid        = document.querySelector('.hero-mid');
const heroMidImg     = document.querySelector('.hero-mid img');
const heroWash       = document.querySelector('.hero-wash');
const heroContent    = document.querySelector('.hero-content');
const heroScrollLine = document.querySelector('.hero-scroll');
const heroWrapper    = document.getElementById('hero-wrapper');

if (heroWrapper) {
  window.addEventListener('scroll', () => {
    const scrollY  = window.scrollY;
    const wrapperH = heroWrapper.offsetHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollY / wrapperH, 0), 1);

    const riseP = Math.min(progress / 0.7, 1);
    const zoomP = Math.max((progress - 0.7) / 0.3, 0);

    if (heroMid) {
      heroMid.style.transform = `translateY(${(1 - riseP) * 100 + 20 * (1 - zoomP)}vh)`;
    }
    if (heroMidImg) {
      heroMidImg.style.transform = `scale(${1 + zoomP * 1.5})`;
    }

    if (heroWash) {
      heroWash.style.opacity = progress > 0.8 ? (progress - 0.8) / 0.2 : 0;
    }

    // Pre-animate services content as yellow wash completes
    if (progress >= 0.85) {
      document.querySelectorAll('#services [data-animate]').forEach(el => {
        if (!el.classList.contains('in-view')) {
          const delay = parseInt(el.dataset.delay || 0);
          setTimeout(() => el.classList.add('in-view'), delay);
        }
      });
    }

    const contentFade = Math.max(0, 1 - Math.max(0, progress - 0.4) * 1.667);
    if (heroContent) {
      heroContent.style.opacity = contentFade;
      heroContent.style.transform = `translateY(${progress * -40}px)`;
    }
    if (heroScrollLine) heroScrollLine.style.opacity = contentFade;

  }, { passive: true });
}

// SERVICES — scroll sync (Create / Make / Deliver)
const svcRows  = document.querySelectorAll('#services .service-row');
const svcWords = document.querySelectorAll('#services .hl-word');

if (svcRows.length) {
  function syncServices() {
    const trigger = window.innerHeight * 0.48;
    let active = -1;
    svcRows.forEach((row, i) => {
      const r = row.getBoundingClientRect();
      if (r.top < trigger) active = i;
    });
    svcRows.forEach((row, i)  => row.classList.toggle('is-active', i === active));
    svcWords.forEach((w, i)   => w.classList.toggle('is-active', i === active));
  }
  window.addEventListener('scroll', syncServices, { passive: true });
  window.addEventListener('resize', syncServices);
  syncServices();
}

// SCROLL ANIMATIONS — IntersectionObserver
const animatedEls = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('in-view'), delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px 60px 0px' });
animatedEls.forEach(el => observer.observe(el));

// PHOTO SCROLLER — scroll-driven horizontal strip
(function () {
  const outer   = document.querySelector('.photo-scroll-outer');
  const track   = document.querySelector('.photo-scroll-track');
  const counter = document.querySelector('.photo-scroll-current');
  if (!outer || !track) return;
  const slides = track.children.length;

  function update() {
    const rect       = outer.getBoundingClientRect();
    const scrollable = outer.offsetHeight - window.innerHeight;
    const progress   = Math.max(0, Math.min(1, -rect.top / scrollable));
    const mapped     = Math.min(Math.max(0, (progress - 0.15) / 0.75), 1);
    track.style.transform = `translateX(${-mapped * (slides - 1) * 100}vw)`;
    if (counter) {
      counter.textContent = String(Math.min(slides, Math.floor(mapped * slides) + 1)).padStart(2, '0');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// HAMBURGER MENU
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-menu a');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}
