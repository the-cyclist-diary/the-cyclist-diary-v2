(function () {
  'use strict';

  var images = [];
  var currentIndex = 0;
  var overlay, lbImg, closeBtn, prevBtn, nextBtn, counter;
  var touchStartX = 0;
  var isOpen = false;

  /* ── Collect all lightbox-trigger elements in DOM order ── */
  function buildImageList() {
    var triggers = document.querySelectorAll('a.lightbox-trigger, figure.lightbox-trigger[data-lightbox-src]');
    images = Array.from(triggers).map(function (el) {
      var src = el.tagName === 'FIGURE'
        ? el.getAttribute('data-lightbox-src')
        : el.href;
      return { src: src, el: el };
    });
  }

  /* ── Build the overlay DOM (once) ── */
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Visionneuse d\'images');

    closeBtn = document.createElement('button');
    closeBtn.className = 'lb-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.innerHTML = '&times;';

    prevBtn = document.createElement('button');
    prevBtn.className = 'lb-nav lb-prev';
    prevBtn.setAttribute('aria-label', 'Image précédente');
    prevBtn.innerHTML = '&#8249;';

    nextBtn = document.createElement('button');
    nextBtn.className = 'lb-nav lb-next';
    nextBtn.setAttribute('aria-label', 'Image suivante');
    nextBtn.innerHTML = '&#8250;';

    lbImg = document.createElement('img');
    lbImg.className = 'lb-img is-loading';
    lbImg.setAttribute('alt', '');

    counter = document.createElement('span');
    counter.className = 'lb-counter';

    overlay.appendChild(closeBtn);
    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    overlay.appendChild(lbImg);
    overlay.appendChild(counter);

    document.body.appendChild(overlay);

    /* Events */
    closeBtn.addEventListener('click', close);

    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(-1);
    });

    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(1);
    });

    /* Click on dark backdrop closes */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    /* Prevent image click from bubbling to backdrop */
    lbImg.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    /* Touch swipe */
    overlay.addEventListener('touchstart', onTouchStart, { passive: true });
    overlay.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  /* ── Open lightbox at a given index ── */
  function open(index) {
    if (!overlay) createOverlay();
    currentIndex = index;
    renderSlide();
    if (!isOpen) {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      isOpen = true;
    }
  }

  /* ── Close lightbox ── */
  function close() {
    if (!isOpen) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    isOpen = false;
    /* Reset image after fade-out */
    setTimeout(function () {
      lbImg.src = '';
      lbImg.classList.add('is-loading');
    }, 260);
  }

  /* ── Render current slide ── */
  function renderSlide() {
    var entry = images[currentIndex];
    lbImg.classList.add('is-loading');
    lbImg.onload = function () {
      lbImg.classList.remove('is-loading');
    };
    lbImg.onerror = function () {
      lbImg.classList.remove('is-loading');
    };
    lbImg.src = entry.src;

    counter.textContent = (currentIndex + 1) + '\u2009/\u2009' + images.length;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === images.length - 1;
  }

  /* ── Navigate by direction (-1 or +1) ── */
  function navigate(dir) {
    var next = currentIndex + dir;
    if (next < 0 || next >= images.length) return;
    currentIndex = next;
    renderSlide();
  }

  /* ── Keyboard ── */
  function onKeyDown(e) {
    if (!isOpen) return;
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Escape')     close();
  }

  /* ── Touch swipe ── */
  function onTouchStart(e) {
    touchStartX = e.changedTouches[0].clientX;
  }

  function onTouchEnd(e) {
    var delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) navigate(delta < 0 ? 1 : -1);
  }

  /* ── Init: attach click handlers to every trigger ── */
  function init() {
    buildImageList();
    if (images.length === 0) return;

    document.addEventListener('keydown', onKeyDown);

    images.forEach(function (entry, index) {
      entry.el.addEventListener('click', function (e) {
        e.preventDefault();
        open(index);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
