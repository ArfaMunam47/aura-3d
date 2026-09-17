import { PRODUCT, findSize, findFinish } from './product-data.js';

const STORAGE_KEY = 'aura-cart-v1';

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[AURA cart] Could not read cart from storage', e);
    return [];
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[AURA cart] Could not persist cart', e);
  }
}

let items = readCart();
const listeners = new Set();

function notify() {
  writeCart(items);
  listeners.forEach((fn) => fn(getState()));
}

export function onCartChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  const lines = items.map((line) => {
    const size = findSize(line.sizeId);
    const finish = findFinish(line.finishId);
    return { ...line, size, finish, lineTotal: size.price * line.qty };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  return { lines, subtotal, count };
}

export function addToCart(sizeId, finishId, qty = 1) {
  const key = sizeId + '::' + finishId;
  const existing = items.find((l) => l.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ key, sizeId, finishId, qty });
  }
  notify();
}

export function updateQty(key, qty) {
  const line = items.find((l) => l.key === key);
  if (!line) return;
  if (qty <= 0) {
    items = items.filter((l) => l.key !== key);
  } else {
    line.qty = qty;
  }
  notify();
}

export function removeFromCart(key) {
  items = items.filter((l) => l.key !== key);
  notify();
}

export function clearCart() {
  items = [];
  notify();
}

export function formatPrice(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

export { PRODUCT };
