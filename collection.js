import { PRODUCT } from './product-data.js';
import {
  init3DExperience,
  setVariant,
  toggleTurntable,
  inspectLabelDetail,
  activeVariantId,
} from './scene-3d.js';
import {
  addToCart,
  getState,
  onCartChange,
  openCart,
  closeCart,
  formatPrice,
  clearCart,
  updateQty,
  removeFromCart,
} from './cart.js';

let isTurntableActive = false;
let currentActiveVariant = 'amber';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Engine for the Collection Page
  const canvasContainer = document.getElementById('aura-canvas-container');
  if (canvasContainer) {
    init3DExperience(canvasContainer);
    setVariant('amber');
  }

  // 2. Render the 12 Editions Grid
  renderCollectionCards('all');

  // 3. Render the Master Specifications Matrix Table
  renderSpecsMatrix();

  // 4. Setup Filters
  setupFilters();

  // 5. Setup Live Studio Banner Controls
  setupStudioBanner();

  // 6. Setup Cart & Checkout
  initCart();
  initCheckout();

  // 7. Setup Audio Toggle
  setupAudio();

  // 8. Setup Mobile Navigation
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.classList.toggle('open', isOpen);
    });
  }
});

function renderCollectionCards(filter = 'all') {
  const grid = document.getElementById('collection-page-grid');
  if (!grid) return;

  const editions = PRODUCT.collection || [];
  const filtered = filter === 'all' 
    ? editions 
    : editions.filter(e => e.category === filter);

  grid.innerHTML = filtered.map(v => {
    const isSelected = v.id === currentActiveVariant;
    const hexGlass = '#' + (v.glassColor || 0xffeedd).toString(16).padStart(6, '0');
    const hexLiquid = '#' + (v.liquidColor || 0x9e5210).toString(16).padStart(6, '0');
    const hexCap = '#' + (v.capColor || 0xd4a359).toString(16).padStart(6, '0');

    return `
      <article class="bottle-edition-card ${isSelected ? 'selected-in-3d' : ''}" data-id="${v.id}" id="card-col-${v.id}">
        <div>
          <div class="edition-card-top">
            <span class="edition-num-text">N° ${v.number}</span>
            <span class="edition-badge-pill">${v.tag}</span>
          </div>

          <div class="edition-art-frame" style="background: radial-gradient(circle at 50% 50%, ${v.swatchHex}22 0%, transparent 72%);">
            <svg class="edition-svg-silhouette" viewBox="0 0 100 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-col-glass-${v.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="${hexGlass}" stop-opacity="0.85" />
                  <stop offset="50%" stop-color="#ffffff" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="${v.swatchHex}" stop-opacity="0.9" />
                </linearGradient>
                <linearGradient id="grad-col-liquid-${v.id}" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="${hexLiquid}" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="${hexLiquid}" stop-opacity="0.95" />
                </linearGradient>
                <linearGradient id="grad-col-cap-${v.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="${hexCap}" />
                  <stop offset="50%" stop-color="#ffffff" stop-opacity="0.6" />
                  <stop offset="100%" stop-color="${hexCap}" />
                </linearGradient>
              </defs>
              <!-- Cap with knurled detailing -->
              <rect x="36" y="10" width="28" height="24" rx="3" fill="url(#grad-col-cap-${v.id})" stroke="${v.accentHex}" stroke-width="1"/>
              <line x1="36" y1="18" x2="64" y2="18" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="2,2"/>
              <line x1="36" y1="22" x2="64" y2="22" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="2,2"/>

              <!-- Bottle Neck & Shoulders -->
              <path d="M41 34 C41 46 22 64 22 92 L22 214 C22 226 78 226 78 214 L78 92 C78 64 59 46 59 34 Z" fill="url(#grad-col-glass-${v.id})" stroke="${v.accentHex}" stroke-width="1.5"/>

              <!-- Liquid Core Meniscus -->
              <path d="M25 106 C25 106 36 103 50 106 C64 109 75 106 75 106 L75 210 C75 218 25 218 25 210 Z" fill="url(#grad-col-liquid-${v.id})" opacity="0.88"/>

              <!-- Bold High-Contrast AURA Silkscreen Branding -->
              <g transform="translate(50, 154) rotate(-90)">
                <text x="0" y="4" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="900" font-size="14" letter-spacing="4" fill="${v.foilColor || '#ffffff'}" stroke="rgba(0,0,0,0.4)" stroke-width="0.7">AURA</text>
              </g>

              <!-- Crystal Foot Base -->
              <ellipse cx="50" cy="214" rx="28" ry="6" fill="${hexGlass}" opacity="0.6" stroke="${v.accentHex}" stroke-width="1"/>
            </svg>
          </div>

          <div class="edition-card-meta">
            <h3 class="edition-card-name">${v.name}</h3>
            <p class="edition-card-sub">${v.subtitle}</p>
            <p class="edition-card-desc">${v.description}</p>
          </div>

          <div class="edition-specs-table">
            <div class="edition-spec-row">
              <span>Sensory Notes</span>
              <span style="color: var(--c-champagne-light);">${v.notes}</span>
            </div>
            <div class="edition-spec-row">
              <span>Composition</span>
              <span>Borosilicate IOR 1.54</span>
            </div>
            <div class="edition-spec-row">
              <span>Closure</span>
              <span>Anodized Billet Alloy</span>
            </div>
          </div>
        </div>

        <div class="edition-card-footer">
          <div class="edition-price-col">
            <span class="edition-price-label">Price</span>
            <span class="edition-price-amt">$${v.price}</span>
          </div>
          <div class="edition-btns-col">
            <button class="btn btn-secondary btn-inspect-col" data-action="inspect" data-variant="${v.id}">
              Inspect 3D
            </button>
            <button class="btn btn-primary btn-buy-col" data-action="buy" data-variant="${v.id}">
              Acquire
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Wire buttons inside grid
  grid.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const variantId = btn.dataset.variant;
      const variant = editions.find(e => e.id === variantId);
      if (!variant) return;

      if (action === 'inspect') {
        selectVariantInStudio(variant);
      } else if (action === 'buy') {
        selectVariantInStudio(variant);
        addToCart(PRODUCT.sizes[0], PRODUCT.finishes[0], 1);
        showToast(`Added ${variant.name} to your bag`);
        openCart();
      }
    });
  });
}

function selectVariantInStudio(variant) {
  currentActiveVariant = variant.id;
  setVariant(variant.id);

  // Update UI indicators
  const dot = document.getElementById('col-live-dot');
  const name = document.getElementById('col-live-name');
  const sub = document.getElementById('col-live-sub');

  if (dot) {
    dot.style.background = variant.swatchHex;
    dot.style.color = variant.swatchHex;
  }
  if (name) name.textContent = variant.name;
  if (sub) sub.textContent = `${variant.subtitle} · Live 3D Refraction Active`;

  // Highlight active card
  document.querySelectorAll('.bottle-edition-card').forEach(c => {
    c.classList.toggle('selected-in-3d', c.dataset.id === variant.id);
  });
}

function setupFilters() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter || 'all';
      renderCollectionCards(filter);
    });
  });
}

function setupStudioBanner() {
  const turntableBtn = document.getElementById('col-turntable-toggle');
  const turntableText = document.getElementById('col-turntable-text');
  const liveOrderBtn = document.getElementById('col-live-order-btn');

  if (turntableBtn) {
    turntableBtn.addEventListener('click', () => {
      isTurntableActive = !isTurntableActive;
      toggleTurntable(isTurntableActive);
      turntableBtn.classList.toggle('active', isTurntableActive);
      if (turntableText) {
        turntableText.textContent = isTurntableActive ? 'Stop 360°' : '360° Turntable';
      }
    });
  }

  if (liveOrderBtn) {
    liveOrderBtn.addEventListener('click', () => {
      addToCart(PRODUCT.sizes[0], PRODUCT.finishes[0], 1);
      showToast(`Added ${currentActiveVariant.toUpperCase()} to your bag`);
      openCart();
    });
  }
}

function renderSpecsMatrix() {
  const tbody = document.getElementById('specs-matrix-body');
  if (!tbody) return;

  const editions = PRODUCT.collection || [];
  const matrixData = [
    { id: 'amber', glass: 'Amber Borosilicate 3.3', pigment: 'Iron & Sulfur Oxides', billet: 'Brushed Brass Billet', ior: '1.542', tare: '410g' },
    { id: 'obsidian', glass: 'Smoked Quartz Glass', pigment: 'Manganese & Cobalt', billet: 'Gunmetal Titanium', ior: '1.538', tare: '425g' },
    { id: 'emerald', glass: 'Forest Green Borosilicate', pigment: 'Chromium Oxide (Cr₂O₃)', billet: 'Moss Anodized Alloy', ior: '1.540', tare: '415g' },
    { id: 'cobalt', glass: 'Royal Sapphire Crystal', pigment: 'Cobalt Aluminate', billet: 'Azure Titanium', ior: '1.544', tare: '420g' },
    { id: 'rose', glass: 'Dusk Rose Quartz', pigment: 'Erbium & Copper', billet: 'Anodized Copper-Rose', ior: '1.539', tare: '410g' },
    { id: 'terracotta', glass: 'Desert Sienna Borosilicate', pigment: 'Iron Oxide & Clay Frits', billet: 'Burnished Bronze', ior: '1.541', tare: '418g' },
    { id: 'amethyst', glass: 'Imperial Violet Glass', pigment: 'Manganese Dioxide', billet: 'Smoked Violet Alloy', ior: '1.543', tare: '416g' },
    { id: 'champagne', glass: 'Champagne Citrine', pigment: 'Titanium & Gold Frits', billet: 'Turned Champagne Gold', ior: '1.537', tare: '408g' },
    { id: 'noir', glass: 'Opaque Jet Obsidian', pigment: 'Carbon Black & Magnetite', billet: 'Diamond Knurled Noir', ior: '1.545', tare: '430g' },
    { id: 'glacier', glass: 'Arctic Aquamarine', pigment: 'Copper & Cobalt Solute', billet: 'Arctic Silver Alloy', ior: '1.538', tare: '412g' },
    { id: 'opaline', glass: 'Moonstone Borosilicate', pigment: 'Bone Ash & Fluorspar', billet: 'Satin Pewter Billet', ior: '1.540', tare: '422g' },
    { id: 'crystal', glass: 'Optic Pure Borosilicate', pigment: 'Zero Pigment (Unfiltered)', billet: 'Pure 24K Gilded Brass', ior: '1.520', tare: '400g' },
  ];

  tbody.innerHTML = editions.map(ed => {
    const meta = matrixData.find(m => m.id === ed.id) || matrixData[0];
    return `
      <tr>
        <td style="font-weight: 600; color: var(--c-ivory);">${ed.name}</td>
        <td>${meta.glass}</td>
        <td>${meta.pigment}</td>
        <td>${meta.billet}</td>
        <td>${meta.ior}</td>
        <td>${meta.tare}</td>
        <td style="color: var(--c-champagne); font-weight: 600;">$${ed.price}</td>
      </tr>
    `;
  }).join('');
}

// ---------------------------------------------------------------------------
// Cart & Checkout Support on Collection Page
// ---------------------------------------------------------------------------

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

function toggleDrawer(id, open) {
  const drawer = document.getElementById(id);
  const overlay = document.getElementById('drawer-overlay');
  if (!drawer) return;
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', String(!open));
  if (overlay) overlay.classList.toggle('open', open);
  document.body.classList.toggle('drawer-locked', open);
}

function initCart() {
  const bagToggle = document.getElementById('bag-toggle');
  const closeBtn = document.getElementById('cart-close');
  const overlay = document.getElementById('drawer-overlay');
  const linesEl = document.getElementById('cart-lines');

  if (bagToggle) bagToggle.addEventListener('click', () => toggleDrawer('cart-drawer', true));
  if (closeBtn) closeBtn.addEventListener('click', () => toggleDrawer('cart-drawer', false));
  if (overlay) overlay.addEventListener('click', () => {
    toggleDrawer('cart-drawer', false);
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
}

function initCheckout() {
  const closeBtn = document.getElementById('checkout-close');
  const form = document.getElementById('checkout-form');
  const success = document.getElementById('checkout-success');
  const doneBtn = document.getElementById('checkout-done');
  const orderNumberEl = document.getElementById('order-number');

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

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  toast.hidden = false;
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 2400);
}

function setupAudio() {
  let audioCtx = null;
  let isSoundActive = false;
  let osc1 = null;
  let gainNode = null;

  const toggleBtn = document.getElementById('nav-sound-toggle');
  const iconOff = document.getElementById('sound-icon-off');
  const iconOn = document.getElementById('sound-icon-on');

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isSoundActive = !isSoundActive;
    if (isSoundActive) {
      osc1 = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.04, audioCtx.currentTime + 1.2);
      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start();

      if (iconOff) iconOff.style.display = 'none';
      if (iconOn) iconOn.style.display = 'block';
      toggleBtn.classList.add('active');
    } else {
      if (gainNode && osc1) {
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
        setTimeout(() => { osc1.stop(); osc1.disconnect(); }, 400);
      }
      if (iconOff) iconOff.style.display = 'block';
      if (iconOn) iconOn.style.display = 'none';
      toggleBtn.classList.remove('active');
    }
  });
}
