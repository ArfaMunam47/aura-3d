import { addToCart, updateQty, removeFromCart, onCartChange, getState, clearCart, formatPrice } from './cart.js';
import { PRODUCT, findSize, findFinish, findVariant } from './product-data.js';
import { 
  init3DExperience, 
  setBottleFinish, 
  setBottleSize, 
  setCollectionVariant, 
  setCraftFocus,
  setCameraMode,
  setLightingMood,
  toggleTurntable
} from './scene-3d.js';
import { 
  playSwell, 
  playCrystalChime, 
  playMechanicalClick, 
  playWhoosh, 
  toggleAudio, 
  getAudioStatus 
} from './sound-effects.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

function boot() {
  init3DExperience('aura-canvas-container');
  initLoader();
  initNav();
  initScrollReveals();
  initMaterialsInspection();
  initCollectionShowcase();
  initAtelierGallery();
  initCinemaDirector();
  initGrandCTA();
  initShop();
  initCart();
  initCheckout();
  initNewsletter();
}

// ---------------------------------------------------------------------------
// Loader: Smooth transition into 3D experience
// ---------------------------------------------------------------------------

function initLoader() {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loader-fill');
  if (!loader) return;

  let progress = 0;
  const timer = setInterval(() => {
    progress += Math.random() * 24 + 14;
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
      if (fill) fill.style.width = '100%';
      setTimeout(() => {
        loader.classList.add('hidden');
      }, 300);
    } else {
      if (fill) fill.style.width = `${progress}%`;
    }
  }, 80);
}

// ---------------------------------------------------------------------------
// Nav: Transparent -> Solid on scroll, active section indication, mobile menu
// ---------------------------------------------------------------------------

function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');

  const sections = [
    { id: 'intro', link: document.querySelector('.nav-link[data-section="intro"]') },
    { id: 'design', link: document.querySelector('.nav-link[data-section="design"]') },
    { id: 'materials', link: document.querySelector('.nav-link[data-section="materials"]') },
    { id: 'collection', link: document.querySelector('.nav-link[data-section="collection"]') },
    { id: 'story', link: document.querySelector('.nav-link[data-section="story"]') },
    { id: 'shop', link: document.querySelector('.nav-link[data-section="shop"]') },
  ];

  function onScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 60) nav.classList.add('solid');
    else nav.classList.remove('solid');

    const middleY = scrollY + window.innerHeight * 0.4;
    let currentId = '';

    for (const sec of sections) {
      const el = document.getElementById(sec.id);
      if (el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (middleY >= top && middleY <= bottom) {
          currentId = sec.id;
          break;
        }
      }
    }

    navLinks.forEach((a) => {
      if (a.getAttribute('data-section') === currentId) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('open', open);
    });

    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('open');
    }));
  }
}

// ---------------------------------------------------------------------------
// Scroll Reveals
// ---------------------------------------------------------------------------

function initScrollReveals() {
  const targets = document.querySelectorAll('.intro-card, .design-card, .material-card, .story-card, .collection-card, .cta-final-inner, .shop-panel');
  if (!targets.length) return;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((t) => io.observe(t));
}

// ---------------------------------------------------------------------------
// Materials & Craft Inspection (Exact Same 3D Bottle)
// ---------------------------------------------------------------------------

function initMaterialsInspection() {
  const pills = document.querySelectorAll('.craft-pill');
  const cards = document.querySelectorAll('.material-card');

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const craft = pill.getAttribute('data-craft');
      pills.forEach((p) => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');

      // Update 3D Camera focus on exact same bottle
      setCraftFocus(craft);

      // Highlight corresponding card
      cards.forEach((card) => {
        if (card.getAttribute('data-craft-target') === craft) {
          card.classList.add('craft-active');
        } else {
          card.classList.remove('craft-active');
        }
      });
    });
  });

  // Clicking directly on a material card triggers craft inspection
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-craft-target');
      const targetPill = document.querySelector(`.craft-pill[data-craft="${target}"]`);
      if (targetPill) targetPill.click();
    });
  });
}

