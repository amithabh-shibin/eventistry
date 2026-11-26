document.documentElement.classList.add('js');

const menu = document.querySelector('.menu-toggle');
if (menu) {
  const nav = document.getElementById('navigation');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menu.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) setMenu(false);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      menu.focus();
    }
  });
  matchMedia('(max-width: 760px)').addEventListener('change', () => setMenu(false));
}

// Let the inline contact buttons take over while the home banner actions are visible.
const bannerActions = document.querySelector('[data-hero-actions]');
const contactDock = document.querySelector('.contact-dock');
if (bannerActions && contactDock && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => {
    contactDock.classList.toggle('hero-actions-visible', entry.isIntersecting);
  }, {threshold: .15});
  observer.observe(bannerActions);
}

// The first event photo stays visible when JavaScript is unavailable.
const hero = document.querySelector('.hero');
if (hero) {
  const slides = [...hero.querySelectorAll('[data-slide]')];
  const controls = hero.querySelector('.hero-controls');
  const selectors = [...controls.querySelectorAll('[data-slide-button]')];
  const pause = controls.querySelector('[data-slide-pause]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let playing = !motion.matches;
  let timer;

  function showSlide(index) {
    slides[current].classList.remove('is-current');
    selectors[current].setAttribute('aria-pressed', 'false');
    current = index;
    slides[current].classList.add('is-current');
    selectors[current].setAttribute('aria-pressed', 'true');
  }

  function syncPlayback() {
    clearInterval(timer);
    pause.textContent = playing ? 'Pause' : 'Play';
    pause.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
    if (playing && !document.hidden) {
      timer = setInterval(() => showSlide((current + 1) % slides.length), 6000);
    }
  }

  selectors.forEach((button, index) => button.addEventListener('click', () => {
    showSlide(index);
    playing = false;
    syncPlayback();
  }));
  pause.addEventListener('click', () => {
    playing = !playing;
    syncPlayback();
  });
  motion.addEventListener('change', event => {
    if (event.matches) playing = false;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  controls.hidden = false;
  syncPlayback();
}

const lightbox = document.querySelector('.lightbox');
document.querySelectorAll('[data-photo]').forEach(link => {
  link.addEventListener('click', event => {
    if (!lightbox?.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const image = lightbox.querySelector('img');
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    lightbox.showModal();
  });
});
lightbox?.querySelector('button').addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});

// GA4 is optional. Load it only after consent and omit URL query values.
const analyticsId = document.currentScript?.dataset.analytics;
let analyticsStarted = false;
function track(name, data = {}) {
  if (analyticsStarted) window.gtag('event', name, data);
}
function startAnalytics() {
  if (analyticsStarted || !analyticsId) return;
  analyticsStarted = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  const cleanUrl = location.origin + location.pathname;
  const campaign = new URLSearchParams(location.search);
  const options = { send_page_view: false, page_location: cleanUrl, page_referrer: '' };
  for (const field of ['source', 'medium', 'campaign']) {
    const value = campaign.get('utm_' + field);
    if (value && /^[\w.+ -]{1,80}$/.test(value) && !value.includes('@')) {
      options['campaign_' + (field === 'campaign' ? 'name' : field)] = value;
    }
  }
  window.gtag('config', analyticsId, options);
  track('page_view', { page_location: cleanUrl });
  const confirmation = document.querySelector('[data-quote-id]');
  if (confirmation && !sessionStorage.getItem('lead-' + confirmation.dataset.quoteId)) {
    sessionStorage.setItem('lead-' + confirmation.dataset.quoteId, 'sent');
    track('generate_lead', { lead_source: confirmation.dataset.source });
  }
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + analyticsId;
  script.async = true;
  document.head.append(script);
}
function showConsent() {
  if (!analyticsId || document.querySelector('.consent')) return;
  const banner = document.createElement('section');
  banner.className = 'consent';
  banner.setAttribute('aria-label', 'Analytics preferences');
  banner.innerHTML = '<p>Allow anonymous website usage measurement with Google Analytics?</p><div class="actions"><button class="button" data-choice="allow">Allow analytics</button><button class="button outline" data-choice="decline">Decline</button></div>';
  banner.addEventListener('click', event => {
    const choice = event.target.dataset.choice;
    if (!choice) return;
    localStorage.setItem('eventistry-analytics', choice);
    window['ga-disable-' + analyticsId] = choice === 'decline';
    if (choice === 'allow') startAnalytics();
    banner.remove();
  });
  document.body.append(banner);
}
if (analyticsId) {
  const preference = localStorage.getItem('eventistry-analytics');
  if (preference === 'allow') startAnalytics();
  if (!preference) showConsent();
}
document.querySelector('[data-privacy]')?.addEventListener('click', () => {
  if (analyticsId) showConsent();
  else document.querySelector('[data-privacy-notice]').textContent = 'Website analytics is currently disabled.';
});
document.querySelectorAll('[data-whatsapp]').forEach(link => {
  link.addEventListener('click', () => track('whatsapp_click'));
});
