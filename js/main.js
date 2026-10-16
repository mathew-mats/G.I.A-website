/* ==========================================================
   GADHAFI INTEGRATED ACADEMY — Main JavaScript
   ========================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* =========================================================
     1. MOBILE MENU TOGGLE
     ========================================================= */
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks   = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      navLinks.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('active'));
    });
  }

  /* =========================================================
     2. AUTO-HIGHLIGHT ACTIVE NAV LINK
     ========================================================= */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });

  /* =========================================================
     3. GALLERY LIGHTBOX
     ========================================================= */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox     = document.getElementById('lightbox');

  if (galleryItems.length && lightbox) {

    const lightboxImg      = lightbox.querySelector('.lightbox-image-wrap img');
    const captionText      = lightbox.querySelector('.caption-text');
    const captionCounter   = lightbox.querySelector('.caption-counter');
    const btnPrev          = lightbox.querySelector('.lightbox-nav.prev');
    const btnNext          = lightbox.querySelector('.lightbox-nav.next');
    const btnClose         = lightbox.querySelector('.lightbox-close');

    let currentIndex = 0;
    let visibleItems = [];

    /* Build the list of visible items (respects filters) */
    function refreshVisibleItems() {
      visibleItems = Array.from(galleryItems).filter(
        item => !item.classList.contains('hidden')
      );
    }

    /* Open lightbox at a specific gallery-item index */
    function openLightbox(index) {
      refreshVisibleItems();
      if (!visibleItems.length) return;

      currentIndex = Math.max(0, Math.min(index, visibleItems.length - 1));
      updateLightbox();
      lightbox.classList.add('open');
      document.body.classList.add('lightbox-open');
    }

    /* Close lightbox */
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.classList.remove('lightbox-open');
      // Clear image src after fade-out so no flash on next open
      setTimeout(() => { lightboxImg.src = ''; }, 300);
    }

    /* Move to previous / next */
    function showPrev() {
      if (!visibleItems.length) return;
      currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
      updateLightbox();
    }
    function showNext() {
      if (!visibleItems.length) return;
      currentIndex = (currentIndex + 1) % visibleItems.length;
      updateLightbox();
    }

    /* Render current image + caption + counter */
    function updateLightbox() {
      const item  = visibleItems[currentIndex];
      const img   = item.querySelector('img');
      const cap   = item.dataset.caption || img.getAttribute('alt') || '';
      const label = item.dataset.label || '';

      // Fade out, swap, fade in
      lightboxImg.classList.remove('loaded');
      const newSrc = img.getAttribute('src');
      const preload = new Image();
      preload.onload = function () {
        lightboxImg.src = newSrc;
        lightboxImg.alt = img.getAttribute('alt') || '';
        requestAnimationFrame(() => lightboxImg.classList.add('loaded'));
      };
      preload.src = newSrc;

      // Caption
      if (label) {
        captionText.innerHTML = '<strong>' + label + '</strong>' + cap;
      } else {
        captionText.innerHTML = '<strong>' + cap + '</strong>';
      }
      // Counter
      captionCounter.textContent = (currentIndex + 1) + ' / ' + visibleItems.length;
    }

    /* Attach click handlers to gallery items */
    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => {
        refreshVisibleItems();
        const visibleIndex = visibleItems.indexOf(item);
        openLightbox(visibleIndex);
      });
    });

    /* Controls */
    btnPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
    btnNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
    btnClose.addEventListener('click', closeLightbox);

    /* Click backdrop to close (but not when clicking the image) */
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    /* Keyboard navigation */
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  showPrev();
      if (e.key === 'ArrowRight') showNext();
    });

    /* =========================================================
       GALLERY FILTERS (optional — only runs if filters exist)
       ========================================================= */
    const filterButtons = document.querySelectorAll('.gallery-filter');
    if (filterButtons.length) {
      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filter = btn.dataset.filter;
          galleryItems.forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
              item.classList.remove('hidden');
            } else {
              item.classList.add('hidden');
            }
          });
          refreshVisibleItems();
        });
      });
    }

    /* Light swipe support (touch) */
    let touchStartX = 0;
    let touchEndX = 0;
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) showPrev();
        else showNext();
      }
    }, { passive: true });
  }

});

/* ==========================================================
   PROGRAMS SLIDER — Arrows + Dots + Autoplay
   ========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.programs-slider-wrap').forEach(function (wrap) {
    const slider = wrap.querySelector('.programs-slider');
    const prevBtn = wrap.querySelector('.slider-arrow.prev');
    const nextBtn = wrap.querySelector('.slider-arrow.next');
    const dotsWrap = wrap.querySelector('.slider-dots');
    if (!slider) return;

    const cards = slider.querySelectorAll('.program-card');
    if (!cards.length) return;

    const AUTOPLAY_DELAY = 4000;    // ms between slides
    const PAUSE_ON_HOVER = true;    // pause when user hovers

    let autoplayTimer = null;
    let isPaused = false;

    /* Build dots */
    const dots = [];
    if (dotsWrap) {
      cards.forEach(function (_, i) {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Go to card ' + (i + 1));
        b.addEventListener('click', function () {
          scrollToCard(i, true);
        });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function cardStep() {
      const first = cards[0];
      const style = window.getComputedStyle(slider);
      const gap = parseInt(style.gap) || 0;
      return first.offsetWidth + gap;
    }

    function currentIndex() {
      const step = cardStep();
      return Math.round(slider.scrollLeft / step);
    }

    function maxIndex() {
      // How many steps can we scroll to before hitting the end
      const step = cardStep();
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      return Math.ceil(maxScroll / step);
    }

    function scrollToCard(i, userAction) {
      const max = maxIndex();
      const target = Math.max(0, Math.min(i, max));
      slider.scrollTo({ left: target * cardStep(), behavior: 'smooth' });

      // If user clicked a dot, restart autoplay timer
      if (userAction) restartAutoplay();
    }

    function updateUI() {
      if (prevBtn) prevBtn.disabled = slider.scrollLeft <= 4;
      if (nextBtn) nextBtn.disabled =
        slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 4;

      const idx = currentIndex();
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === Math.min(idx, dots.length - 1));
      });
    }

    /* ---- Autoplay ---- */
    function nextSlide() {
      if (isPaused) return;
      const idx = currentIndex();
      const max = maxIndex();
      // If at end, go back to start
      if (idx >= max) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollToCard(idx + 1);
      }
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    /* Pause when user interacts */
    if (PAUSE_ON_HOVER) {
      wrap.addEventListener('mouseenter', function () { isPaused = true; });
      wrap.addEventListener('mouseleave', function () { isPaused = false; });
      wrap.addEventListener('touchstart', function () {
        isPaused = true;
        // Resume 6s after touch ends
        setTimeout(function () { isPaused = false; }, 6000);
      }, { passive: true });
    }

    /* Pause when tab not focused (saves battery) */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    /* Arrows */
    if (prevBtn) prevBtn.addEventListener('click', function () {
      scrollToCard(Math.max(0, currentIndex() - 1), true);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      scrollToCard(Math.min(maxIndex(), currentIndex() + 1), true);
    });

    slider.addEventListener('scroll', updateUI, { passive: true });
    window.addEventListener('resize', updateUI);

    updateUI();
    startAutoplay();
  });
});