// ---------------------------------------------------------------------------
// Collection Showcase: 3D Multi-Variant Luxury Product Library (12 Editions)
// ---------------------------------------------------------------------------

let activeCollectionVariant = 'crystal';

function initCollectionShowcase() {
  const pills = document.querySelectorAll('.variant-pill');
  const numEl = document.getElementById('col-number');
  const badgeEl = document.getElementById('col-badge');
  const priceEl = document.getElementById('col-price');
  const titleEl = document.getElementById('col-title');
  const subEl = document.getElementById('col-sub');
  const descEl = document.getElementById('col-desc');
  const notesEl = document.getElementById('col-notes');
  const orderBtn = document.getElementById('col-order-btn');
  const inspectLabelBtn = document.getElementById('col-inspect-label-btn');
  const cardEl = document.getElementById('collection-active-card');
  const openGalleryBtn = document.getElementById('btn-open-gallery-stage');

  function selectVariant(id, triggerSound = true) {
    const variant = findVariant(id);
    if (!variant) return;

    activeCollectionVariant = id;

    // 1. Update 3D Bottle Materials & Kiln Silkscreen in real time
    setCollectionVariant(id);
    if (triggerSound) playCrystalChime();

    // 2. Sync swatch active state
    pills.forEach((p) => {
      const isCur = p.getAttribute('data-variant') === id;
      p.classList.toggle('active', isCur);
      p.setAttribute('aria-selected', String(isCur));
    });

    // 3. Animate card content smoothly
    if (cardEl) {
      cardEl.classList.add('morphing');
      setTimeout(() => {
        if (numEl) numEl.textContent = `EDITION N° ${variant.number}`;
        if (badgeEl) badgeEl.textContent = variant.tag;
        if (priceEl) priceEl.textContent = `$${variant.price}`;
        if (titleEl) titleEl.textContent = variant.name;
        if (subEl) subEl.textContent = variant.subtitle;
        if (descEl) descEl.textContent = variant.description;
        if (notesEl) notesEl.textContent = variant.notes;
        cardEl.classList.remove('morphing');
      }, 160);
    }
  }

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const variantId = pill.getAttribute('data-variant');
      selectVariant(variantId);
    });
  });

  if (inspectLabelBtn) {
    inspectLabelBtn.addEventListener('click', () => {
      setCameraMode('label');
      playWhoosh();
      showToast('Cinematic Macro Focus: Kiln-Fired AURA Silkscreen');
    });
  }

  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      const variant = findVariant(activeCollectionVariant);
      addToCart('500', 'onyx', 1);
      playMechanicalClick();
      showToast(`Reserved ${variant.name} in your bag`);
      openCart();
    });
  }

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      openAtelierGallery();
    });
  }

  // Expose selectVariant globally for gallery synchronization
  window.auraSelectVariant = selectVariant;
}

// ---------------------------------------------------------------------------
// 12-Bottle Atelier Gallery Modal Experience
// ---------------------------------------------------------------------------

let isGalleryOpen = false;

