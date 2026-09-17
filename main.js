import { addToCart, updateQty, removeFromCart, onCartChange, getState, clearCart, formatPrice } from './cart.js';
import { PRODUCT, findSize, findFinish, findVariant } from './product-data.js';
import { init3DExperience, setBottleFinish, setBottleSize, setCollectionVariant, setCraftFocus } from './scene-3d.js';

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
// Collection Showcase: 3D Multi-Variant Luxury Product Library
// ---------------------------------------------------------------------------

let activeCollectionVariant = 'original';

function initCollectionShowcase() {
  const pills = document.querySelectorAll('.variant-pill');
  const badgeEl = document.getElementById('col-badge');
  const priceEl = document.getElementById('col-price');
  const titleEl = document.getElementById('col-title');
  const subEl = document.getElementById('col-sub');
  const descEl = document.getElementById('col-desc');
  const notesEl = document.getElementById('col-notes');
  const orderBtn = document.getElementById('col-order-btn');
  const cardEl = document.getElementById('collection-active-card');

  function selectVariant(id) {
    const variant = findVariant(id);
    if (!variant) return;

    activeCollectionVariant = id;

    // 1. Update 3D Bottle Materials & Lighting in real time
    setCollectionVariant(id);

    // 2. Animate card content smoothly
    if (cardEl) {
      cardEl.classList.add('morphing');
      setTimeout(() => {
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
      pills.forEach((p) => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');

      const variantId = pill.getAttribute('data-variant');
      selectVariant(variantId);
    });
  });

  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      const variant = findVariant(activeCollectionVariant);
      addToCart('500', 'onyx', 1);
      showToast(`Reserved ${variant.name} (500ml) in your bag`);
      openCart();
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
  const subtotalEl = document.getElementById('cart-subtotal-amt');
  const countEl = document.getElementById('bag-count');

  if (!linesEl) return;

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
  }

  if (subtotalEl) subtotalEl.textContent = formatPrice(state.subtotal);
  if (countEl) {
    if (state.count > 0) {
      countEl.textContent = String(state.count);
      countEl.hidden = false;
    } else {
      countEl.hidden = true;
    }
  }
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
  const summary = document.getElementById('checkout-summary');
  const doneBtn = document.getElementById('checkout-done');
  const orderNumberEl = document.getElementById('order-number');

  if (openBtn) openBtn.addEventListener('click', () => {
    const state = getState();
    if (summary) {
      summary.innerHTML = state.lines.map((l) =>
        `<div class="checkout-summary-line" style="display:flex;justify-content:space-between;padding:4px 0;"><span>${l.size.label} &middot; ${l.finish.label} &times; ${l.qty}</span><span>${formatPrice(l.lineTotal)}</span></div>`
      ).join('') + `<div class="checkout-summary-line total" style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid rgba(243,237,226,0.1);margin-top:6px;font-weight:600;color:var(--c-champagne)"><span>Total</span><span>${formatPrice(state.subtotal)}</span></div>`;
    }
    toggleDrawer('cart-drawer', false);
    toggleDrawer('checkout-drawer', true);
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
