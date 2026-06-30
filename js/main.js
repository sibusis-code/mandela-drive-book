/* =====================================================================
   HM PITJE FOUNDATION — MANDELA DAY BOOK DRIVE
   Interactions & motion — zero dependencies, lightweight & fast.
   --------------------------------------------------------------------
   • IntersectionObserver scroll reveals + animated counters
   • Sticky glass nav, hide-on-scroll, accessible mobile menu
   • Lightbox gallery, FAQ accordion, copy-to-clipboard
   Native CSS handles smooth scrolling (scroll-behavior + scroll-padding).
   ===================================================================== */

(() => {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ */
  /* Scroll reveals — deterministic, viewport-based                      */
  /* ------------------------------------------------------------------ */
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  const groups = Array.from(document.querySelectorAll('[data-reveal-group]'));

  const showAll = () => {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('[data-reveal-child]').forEach((el) => el.classList.add('is-visible'));
  };

  if (prefersReduced) {
    showAll();
  } else {
    const inView = (el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return r.top < vh * 0.92 && r.bottom > 0;
    };
    const revealGroup = (group) => {
      group.querySelectorAll('[data-reveal-child]').forEach((child, i) => {
        child.style.transitionDelay = (i * 0.1) + 's';
        child.classList.add('is-visible');
      });
      group.dataset.revealed = '1';
    };

    let revealRAF = false;
    const checkReveals = () => {
      revealRAF = false;
      for (let i = revealEls.length - 1; i >= 0; i--) {
        const el = revealEls[i];
        if (inView(el)) {
          const delay = parseFloat(el.dataset.delay || 0);
          if (delay) el.style.transitionDelay = delay + 's';
          el.classList.add('is-visible');
          revealEls.splice(i, 1);
        }
      }
      groups.forEach((g) => { if (!g.dataset.revealed && inView(g)) revealGroup(g); });
    };
    const queueReveals = () => { if (!revealRAF) { revealRAF = true; requestAnimationFrame(checkReveals); } };

    window.addEventListener('scroll', queueReveals, { passive: true });
    window.addEventListener('resize', queueReveals, { passive: true });
    window.addEventListener('load', checkReveals);
    checkReveals();                       // initial (DOM ready)
    setTimeout(checkReveals, 200);        // after layout settles / hash jump
    setTimeout(showAll, 2500);            // ultimate failsafe: never leave content hidden
  }

  /* ------------------------------------------------------------------ */
  /* Animated counters                                                   */
  /* ------------------------------------------------------------------ */
  const counters = document.querySelectorAll('[data-count]');

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    if (prefersReduced) {
      el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString('en-US');
      return;
    }
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString('en-US');
    };
    requestAnimationFrame(tick);
  };

  if (counters.length && 'IntersectionObserver' in window) {
    const cObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cObserver.observe(c));
  } else {
    counters.forEach(runCounter);
  }

  /* ------------------------------------------------------------------ */
  /* Navigation: glass, hide-on-scroll, floating donate, mobile menu     */
  /* ------------------------------------------------------------------ */
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav__burger');
  const floatDonate = document.querySelector('.float-donate');
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);

    // Don't auto-hide while the mobile menu is open
    if (!nav.classList.contains('nav--open')) {
      if (y > 600 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4) nav.classList.remove('is-hidden');
    }
    if (floatDonate) floatDonate.classList.toggle('is-visible', y > 700);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();

  function closeMenu() {
    nav.classList.remove('nav--open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function openMenu() {
    nav.classList.remove('is-hidden');
    nav.classList.add('nav--open');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  if (burger) {
    burger.addEventListener('click', () => {
      nav.classList.contains('nav--open') ? closeMenu() : openMenu();
    });
  }

  // Close menu when a link is clicked (native CSS handles the smooth scroll)
  document.querySelectorAll('.nav__menu a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ------------------------------------------------------------------ */
  /* FAQ accordion                                                       */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('.faq__item').forEach((item) => {
    const q = item.querySelector('.faq__q');
    const a = item.querySelector('.faq__a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
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
  /* Lightbox gallery                                                    */
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
      lbImg.src = item.dataset.full || item.querySelector('img').src;
      lbImg.alt = item.querySelector('img').alt || '';
      lbCap.textContent = item.dataset.caption || '';
    };
    const open = (i) => {
      show(i);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
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
  /* Copy-to-clipboard (bank details) + toast                            */
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
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