function openAtelierGallery() {
  const modal = document.getElementById('atelier-gallery');
  const backdrop = document.getElementById('gallery-backdrop');
  if (!modal) return;

  isGalleryOpen = true;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  if (backdrop) {
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('modal-open');
  playSwell();
}

function closeAtelierGallery() {
  const modal = document.getElementById('atelier-gallery');
  const backdrop = document.getElementById('gallery-backdrop');
  if (!modal) return;

  isGalleryOpen = false;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('modal-open');
}

function initAtelierGallery() {
  const modal = document.getElementById('atelier-gallery');
  const backdrop = document.getElementById('gallery-backdrop');
  const closeBtn = document.getElementById('gallery-close-btn');
  const grid = document.getElementById('gallery-grid');
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const navTrigger = document.getElementById('nav-collection-btn');
  const mobileTrigger = document.getElementById('mobile-collection-btn');
  const turntableBtn = document.getElementById('gallery-turntable-btn');
  const turntableText = document.getElementById('gallery-turntable-text');

  // Wire open buttons
  if (navTrigger) navTrigger.addEventListener('click', (e) => { e.preventDefault(); openAtelierGallery(); });
  if (mobileTrigger) mobileTrigger.addEventListener('click', (e) => { e.preventDefault(); closeMobileMenu(); openAtelierGallery(); });
  if (closeBtn) closeBtn.addEventListener('click', closeAtelierGallery);
  if (backdrop) backdrop.addEventListener('click', closeAtelierGallery);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isGalleryOpen) {
      closeAtelierGallery();
    }
  });

  // Turntable button
  let isTurntableOn = false;
  if (turntableBtn) {
    turntableBtn.addEventListener('click', () => {
      isTurntableOn = !isTurntableOn;
      toggleTurntable(isTurntableOn);
      turntableBtn.classList.toggle('active', isTurntableOn);
      if (turntableText) {
        turntableText.textContent = isTurntableOn ? '360° Turntable (Active)' : '360° Turntable';
      }
      playWhoosh();
    });
  }

  // Render 12 Unique Bottle Cards
  if (grid) {
    grid.innerHTML = PRODUCT.variants.map((v) => {
      return `
        <article class="gallery-card" data-variant-id="${v.id}" data-category="${v.category}">
          <div class="gallery-card-preview" style="background: radial-gradient(circle at 50% 45%, ${v.haloColor}25 0%, rgba(16,16,20,0.6) 75%);">
            <!-- Custom Dynamic Bottle Silhouette SVG -->
            <svg class="bottle-svg-preview" viewBox="0 0 120 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="glass-grad-${v.id}" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="${v.glassColor}" stop-opacity="0.85" />
                  <stop offset="50%" stop-color="#ffffff" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="${v.attenuationColor}" stop-opacity="0.9" />
                </linearGradient>
                <linearGradient id="cap-grad-${v.id}" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="${v.capColor}" />
                  <stop offset="60%" stop-color="#2a2b30" />
                  <stop offset="100%" stop-color="${v.capColor}" />
                </linearGradient>
                <linearGradient id="liquid-grad-${v.id}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="${v.liquidColor}" stop-opacity="${v.liquidOpacity * 0.4}" />
                  <stop offset="100%" stop-color="${v.liquidColor}" stop-opacity="${v.liquidOpacity}" />
                </linearGradient>
              </defs>
              <!-- Aluminum Billet Cap -->
              <rect x="42" y="16" width="36" height="32" rx="4" fill="url(#cap-grad-${v.id})" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
              <line x1="42" y1="24" x2="78" y2="24" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
              <line x1="42" y1="32" x2="78" y2="32" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
              <line x1="42" y1="40" x2="78" y2="40" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>

              <!-- Bottle Neck -->
              <rect x="47" y="48" width="26" height="24" fill="url(#glass-grad-${v.id})" />

              <!-- Bottle Shoulder & Main Cylinder Body -->
              <path d="M 47 72 C 47 88, 22 96, 22 115 L 22 248 C 22 258, 30 266, 40 266 L 80 266 C 90 266, 98 258, 98 248 L 98 115 C 98 96, 73 88, 73 72 Z"
                fill="url(#glass-grad-${v.id})"
                stroke="rgba(255,255,255,0.3)"
                stroke-width="1.2"
              />

              <!-- Liquid Fill Column -->
              <path d="M 26 128 L 26 246 C 26 254, 32 260, 42 260 L 78 260 C 88 260, 94 254, 94 246 L 94 128 Z"
                fill="url(#liquid-grad-${v.id})"
              />

              <!-- Prominent Monumental AURA Kiln Silkscreen Branding -->
              <text x="60" y="172" 
                text-anchor="middle" 
                font-family="'Cormorant Garamond', 'Cinzel', serif" 
                font-size="15" 
                font-weight="600" 
                letter-spacing="5" 
                fill="${v.foilColor}"
                stroke="rgba(0,0,0,0.4)"
                stroke-width="0.3"
              >AURA</text>

              <text x="60" y="190" 
                text-anchor="middle" 
                font-family="'Inter', sans-serif" 
                font-size="5" 
                letter-spacing="2" 
                fill="${v.foilColor}"
                opacity="0.85"
              >EDITION N° ${v.number}</text>

              <!-- Optic Light Reflection Stroke -->
              <path d="M 30 115 L 30 248" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round" />
            </svg>

            <span class="gallery-badge-top">${v.tag}</span>
            <span class="gallery-number-top">N° ${v.number}</span>
          </div>

          <div class="gallery-card-info">
            <div class="gallery-card-title-row">
              <h3 class="gallery-card-title">${v.name}</h3>
              <span class="gallery-card-price">$${v.price}</span>
            </div>
            <p class="gallery-card-sub">${v.subtitle}</p>
            <p class="gallery-card-desc">${v.description}</p>
            
            <div class="gallery-card-sensory">
              <span class="sensory-label">Sensory Profile</span>
              <span class="sensory-val">${v.notes}</span>
            </div>

            <div class="gallery-card-footer">
              <button class="btn btn-primary btn-inspect-live" data-inspect-id="${v.id}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Inspect in 3D</span>
              </button>
              <button class="btn btn-secondary btn-acquire-quick" data-acquire-id="${v.id}">Acquire</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Wire "Inspect in 3D" buttons
    grid.querySelectorAll('.btn-inspect-live').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-inspect-id');
        if (window.auraSelectVariant) {
          window.auraSelectVariant(id, false);
        }
        playCrystalChime();
        closeAtelierGallery();
        setCameraMode('label');

        const colSec = document.getElementById('collection');
        if (colSec) {
          colSec.scrollIntoView({ behavior: 'smooth' });
        }
        showToast(`Inspecting AURA ${findVariant(id)?.name} live in 3D`);
      });
    });

    // Wire "Acquire" buttons
    grid.querySelectorAll('.btn-acquire-quick').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-acquire-id');
        const variant = findVariant(id);
        addToCart('500', 'onyx', 1);
        playMechanicalClick();
        showToast(`Added ${variant.name} to your bag`);
        closeAtelierGallery();
        openCart();
      });
    });
  }

  // Category Filtering
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.getAttribute('data-filter');
      const cards = grid.querySelectorAll('.gallery-card');

      cards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = '';
          card.classList.remove('filtered-out');
        } else {
          card.style.display = 'none';
          card.classList.add('filtered-out');
        }
      });
      playWhoosh();
    });
  });
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const toggle = document.getElementById('nav-toggle');
  if (menu) menu.classList.remove('open');
  if (toggle) {
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
}

// ---------------------------------------------------------------------------
// Cinema Director HUD: Interactive Camera Angles & Lighting Moods
// ---------------------------------------------------------------------------

function initCinemaDirector() {
  const hud = document.getElementById('director-hud');
  const toggleBtn = document.getElementById('nav-director-toggle');
  const closeBtn = document.getElementById('director-close-btn');
  const soundNavBtn = document.getElementById('nav-sound-toggle');
  const soundHudBtn = document.getElementById('director-toggle-audio-btn');
  const soundStatusText = document.getElementById('director-audio-status');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const openGalleryBtn = document.getElementById('director-open-gallery-btn');

  let isHudOpen = false;

  function toggleDirector() {
    isHudOpen = !isHudOpen;
    if (hud) {
      hud.classList.toggle('open', isHudOpen);
      hud.setAttribute('aria-hidden', String(!isHudOpen));
    }
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', isHudOpen);
    }
    playWhoosh();
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleDirector);
  if (closeBtn) closeBtn.addEventListener('click', toggleDirector);

  // Camera angle buttons
  const camBtns = document.querySelectorAll('#camera-angle-group .director-opt-btn');
  camBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      camBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cam = btn.getAttribute('data-cam');
      setCameraMode(cam);
      playWhoosh();
      showToast(`Camera: ${btn.textContent.trim()}`);
    });
  });

  // Lighting mood buttons
  const lightBtns = document.querySelectorAll('#lighting-mood-group .director-opt-btn');
  lightBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      lightBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const light = btn.getAttribute('data-light');
      setLightingMood(light);
      playCrystalChime();
      showToast(`Lighting: ${btn.textContent.trim()}`);
    });
  });

  // Sound toggling
  function updateSoundUI(isActive) {
    if (soundStatusText) soundStatusText.textContent = isActive ? 'ON' : 'OFF';
    if (soundIconOn && soundIconOff) {
      soundIconOn.style.display = isActive ? 'block' : 'none';
      soundIconOff.style.display = isActive ? 'none' : 'block';
    }
    if (soundNavBtn) {
      soundNavBtn.classList.toggle('active', isActive);
      soundNavBtn.setAttribute('title', isActive ? 'Sound: Crystal Resonance Active' : 'Sound: Muted (Click to enable)');
    }
  }

  function handleSoundToggle() {
    const active = toggleAudio();
    updateSoundUI(active);
    if (active) {
      playCrystalChime();
      showToast('Crystal Acoustic Resonance Activated');
    } else {
      showToast('Acoustic Resonance Muted');
    }
  }

  if (soundNavBtn) soundNavBtn.addEventListener('click', handleSoundToggle);
  if (soundHudBtn) soundHudBtn.addEventListener('click', handleSoundToggle);

  if (openGalleryBtn) {
    openGalleryBtn.addEventListener('click', () => {
      toggleDirector();
      openAtelierGallery();
    });
  }
}

// ---------------------------------------------------------------------------
// Grand Final Call To Action (Before Footer)
// ---------------------------------------------------------------------------

function initGrandCTA() {
  const orderNowBtn = document.getElementById('cta-order-now');
  if (orderNowBtn) {
    orderNowBtn.addEventListener('click', () => {
      const shopSec = document.getElementById('shop');
      if (shopSec) {
        shopSec.scrollIntoView({ behavior: 'smooth' });
      } else {
        openCart();
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Shop Configurator: Size / Finish / Quantity selection + 3D live synchronizer
// ---------------------------------------------------------------------------

let selectedSize = PRODUCT.sizes[0].id;
let selectedFinish = PRODUCT.finishes[0].id;
let selectedQty = 1;

function initShop() {
  const sizeRow = document.getElementById('size-options');
  const finishRow = document.getElementById('finish-options');
  const priceEl = document.getElementById('shop-price');
  const qtyEl = document.getElementById('qty-value');
  const sizeSubLabel = document.getElementById('selected-size-label');
  const finishSubLabel = document.getElementById('selected-finish-label');

  function updatePrice() {
    const size = findSize(selectedSize);
    if (priceEl) priceEl.textContent = formatPrice(size.price);
    if (sizeSubLabel) sizeSubLabel.textContent = `${size.label} · ${size.sub || 'Everyday'}`;
  }

  function updateFinish() {
    const finish = findFinish(selectedFinish);
    if (finishSubLabel) finishSubLabel.textContent = `${finish.label} · Anodized`;
    setBottleFinish(selectedFinish);
  }

  if (sizeRow) {
    sizeRow.querySelectorAll('.option-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        sizeRow.querySelectorAll('.option-pill').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        selectedSize = btn.getAttribute('data-size');
        updatePrice();
        setBottleSize(selectedSize);
      });
    });
  }

  if (finishRow) {
    finishRow.querySelectorAll('.finish-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        finishRow.querySelectorAll('.finish-swatch').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        selectedFinish = btn.getAttribute('data-finish');
        updateFinish();
      });
    });
  }

  const minus = document.getElementById('qty-minus');
  const plus = document.getElementById('qty-plus');
  if (minus) minus.addEventListener('click', () => {
    selectedQty = Math.max(1, selectedQty - 1);
    if (qtyEl) qtyEl.textContent = String(selectedQty);
  });
  if (plus) plus.addEventListener('click', () => {
    selectedQty = Math.min(9, selectedQty + 1);
    if (qtyEl) qtyEl.textContent = String(selectedQty);
  });

  const addBtn = document.getElementById('add-to-cart');
  if (addBtn) addBtn.addEventListener('click', () => {
    addToCart(selectedSize, selectedFinish, selectedQty);
    addBtn.classList.add('pressed');
    setTimeout(() => addBtn.classList.remove('pressed'), 220);
    showToast(`Added ${selectedQty} × AURA to bag`);
    selectedQty = 1;
    if (qtyEl) qtyEl.textContent = '1';
    openCart();
  });

  updatePrice();
  updateFinish();
}

// ---------------------------------------------------------------------------
// Cart Drawer
// ---------------------------------------------------------------------------

function openCart() {
  toggleDrawer('cart-drawer', true);
}
function closeCart() {
  toggleDrawer('cart-drawer', false);
}

function toggleDrawer(id, open) {
  const drawer = document.getElementById(id);
  const overlay = document.getElementById('drawer-overlay');
  if (!drawer) return;
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  if (overlay) overlay.classList.toggle('open', open);
  document.body.classList.toggle('drawer-locked', open);
}

function renderCart(state) {
  const linesEl = document.getElementById('cart-lines');
  const emptyEl = document.getElementById('cart-empty');
  const footEl = document.getElementById('cart-foot');
  const countEl = document.getElementById('bag-count');

  if (!linesEl) return;

  const taxRate = 0.08;
  const taxAmount = Math.round(state.subtotal * taxRate);
  const finalTotal = state.subtotal + taxAmount;

  if (state.lines.length === 0) {
    linesEl.innerHTML = '';
    if (emptyEl) emptyEl.hidden = false;
    if (footEl) footEl.hidden = true;
  } else {
    if (emptyEl) emptyEl.hidden = true;
    if (footEl) footEl.hidden = false;
    linesEl.innerHTML = state.lines.map((line) => `
      <div class="cart-line" data-key="${line.key}">
        <div class="cart-line-info">
          <span class="cart-line-name">${PRODUCT.name}</span>
          <div class="cart-line-variant">${line.size.label} &middot; ${line.finish.label}</div>
          <div class="cart-line-qty">
            <button class="qty-btn small" data-action="dec" aria-label="Decrease quantity">–</button>
            <span>${line.qty}</span>
            <button class="qty-btn small" data-action="inc" aria-label="Increase quantity">+</button>
            <button class="cart-remove-btn" data-action="remove" aria-label="Remove item">Remove</button>
          </div>
        </div>
        <div class="cart-line-price">
          ${formatPrice(line.lineTotal)}
        </div>
      </div>
    `).join('');

    if (footEl) {
      footEl.innerHTML = `
        <div class="cart-summary-breakdown">
          <div class="cart-summary-line">
            <span>Subtotal</span>
            <span>${formatPrice(state.subtotal)}</span>
          </div>
          <div class="cart-summary-line tax-highlight">
            <span>Estimated Sales Tax / VAT (8%) <span class="tax-pill">Calculated</span></span>
            <span>${formatPrice(taxAmount)}</span>
          </div>
          <div class="cart-summary-line shipping-free">
            <span>Insured Atelier Shipping</span>
            <span>Complimentary</span>
          </div>
          <div class="cart-summary-line total-due">
            <span>Total Amount</span>
            <span>${formatPrice(finalTotal)}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-full" id="checkout-open">Proceed to Checkout</button>
      `;
      const openBtn = document.getElementById('checkout-open');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          openCheckoutModal();
        });
      }
    }
  }

  if (countEl) {
    if (state.count > 0) {
      countEl.textContent = String(state.count);
      countEl.hidden = false;
    } else {
      countEl.hidden = true;
    }
  }
}

function openCheckoutModal() {
  const state = getState();
  const summary = document.getElementById('checkout-summary');
  const taxRate = 0.08;
  const taxAmount = Math.round(state.subtotal * taxRate);
  const finalTotal = state.subtotal + taxAmount;

  if (summary) {
    summary.innerHTML = state.lines.map((l) =>
      `<div class="checkout-summary-line"><span>${l.size.label} &middot; ${l.finish.label} &times; ${l.qty}</span><span>${formatPrice(l.lineTotal)}</span></div>`
    ).join('') + `
      <div class="checkout-summary-line" style="border-top: 1px solid rgba(243,237,226,0.12); margin-top: 6px; padding-top: 6px;">
        <span>Subtotal</span>
        <span>${formatPrice(state.subtotal)}</span>
      </div>
      <div class="checkout-summary-line tax-line">
        <span>Estimated Sales Tax (8%)</span>
        <span>${formatPrice(taxAmount)}</span>
      </div>
      <div class="checkout-summary-line shipping-line">
        <span>Insured Courier Delivery</span>
        <span>$0.00 (Free)</span>
      </div>
      <div class="checkout-summary-line total">
        <span>Total Due</span>
        <span>${formatPrice(finalTotal)}</span>
      </div>
    `;
  }
  toggleDrawer('cart-drawer', false);
  toggleDrawer('checkout-drawer', true);
}

function initCart() {
  const bagToggle = document.getElementById('bag-toggle');
  const closeBtn = document.getElementById('cart-close');
  const overlay = document.getElementById('drawer-overlay');
  const linesEl = document.getElementById('cart-lines');

  if (bagToggle) bagToggle.addEventListener('click', openCart);
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', () => {
    closeCart();
    toggleDrawer('checkout-drawer', false);
  });

  if (linesEl) {
    linesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const lineEl = btn.closest('.cart-line');
      const key = lineEl && lineEl.getAttribute('data-key');
      if (!key) return;
      const state = getState();
      const line = state.lines.find((l) => l.key === key);
      if (!line) return;
      if (btn.dataset.action === 'inc') updateQty(key, line.qty + 1);
      if (btn.dataset.action === 'dec') updateQty(key, line.qty - 1);
      if (btn.dataset.action === 'remove') removeFromCart(key);
    });
  }

  onCartChange(renderCart);
  renderCart(getState());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      toggleDrawer('checkout-drawer', false);
    }
  });
}

// ---------------------------------------------------------------------------
// Checkout Drawer
// ---------------------------------------------------------------------------

function initCheckout() {
  const openBtn = document.getElementById('checkout-open');
  const closeBtn = document.getElementById('checkout-close');
  const form = document.getElementById('checkout-form');
  const success = document.getElementById('checkout-success');
  const doneBtn = document.getElementById('checkout-done');
  const orderNumberEl = document.getElementById('order-number');

  if (openBtn) openBtn.addEventListener('click', () => {
    openCheckoutModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', () => toggleDrawer('checkout-drawer', false));

  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    const orderNumber = 'AURA-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    if (orderNumberEl) orderNumberEl.textContent = orderNumber;
    form.hidden = true;
    if (success) success.hidden = false;
    clearCart();
  });

  if (doneBtn) doneBtn.addEventListener('click', () => {
    toggleDrawer('checkout-drawer', false);
    setTimeout(() => {
      if (form) { form.hidden = false; form.reset(); }
      if (success) success.hidden = true;
    }, 300);
  });
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.checkValidity()) return;
    input.value = '';
    showToast('Subscribed to AURA Chronicle');
  });
}

// ---------------------------------------------------------------------------
// Toast Notification
// ---------------------------------------------------------------------------

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 2200);
}

ready(boot);
