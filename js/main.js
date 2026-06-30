/* =====================================================================
   HM PITJE FOUNDATION — MANDELA DAY BOOK DRIVE
   Interactions & motion
   --------------------------------------------------------------------
   Dependencies (loaded via CDN in index.html, all optional/guarded):
     • GSAP + ScrollTrigger  — scroll reveals, counters, parallax
     • Lenis                 — smooth scrolling
   Everything degrades gracefully if a library fails to load.
   ===================================================================== */

(() => {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';

  /* ------------------------------------------------------------------ */
  /* Smooth scrolling (Lenis) + ScrollTrigger sync                       */
  /* ------------------------------------------------------------------ */
  let lenis = null;
  if (hasLenis && !prefersReduced) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    if (hasGSAP && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* Anchor links → smooth scroll (works with or without Lenis) */
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70 });
    else el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    link.addEventListener('click', (e) => {
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollTo(target);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Navigation: glass on scroll, hide-on-down, mobile menu             */
  /* ------------------------------------------------------------------ */
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const floatDonate = document.querySelector('.float-donate');
  let lastY = window.scrollY;

  function onScroll() {
    const y = window.scrollY;

    nav.classList.toggle('is-scrolled', y > 40);

    // Hide on scroll down (past hero), show on scroll up
    if (y > 600 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4) nav.classList.remove('is-hidden');

    // Floating donate button appears after hero
    if (floatDonate) floatDonate.classList.toggle('is-visible', y > 700);

    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    nav.classList.remove('nav--open');
    document.body.style.overflow = '';
  }
  if (burger) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('nav--open');
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ------------------------------------------------------------------ */
  /* Scroll reveals                                                      */
  /* ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if (hasGSAP && window.ScrollTrigger && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);

    revealEls.forEach((el) => {
      const delay = parseFloat(el.dataset.delay || 0);
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
      });
    });

    // Grouped stagger for any container marked [data-reveal-group]
    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
      const items = group.querySelectorAll('[data-reveal-child]');
      gsap.set(items, { opacity: 0, y: 30 });
      gsap.to(items, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: group, start: 'top 82%' },
      });
    });

    // Hero parallax on the image
    const heroImg = document.querySelector('.hero__media img');
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    // Final CTA media subtle parallax
    const finalImg = document.querySelector('.final__media img');
    if (finalImg) {
      gsap.fromTo(finalImg, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  } else {
    // Fallback: IntersectionObserver
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'opacity .8s ease, transform .8s ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'none';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => io.observe(el));
    document.querySelectorAll('[data-reveal-child]').forEach((el) => {
      el.style.opacity = 0; el.style.transform = 'translateY(30px)';
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Hero headline word reveal                                          */
  /* ------------------------------------------------------------------ */
  if (hasGSAP && !prefersReduced) {
    const words = document.querySelectorAll('.hero__title .word > span');
    if (words.length) {
      gsap.set(words, { yPercent: 110 });
      gsap.to(words, {
        yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.25,
      });
    }
    gsap.from('.hero__tag, .hero__sub, .hero__actions', {
      opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.7,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Animated counters                                                  */
  /* ------------------------------------------------------------------ */
  const counters = document.querySelectorAll('[data-count]');

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const duration = 2000;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = target * eased;
      el.textContent = decimals
        ? val.toFixed(decimals)
        : Math.round(val).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString('en-US');
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    const cObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          cObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cObserver.observe(c));
  }

  /* ------------------------------------------------------------------ */
  /* FAQ accordion                                                      */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('.faq__item').forEach((item) => {
    const q = item.querySelector('.faq__q');
    const a = item.querySelector('.faq__a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // close siblings
      document.querySelectorAll('.faq__item.is-open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.faq__a').style.height = '0px';
          other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !isOpen);
      q.setAttribute('aria-expanded', String(!isOpen));
      a.style.height = isOpen ? '0px' : a.querySelector('.faq__a-inner').offsetHeight + 'px';
    });
  });

  /* ------------------------------------------------------------------ */
  /* Lightbox gallery                                                   */
  /* ------------------------------------------------------------------ */
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('.lightbox__img');
    const lbCap = lightbox.querySelector('.lightbox__cap');
    const items = Array.from(document.querySelectorAll('.gallery__item'));
    let index = 0;

    const show = (i) => {
      index = (i + items.length) % items.length;
      const item = items[index];
      const full = item.dataset.full || item.querySelector('img').src;
      const cap = item.dataset.caption || '';
      lbImg.src = full;
      lbImg.alt = item.querySelector('img').alt || '';
      lbCap.textContent = cap;
    };

    const open = (i) => {
      show(i);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    };
    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    };

    items.forEach((item, i) => {
      item.addEventListener('click', () => open(i));
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    lightbox.querySelector('.lightbox__close').addEventListener('click', close);
    lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(index - 1));
    lightbox.querySelector('.lightbox__nav--next').addEventListener('click', () => show(index + 1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Copy-to-clipboard (bank details) + toast                          */
  /* ------------------------------------------------------------------ */
  const toast = document.querySelector('.toast');
  const toastText = toast ? toast.querySelector('.toast__text') : null;
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toastText.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const t = document.createElement('textarea');
        t.value = value; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(t);
      }
      btn.classList.add('copied');
      showToast('Copied to clipboard');
      setTimeout(() => btn.classList.remove('copied'), 1400);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Footer year                                                        */
  /* ------------------------------------------------------------------ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
