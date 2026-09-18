import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { PRODUCT, findVariant } from './product-data.js';

/**
 * AURA — Ultra-Luxury 3D Bottle Stage & Camera Engine
 *
 * Core Principles:
 * 1. Physical Luxury Realism:
 *    - Authentic flame-polished borosilicate crystal with solid weighted punt base.
 *    - Rich, non-whitish glass attenuation (Baltic Cognac Quartz, Smoked Obsidian, Nordic Emerald).
 *    - Precision-machined aluminum closure with diamond knurling, chamfers, and engraved top monogram.
 *    - High-contrast, ultra-bold silkscreened enamel typography physically fused onto glass surface.
 * 2. Subtle Depth-of-Field (DOF) Camera Controller:
 *    - Dynamic lens bokeh blurs background dust, halo, and atmosphere as user scrolls.
 *    - Focus locked tack-sharp on the AURA bottle to emulate high-end cine product photography.
 * 3. Autonomous Living Bottle:
 *    - Multi-harmonic organic floating and gentle breath (no irritating manual dragging required).
 *    - Inertial fluid slosh simulation in liquid core responding to scroll and motion.
 *    - Sweeping studio caustics and specular highlights across glass and cap.
 */

let renderer = null;
let scene = null;
let camera = null;
let composer = null;
let bokehPass = null;

let bottleGroup = null;
let glassMesh = null;
let liquidMesh = null;
let capGroup = null;
let capMesh = null;
let capTopMesh = null;
let capBevelMesh = null;
let capMonogramMesh = null;
let neckRingMesh = null;
let labelMesh = null;
let contactShadow = null;
let particles = null;
let haloMesh = null;
let pedestalMesh = null;

// Lighting Rig
let keyLight = null;
let rimLight1 = null;
let rimLight2 = null;
let fillLight = null;
let baseGlowLight = null;
let ambientLight = null;

// Interaction & State
let canvasContainer = null;
let canvas = null;
let isInitialized = false;
let animationFrameId = null;

// Mouse Parallax (subtle, restrained)
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
const windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Current Variant & Transition State (Default: Signature Amber Cognac Quartz — Rich & Warm, NOT Whitish)
let activeVariantId = 'amber';
const currentVariantProps = {
  glassColor: new THREE.Color(0xffeedd),
  attenuationColor: new THREE.Color(0xd97724),
  attenuationDistance: 2.6,
  liquidColor: new THREE.Color(0x9e5210),
  liquidOpacity: 0.72,
  capColor: new THREE.Color(0xd4a359),
  capMetalness: 0.94,
  capRoughness: 0.20,
  haloColor: new THREE.Color(0xe89938),
};

const targetVariantProps = {
  glassColor: new THREE.Color(0xffeedd),
  attenuationColor: new THREE.Color(0xd97724),
  attenuationDistance: 2.6,
  liquidColor: new THREE.Color(0x9e5210),
  liquidOpacity: 0.72,
  capColor: new THREE.Color(0xd4a359),
  capMetalness: 0.94,
  capRoughness: 0.20,
  haloColor: new THREE.Color(0xe89938),
};

// Size scale
let currentSizeScale = 1.0;
let targetSizeScale = 1.0;

// Materials craft focus mode
let craftFocusOffset = new THREE.Vector3(0, 0, 0);
let craftFocusRotation = new THREE.Euler(0, 0, 0);
let targetCraftOffset = new THREE.Vector3(0, 0, 0);
let targetCraftRot = new THREE.Euler(0, 0, 0);

// Scroll tracking & velocity for dynamic DOF
let scrollProgress = 0;
let targetScrollProgress = 0;
let lastScrollProgress = 0;

// ---------------------------------------------------------------------------
// Procedural Textures (Knurling, Embossed Top Monogram, Silkscreen Typography)
// ---------------------------------------------------------------------------

function createKnurlingNormalMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);

  // Micro diamond relief
  const step = 8;
  for (let x = 0; x < size; x += step) {
    const grad = ctx.createLinearGradient(x, 0, x + step, 0);
    grad.addColorStop(0, '#6666ff');
    grad.addColorStop(0.5, '#c0c0ff');
    grad.addColorStop(1, '#8080ff');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, step, size);
  }

  ctx.strokeStyle = '#5a5aff';
  ctx.lineWidth = 1.5;
  for (let y = -size; y < size * 2; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y + size);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 4);
  return texture;
}

function createCapTopTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c1c20';
  ctx.fillRect(0, 0, size, size);

  // Concentric machined lathe rings
  ctx.lineWidth = 1.2;
  for (let r = 16; r < 240; r += 6) {
    ctx.strokeStyle = (r % 12 === 0) ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Laser-etched center AURA circular emblem
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(240, 235, 225, 0.85)';
  ctx.font = '600 36px "Cormorant Garamond", Georgia, serif';
  ctx.letterSpacing = '0.35em';
  ctx.fillText('AURA', 256, 256);

  ctx.strokeStyle = 'rgba(201, 168, 118, 0.7)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(256, 256, 92, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Dynamic high-definition silkscreen canvas for AURA branding
let labelCanvas = null;
let labelCtx = null;
let labelBumpCanvas = null;
let labelBumpCtx = null;
let labelTexture = null;
let labelBumpTexture = null;

function drawTrackedText(ctx, text, x, y, letterSpacingPx) {
  const chars = text.split('');
  let totalWidth = 0;
  const widths = chars.map((c) => {
    const w = ctx.measureText(c).width;
    totalWidth += w + letterSpacingPx;
    return w;
  });
  totalWidth -= letterSpacingPx;

  let currentX = x - totalWidth / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], currentX + widths[i] / 2, y);
    currentX += widths[i] + letterSpacingPx;
  }
}

function renderSilkscreenCanvas(variant) {
  if (!labelCanvas) {
    labelCanvas = document.createElement('canvas');
    labelCanvas.width = 2048;
    labelCanvas.height = 2048;
    labelCtx = labelCanvas.getContext('2d');
  }
  const ctx = labelCtx;
  ctx.clearRect(0, 0, 2048, 2048);

  const foilColor = (variant && variant.foilColor) || '#ffffff';
  const foilAccent = (variant && variant.foilAccent) || '#d4a359';
  const editionNum = (variant && variant.number) || '01';
  const editionName = (variant && variant.name ? variant.name.replace(/^\d+\.\s*AURA\s*/i, '') : 'COGNAC NECTAR').toUpperCase();

  // Cylindrical aspect ratio compensation
  ctx.save();
  ctx.translate(1024, 0);
  ctx.scale(0.74, 1.0);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Monumental Wordmark "A U R A" in BOLD, HIGH-CONTRAST VISIBILITY
  // Deep contrast background shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  // Ultra-bold high-impact typography
  ctx.font = '900 184px "Inter", "Cormorant Garamond", Georgia, sans-serif';

  // High-contrast deep outline to ensure letters pop over any liquid tint or background
  ctx.strokeStyle = 'rgba(10, 10, 14, 0.92)';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  const letters = ['A', 'U', 'R', 'A'];
  const offsets = [-245, -82, 82, 245];
  for (let i = 0; i < 4; i++) {
    ctx.strokeText(letters[i], offsets[i], 835);
  }

  // Brilliant metallic multi-stop gold/platinum foil gradient fill
  const textGrad = ctx.createLinearGradient(-320, 780, 320, 880);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.35, foilColor);
  textGrad.addColorStop(0.7, '#ffffff');
  textGrad.addColorStop(1, foilAccent);
  ctx.fillStyle = textGrad;

  for (let i = 0; i < 4; i++) {
    ctx.fillText(letters[i], offsets[i], 835);
  }

  // Crisp fine specular metallic perimeter pass
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 4; i++) {
    ctx.strokeText(letters[i], offsets[i], 835);
  }
  ctx.restore();

  // 2. Sub-mark: BOROSILICATE GLASS · FLAME POLISHED (Bold & Legible)
  ctx.font = '700 25px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.98;
  drawTrackedText(ctx, 'BOROSILICATE GLASS · FLAME POLISHED', 0, 932, 11);

  // 3. Fine Hairline Divider with Center Diamond Accent
  ctx.strokeStyle = foilAccent;
  ctx.lineWidth = 2.4;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.moveTo(-235, 972);
  ctx.lineTo(-44, 972);
  ctx.moveTo(44, 972);
  ctx.lineTo(235, 972);
  ctx.stroke();

  // Center diamond emblem
  ctx.fillStyle = foilAccent;
  ctx.beginPath();
  ctx.moveTo(0, 962);
  ctx.lineTo(10, 972);
  ctx.lineTo(0, 982);
  ctx.lineTo(-10, 972);
  ctx.closePath();
  ctx.fill();

  // 4. Bespoke Edition Number & Name (High Contrast)
  ctx.font = '700 23px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.96;
  drawTrackedText(ctx, `EDITION N° ${editionNum} · ${editionName}`, 0, 1018, 8);

  // 5. Origin & Volume Specification
  ctx.font = '600 19px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = foilAccent;
  ctx.globalAlpha = 0.92;
  drawTrackedText(ctx, 'COPENHAGEN DESIGN STUDIO · 500 ML', 0, 1060, 7);

  ctx.restore();

  // 6. Volumetric Fluid Calibration Lines on Flank (right side)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '600 19px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = foilAccent;
  ctx.lineWidth = 2.0;

  const graduations = [
    { y: 700, label: '500 ML' },
    { y: 820, label: '400 ML' },
    { y: 940, label: '300 ML' },
    { y: 1060, label: '200 ML' },
    { y: 1180, label: '100 ML' },
  ];

  for (const g of graduations) {
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(1580, g.y);
    ctx.lineTo(1615, g.y);
    ctx.stroke();

    ctx.globalAlpha = 0.92;
    ctx.fillText(g.label, 1628, g.y);
  }
  ctx.restore();
}

function renderSilkscreenBumpCanvas(variant) {
  if (!labelBumpCanvas) {
    labelBumpCanvas = document.createElement('canvas');
    labelBumpCanvas.width = 1024;
    labelBumpCanvas.height = 1024;
    labelBumpCtx = labelBumpCanvas.getContext('2d');
  }
  const ctx = labelBumpCtx;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 1024, 1024);

  // Raised tactile relief for grazing light specular catch
  ctx.save();
  ctx.translate(512, 0);
  ctx.scale(0.74, 1.0);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';

  ctx.font = '600 78px "Cormorant Garamond", Georgia, serif';
  const letters = ['A', 'U', 'R', 'A'];
  const offsets = [-122, -41, 41, 122];
  for (let i = 0; i < 4; i++) {
    ctx.fillText(letters[i], offsets[i], 418);
  }

  ctx.font = '500 12px "Inter", sans-serif';
  drawTrackedText(ctx, 'BOROSILICATE GLASS · FLAME POLISHED', 0, 465, 5);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-115, 485);
  ctx.lineTo(-22, 485);
  ctx.moveTo(22, 485);
  ctx.lineTo(115, 485);
  ctx.stroke();

  ctx.restore();
}

function createSilkscreenedLabelTexture() {
  const variant = findVariant(activeVariantId);
  renderSilkscreenCanvas(variant);
  labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.anisotropy = 16;
  labelTexture.generateMipmaps = true;
  return labelTexture;
}

function createSilkscreenBumpMap() {
  const variant = findVariant(activeVariantId);
  renderSilkscreenBumpCanvas(variant);
  labelBumpTexture = new THREE.CanvasTexture(labelBumpCanvas);
  labelBumpTexture.anisotropy = 8;
  return labelBumpTexture;
}

export function updateBottleSilkscreen(variantId) {
  const variant = findVariant(variantId);
  if (!variant) return;

  renderSilkscreenCanvas(variant);
  if (labelTexture) {
    labelTexture.needsUpdate = true;
  }

  renderSilkscreenBumpCanvas(variant);
  if (labelBumpTexture) {
    labelBumpTexture.needsUpdate = true;
  }
}

function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(256, 256, 12, 256, 256, 240);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  grad.addColorStop(0.18, 'rgba(0, 0, 0, 0.80)');
  grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.40)');
  grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return new THREE.CanvasTexture(canvas);
}

function createStudioEnvironment() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep obsidian luxury backdrop with subtle ambient grading
  const bg = ctx.createLinearGradient(0, 0, 0, 1024);
  bg.addColorStop(0, '#0a0a0d');
  bg.addColorStop(0.5, '#121217');
  bg.addColorStop(1, '#050508');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 2048, 1024);

  // 1. Left studio softbox bank (Cool 5600K high-contrast key rim)
  const leftSoftbox = ctx.createLinearGradient(320, 0, 640, 0);
  leftSoftbox.addColorStop(0, 'rgba(0,0,0,0)');
  leftSoftbox.addColorStop(0.35, 'rgba(242, 247, 255, 0.96)');
  leftSoftbox.addColorStop(0.55, 'rgba(255, 255, 255, 1.0)');
  leftSoftbox.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = leftSoftbox;
  ctx.fillRect(320, 80, 320, 860);

  // 2. Right warm champagne rim softbox (Warm 3200K luxury raking light)
  const rightSoftbox = ctx.createLinearGradient(1440, 0, 1760, 0);
  rightSoftbox.addColorStop(0, 'rgba(0,0,0,0)');
  rightSoftbox.addColorStop(0.35, 'rgba(209, 174, 125, 0.92)');
  rightSoftbox.addColorStop(0.60, 'rgba(248, 226, 185, 1.0)');
  rightSoftbox.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rightSoftbox;
  ctx.fillRect(1440, 100, 320, 820);

  // 3. Overhead ceiling diffuser
  const topLight = ctx.createRadialGradient(1024, 160, 40, 1024, 160, 480);
  topLight.addColorStop(0, 'rgba(255, 255, 255, 0.90)');
  topLight.addColorStop(0.4, 'rgba(235, 226, 212, 0.35)');
  topLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topLight;
  ctx.fillRect(400, 0, 1248, 400);

  // 4. Floor studio reflection strip
  const floorGleam = ctx.createRadialGradient(1024, 980, 20, 1024, 980, 500);
  floorGleam.addColorStop(0, 'rgba(201, 168, 118, 0.25)');
  floorGleam.addColorStop(0.5, 'rgba(240, 240, 255, 0.08)');
  floorGleam.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = floorGleam;
  ctx.fillRect(300, 780, 1448, 244);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

// ---------------------------------------------------------------------------
// 3D Model Construction: Premium Borosilicate Glass & Precision Closure
// ---------------------------------------------------------------------------

function buildAuraBottle() {
  bottleGroup = new THREE.Group();
  bottleGroup.name = 'AuraBottle';

  // 1. OUTER BOROSILICATE GLASS VESSEL
  // Sculpted Architectural Silhouette:
  // - Solid weighted crystal punt base with concave dome underneath
  // - 1.5° subtle architectural taper along body
  // - Softly radiused shoulder curve
  // - Sculpted glass collar ring & flame-polished lip
  const points = [];
  const segments = 80;

  // Solid Crystal Punt Base (Indented dome underneath)
  points.push(new THREE.Vector2(0.001, -1.14));  // punt center apex
  points.push(new THREE.Vector2(0.18, -1.18));
  points.push(new THREE.Vector2(0.35, -1.24));
  points.push(new THREE.Vector2(0.50, -1.25));   // outer contact ring
  points.push(new THREE.Vector2(0.55, -1.24));
  points.push(new THREE.Vector2(0.575, -1.20));  // beveled foot chamfer
  points.push(new THREE.Vector2(0.58, -1.12));

  // Architectural cylindrical body (imperceptible subtle elegant taper)
  points.push(new THREE.Vector2(0.575, -0.40));
  points.push(new THREE.Vector2(0.56, 0.15));
  points.push(new THREE.Vector2(0.545, 0.42));

  // Soft radiused shoulder
  points.push(new THREE.Vector2(0.53, 0.54));
  points.push(new THREE.Vector2(0.48, 0.66));
  points.push(new THREE.Vector2(0.40, 0.78));
  points.push(new THREE.Vector2(0.31, 0.88));

  // Glass collar ring & neck
  points.push(new THREE.Vector2(0.28, 0.94));
  points.push(new THREE.Vector2(0.27, 1.04));
  points.push(new THREE.Vector2(0.26, 1.18));

  // Flame-polished lip curving inward under cap
  points.push(new THREE.Vector2(0.285, 1.22));
  points.push(new THREE.Vector2(0.27, 1.25));
  points.push(new THREE.Vector2(0.24, 1.25));
  points.push(new THREE.Vector2(0.23, 1.20));
  points.push(new THREE.Vector2(0.22, 1.12));

  const latheGeo = new THREE.LatheGeometry(points, segments);
  latheGeo.computeVertexNormals();

  // Premium Physical Glass Material: Luminous, crystal borosilicate with rich caustic depth (no flat/whitish tint)
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: currentVariantProps.glassColor.clone(),
    metalness: 0.05,
    roughness: 0.038,
    transmission: 0.92,
    thickness: 1.15,
    ior: 1.54, // Borosilicate crystal IOR
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
    envMapIntensity: 2.6,
    transparent: true,
    opacity: 1.0,
    attenuationColor: currentVariantProps.attenuationColor.clone(),
    attenuationDistance: currentVariantProps.attenuationDistance,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  glassMesh = new THREE.Mesh(latheGeo, glassMaterial);
  glassMesh.castShadow = true;
  glassMesh.receiveShadow = true;
  glassMesh.renderOrder = 2;
  bottleGroup.add(glassMesh);

  // 2. INNER LIQUID / HYDRATION CORE
  const liquidPoints = [];
  liquidPoints.push(new THREE.Vector2(0.001, -1.13));
  liquidPoints.push(new THREE.Vector2(0.49, -1.13));
  liquidPoints.push(new THREE.Vector2(0.49, 0.40));
  liquidPoints.push(new THREE.Vector2(0.47, 0.415));
  liquidPoints.push(new THREE.Vector2(0.001, 0.405));

  const liquidGeo = new THREE.LatheGeometry(liquidPoints, 64);
  liquidGeo.computeVertexNormals();

  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: currentVariantProps.liquidColor.clone(),
    roughness: 0.025,
    transmission: 0.82,
    thickness: 0.7,
    ior: 1.333, // Fluid refraction
    transparent: true,
    opacity: currentVariantProps.liquidOpacity,
    attenuationColor: currentVariantProps.attenuationColor.clone(),
    attenuationDistance: 2.2,
    depthWrite: false,
  });

  liquidMesh = new THREE.Mesh(liquidGeo, liquidMaterial);
  liquidMesh.renderOrder = 1;
  bottleGroup.add(liquidMesh);

  // 3. MACHINED ALUMINUM CLOSURE (Precision Turned)
  capGroup = new THREE.Group();
  capGroup.name = 'AuraCap';

  const knurlNormalMap = createKnurlingNormalMap();
  const capTopTex = createCapTopTexture();

  // Knurled grip band material
  const knurlCapMat = new THREE.MeshStandardMaterial({
    color: currentVariantProps.capColor.clone(),
    metalness: currentVariantProps.capMetalness,
    roughness: currentVariantProps.capRoughness,
    normalMap: knurlNormalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    envMapIntensity: 1.8,
  });

  // Smooth brushed chamfer & rim material
  const smoothCapMat = new THREE.MeshStandardMaterial({
    color: currentVariantProps.capColor.clone(),
    metalness: currentVariantProps.capMetalness,
    roughness: 0.16,
    envMapIntensity: 2.0,
  });

  // Top plate with concentric grooves & monogram
  const topPlateMat = new THREE.MeshStandardMaterial({
    color: currentVariantProps.capColor.clone(),
    metalness: currentVariantProps.capMetalness,
    roughness: 0.20,
    map: capTopTex,
    envMapIntensity: 1.8,
  });

  // Main knurled body
  const capCylGeo = new THREE.CylinderGeometry(0.305, 0.305, 0.26, 64, 1, true);
  capMesh = new THREE.Mesh(capCylGeo, knurlCapMat);
  capMesh.position.y = 1.13;
  capMesh.castShadow = true;
  capMesh.renderOrder = 4;
  capGroup.add(capMesh);

  // Top chamfer bevel
  const capTopGeo = new THREE.CylinderGeometry(0.285, 0.305, 0.045, 64);
  capTopMesh = new THREE.Mesh(capTopGeo, smoothCapMat);
  capTopMesh.position.y = 1.28;
  capTopMesh.renderOrder = 4;
  capGroup.add(capTopMesh);

  // Top recessed monogram disk
  const monogramGeo = new THREE.CircleGeometry(0.28, 48);
  capMonogramMesh = new THREE.Mesh(monogramGeo, topPlateMat);
  capMonogramMesh.rotation.x = -Math.PI / 2;
  capMonogramMesh.position.y = 1.303;
  capMonogramMesh.renderOrder = 4;
  capGroup.add(capMonogramMesh);

  // Bottom machined ring bevel
  const capBottomRingGeo = new THREE.TorusGeometry(0.30, 0.012, 16, 64);
  capBevelMesh = new THREE.Mesh(capBottomRingGeo, smoothCapMat);
  capBevelMesh.rotation.x = Math.PI / 2;
  capBevelMesh.position.y = 0.995;
  capBevelMesh.renderOrder = 4;
  capGroup.add(capBevelMesh);

  // Discreet silicone seal lip between cap and neck
  const sealRingGeo = new THREE.TorusGeometry(0.275, 0.008, 12, 48);
  const sealMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1e,
    roughness: 0.65,
    metalness: 0.1,
  });
  neckRingMesh = new THREE.Mesh(sealRingGeo, sealMat);
  neckRingMesh.rotation.x = Math.PI / 2;
  neckRingMesh.position.y = 0.985;
  neckRingMesh.renderOrder = 4;
  capGroup.add(neckRingMesh);

  bottleGroup.add(capGroup);

  // 4. PRINTED "AURA" SILKSCREENED BRANDING (Physically fused onto glass)
  const labelTex = createSilkscreenedLabelTexture();
  const labelBump = createSilkscreenBumpMap();
  const labelGeo = new THREE.CylinderGeometry(0.552, 0.574, 0.88, 64, 1, true, -Math.PI / 3.0, (2 * Math.PI) / 3.0);
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    bumpMap: labelBump,
    bumpScale: 0.02,
    transparent: true,
    opacity: 0.98,
    roughness: 0.20,
    metalness: 0.12,
    side: THREE.FrontSide,
    depthWrite: false,
  });

  labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.y = -0.05;
  labelMesh.renderOrder = 3;
  bottleGroup.add(labelMesh);

  // 5. GROUND CONTACT SHADOW & PEDESTAL
  const shadowGeo = new THREE.PlaneGeometry(3.8, 3.8);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });

  contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -1.255;
  contactShadow.renderOrder = 0;
  bottleGroup.add(contactShadow);

  // Subtle dark slate pedestal disk beneath the bottle
  const pedestalGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.04, 64);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c10,
    metalness: 0.4,
    roughness: 0.45,
    envMapIntensity: 0.8,
  });
  pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestalMesh.position.y = -1.28;
  pedestalMesh.receiveShadow = true;
  pedestalMesh.renderOrder = 0;
  bottleGroup.add(pedestalMesh);

  // 6. ATMOSPHERIC RADIANCE HALO
  const haloGeo = new THREE.PlaneGeometry(5.2, 5.2);
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 256;
  haloCanvas.height = 256;
  const hCtx = haloCanvas.getContext('2d');
  const hGrad = hCtx.createRadialGradient(128, 128, 12, 128, 128, 128);
  hGrad.addColorStop(0, 'rgba(201, 168, 118, 0.35)');
  hGrad.addColorStop(0.5, 'rgba(201, 168, 118, 0.10)');
  hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  hCtx.fillStyle = hGrad;
  hCtx.fillRect(0, 0, 256, 256);

  const haloMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(haloCanvas),
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.position.set(0, 0.1, -0.6);
  bottleGroup.add(haloMesh);

  return bottleGroup;
}

// ---------------------------------------------------------------------------
// Atmospheric Dust Particles (Subtle floating light motes)
// ---------------------------------------------------------------------------

function buildAtmosphericParticles() {
  const count = 70;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 8.0;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0 - 0.5;
    speeds[i] = Math.random() * 0.35 + 0.15;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const pCanvas = document.createElement('canvas');
  pCanvas.width = 64;
  pCanvas.height = 64;
  const pCtx = pCanvas.getContext('2d');
  const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  pGrad.addColorStop(0, 'rgba(248, 240, 226, 0.95)');
  pGrad.addColorStop(0.4, 'rgba(201, 168, 118, 0.40)');
  pGrad.addColorStop(1, 'rgba(201, 168, 118, 0)');
  pCtx.fillStyle = pGrad;
  pCtx.fillRect(0, 0, 64, 64);

  const pTexture = new THREE.CanvasTexture(pCanvas);

  const material = new THREE.PointsMaterial({
    map: pTexture,
    size: 0.09,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  particles = new THREE.Points(geometry, material);
  particles.userData = { speeds, originalPositions: new Float32Array(positions) };
  return particles;
}

// ---------------------------------------------------------------------------
// 11 Balanced, Stable Keyframes Across the Full Journey
//
// Key Requirements Met:
// 1. Camera distance Z is locked at ~6.4 (SAFE, STABLE DISTANCE).
// 2. FOV is locked at 32 (NO AGGRESSIVE ZOOMING).
// 3. Entire bottle is clearly visible from top to bottom with comfortable margin.
// 4. Bottle is the quiet visual anchor throughout the experience.
// ---------------------------------------------------------------------------

const SCENE_KEYFRAMES = [
  // 0. Hero / Cinematic Opening (Centered, calm, comfortable breathing room)
  {
    id: 'hero',
    bottlePos: new THREE.Vector3(0, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.18, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0, 0.0, 0),
    keyLight: 2.3,
    rimLight1: 3.2,
    rimLight2: 1.8,
    ambient: 0.65,
    haloOpacity: 0.0,
  },
  // 1. AURA Product Introduction (Gently positioned on right of intro card)
  {
    id: 'intro',
    bottlePos: new THREE.Vector3(0.55, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.32, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0.18, 0.0, 0),
    keyLight: 2.4,
    rimLight1: 3.2,
    rimLight2: 1.8,
    ambient: 0.6,
    haloOpacity: 0.0,
  },
  // 2. Product Design / Silhouette (Centered with clean architectural framing)
  {
    id: 'design',
    bottlePos: new THREE.Vector3(0, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.48, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0, 0.0, 0),
    keyLight: 2.6,
    rimLight1: 3.6,
    rimLight2: 2.0,
    ambient: 0.6,
    haloOpacity: 0.0,
  },
  // 3. Materials & Craft (Resting on right, lighting highlights glass, cap, and punt)
  {
    id: 'materials',
    bottlePos: new THREE.Vector3(0.55, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.65, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0.18, 0.0, 0),
    keyLight: 2.8,
    rimLight1: 3.8,
    rimLight2: 2.2,
    ambient: 0.55,
    haloOpacity: 0.0,
  },
  // 4. The AURA Story / Origin (Resting on left, leaving space for story card)
  {
    id: 'story',
    bottlePos: new THREE.Vector3(-0.55, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.25, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(-0.18, 0.0, 0),
    keyLight: 2.4,
    rimLight1: 3.2,
    rimLight2: 1.8,
    ambient: 0.65,
    haloOpacity: 0.0,
  },
  // 5. Brand Philosophy (Centered monumental letterbox framing)
  {
    id: 'philosophy',
    bottlePos: new THREE.Vector3(0, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.20, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0, 0.0, 0),
    keyLight: 2.0,
    rimLight1: 4.2,
    rimLight2: 2.6,
    ambient: 0.5,
    haloOpacity: 0.15,
  },
  // 6. Product Atmosphere & Daily Ritual (Centered, glowing aura, motes)
  {
    id: 'atmosphere',
    bottlePos: new THREE.Vector3(0, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.40, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0, 0.0, 0),
    keyLight: 2.0,
    rimLight1: 3.8,
    rimLight2: 2.4,
    ambient: 0.7,
    haloOpacity: 0.55,
  },
  // 7. Full Collection Showcase (Resting on right, dynamic variant morphing)
  {
    id: 'collection',
    bottlePos: new THREE.Vector3(0.50, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.35, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0.15, 0.0, 0),
    keyLight: 2.6,
    rimLight1: 3.6,
    rimLight2: 2.2,
    ambient: 0.65,
    haloOpacity: 0.35,
  },
  // 8. Final Product Focus / Monument (Centered, pure form)
  {
    id: 'monument',
    bottlePos: new THREE.Vector3(0, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.30, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0, 0.0, 0),
    keyLight: 2.5,
    rimLight1: 3.8,
    rimLight2: 2.2,
    ambient: 0.65,
    haloOpacity: 0.30,
  },
  // 9. Grand Final Call to Action ("Your signature, bottled.")
  {
    id: 'cta-final',
    bottlePos: new THREE.Vector3(0, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.22, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(0, 0.0, 0),
    keyLight: 2.8,
    rimLight1: 4.2,
    rimLight2: 2.4,
    ambient: 0.6,
    haloOpacity: 0.45,
  },
  // 10. Acquisition Configurator (Resting on left, leaving space for panel)
  {
    id: 'shop',
    bottlePos: new THREE.Vector3(-0.55, -0.05, 0),
    bottleRot: new THREE.Euler(0.02, 0.32, 0),
    camPos: new THREE.Vector3(0, 0.05, 6.4),
    lookAt: new THREE.Vector3(-0.18, 0.0, 0),
    keyLight: 2.5,
    rimLight1: 3.4,
    rimLight2: 2.0,
    ambient: 0.65,
    haloOpacity: 0.1,
  },
];

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

export function init3DExperience(containerId = 'aura-canvas-container') {
  if (isInitialized) return;

  canvasContainer = document.getElementById(containerId);
  if (!canvasContainer) {
    canvasContainer = document.createElement('div');
    canvasContainer.id = containerId;
    canvasContainer.className = 'aura-canvas-container';
    document.body.prepend(canvasContainer);
  }

  canvas = document.createElement('canvas');
  canvas.id = 'aura-webgl-canvas';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvasContainer.appendChild(canvas);

  // 1. WebGL Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
  });

  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 2. Scene with PMREM Prefiltered Studio Radiance
  scene = new THREE.Scene();
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();
  const envTex = createStudioEnvironment();
  const envRenderTarget = pmremGen.fromEquirectangular(envTex);
  scene.environment = envRenderTarget.texture;
  pmremGen.dispose();
  envTex.dispose();

  // 3. Camera with SAFE distance (FOV 32, Z 6.4)
  camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 25);
  camera.position.set(0, 0.05, 6.4);
  scene.add(camera);

  // 4. Multi-zone Luxury Studio Lighting Rig
  // Key softbox
  keyLight = new THREE.DirectionalLight(0xfff8f0, 2.6);
  keyLight.position.set(3.5, 5.0, 4.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.bias = -0.0002;
  scene.add(keyLight);

  // Left warm rim light
  rimLight1 = new THREE.DirectionalLight(0xf2e0cb, 3.8);
  rimLight1.position.set(-4.5, 3.5, -3.5);
  scene.add(rimLight1);

  // Right cool rim light
  rimLight2 = new THREE.DirectionalLight(0xc8ddf0, 2.6);
  rimLight2.position.set(4.0, 1.5, -2.5);
  scene.add(rimLight2);

  // Dedicated Glass Backlight / Trans-illumination Light (essential for luxury glassware)
  const backTransLight = new THREE.DirectionalLight(0xffffff, 4.2);
  backTransLight.position.set(0, 0.5, -4.5);
  scene.add(backTransLight);

  fillLight = new THREE.DirectionalLight(0xdde6f2, 1.2);
  fillLight.position.set(-1.5, 2.0, 5.0);
  scene.add(fillLight);

  baseGlowLight = new THREE.PointLight(0xd4b47d, 2.0, 4.5);
  baseGlowLight.position.set(0, -1.15, 0.5);
  scene.add(baseGlowLight);

  ambientLight = new THREE.AmbientLight(0x282834, 0.95);
  scene.add(ambientLight);

  // 5. Build Bottle & Atmospheric Dust Motes
  buildAuraBottle();
  scene.add(bottleGroup);

  buildAtmosphericParticles();
  scene.add(particles);

  // 6. Postprocessing Pipeline for Dynamic Cinematic Depth-of-Field (DOF)
  try {
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    bokehPass = new BokehPass(scene, camera, {
      focus: 6.4,
      aperture: 0.020,
      maxblur: 0.015,
      width: width,
      height: height,
    });
    composer.addPass(bokehPass);
  } catch (err) {
    console.warn('[AURA 3D] Depth of field BokehPass fallback:', err);
    composer = null;
  }

  // 7. Event Listeners (Natural mouse parallax & scroll tracking, without forced click-drag)
  window.addEventListener('resize', onWindowResize, { passive: true });
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  // 8. Re-render label texture when webfonts are ready
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready.then(() => {
      updateBottleSilkscreen(activeVariantId);
    });
  }

  isInitialized = true;

  onScroll();
  animate(0);

  console.log('[AURA 3D] Real-time luxury bottle engine running stably with dynamic DOF.');
}

let isPointerDown = false;
let startPointerX = 0;
let baseDragAngle = 0;

function onPointerDown(e) {
  if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a') || e.target.closest('input'))) return;
  isPointerDown = true;
  startPointerX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  baseDragAngle = targetDragRotY;
}

function onPointerDragMove(e) {
  if (!isPointerDown) return;
  const currentX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const diffX = currentX - startPointerX;
  targetDragRotY = baseDragAngle + (diffX / window.innerWidth) * (Math.PI * 2.2);
}

function onPointerUp() {
  isPointerDown = false;
}

// ---------------------------------------------------------------------------
// Window Resize & Responsive Framing
// ---------------------------------------------------------------------------

function onWindowResize() {
  if (!renderer || !camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  windowHalf.x = width / 2;
  windowHalf.y = height / 2;

  camera.aspect = width / height;

  // Responsive FOV keeping full bottle comfortably in view
  if (width < 600) {
    camera.fov = 36;
  } else if (width < 900) {
    camera.fov = 34;
  } else {
    camera.fov = 32;
  }
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  if (composer) {
    composer.setSize(width, height);
  }
  if (bokehPass && bokehPass.uniforms && bokehPass.uniforms['aspect']) {
    bokehPass.uniforms['aspect'].value = width / height;
  }
}

function onMouseMove(e) {
  // Gentle, restrained mouse parallax
  mouse.targetX = (e.clientX - windowHalf.x) / windowHalf.x;
  mouse.targetY = (e.clientY - windowHalf.y) / windowHalf.y;
}

// ---------------------------------------------------------------------------
// Scroll Tracking Across the 11 Cinematic Sections
// ---------------------------------------------------------------------------

function onScroll() {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const windowH = window.innerHeight || 800;
  const viewCenter = scrollY + windowH * 0.5;

  const sectionIds = [
    'hero',
    'intro',
    'design',
    'materials',
    'story',
    'philosophy',
    'atmosphere',
    'collection',
    'monument',
    'cta-final',
    'shop',
  ];

  let activeIndex = 0;
  let fraction = 0;

  for (let i = 0; i < sectionIds.length; i++) {
    const el = document.getElementById(sectionIds[i]);
    if (!el) continue;
    const top = el.offsetTop;
    const height = el.offsetHeight || 1;
    const bottom = top + height;

    if (viewCenter >= top && viewCenter <= bottom) {
      activeIndex = i;
      fraction = height > 0 ? (viewCenter - top) / height : 0;
      break;
    } else if (viewCenter < top && i === 0) {
      activeIndex = 0;
      fraction = 0;
      break;
    } else if (i === sectionIds.length - 1 && viewCenter > bottom) {
      activeIndex = Math.max(0, sectionIds.length - 2);
      fraction = 1.0;
      break;
    }
  }

  const rawProgress = activeIndex + (Number.isFinite(fraction) ? fraction : 0);
  const maxIdx = Math.max(0, SCENE_KEYFRAMES.length - 1);
  targetScrollProgress = Math.max(0, Math.min(maxIdx, Number.isFinite(rawProgress) ? rawProgress : 0));
}

// ---------------------------------------------------------------------------
// Collection Variant Transitioning
// ---------------------------------------------------------------------------

export function setCollectionVariant(variantId) {
  const variant = findVariant(variantId);
  if (!variant) return;

  activeVariantId = variantId;

  targetVariantProps.glassColor = new THREE.Color(variant.glassColor);
  targetVariantProps.attenuationColor = new THREE.Color(variant.attenuationColor);
  targetVariantProps.attenuationDistance = variant.attenuationDistance;
  targetVariantProps.liquidColor = new THREE.Color(variant.liquidColor);
  targetVariantProps.liquidOpacity = variant.liquidOpacity;
  targetVariantProps.capColor = new THREE.Color(variant.capColor);
  targetVariantProps.capMetalness = variant.capMetalness;
  targetVariantProps.capRoughness = variant.capRoughness;
  targetVariantProps.haloColor = new THREE.Color(variant.haloColor);

  // Dynamically redraw silkscreen with specific edition number, name, and metallic foil tone
  updateBottleSilkscreen(variantId);
}

// ---------------------------------------------------------------------------
// Camera Modes & Cinematic Director Presets
// ---------------------------------------------------------------------------

let activeCameraMode = 'default';
let isTurntableActive = false;
let turntableAngle = 0;
let userDragRotY = 0;
let targetDragRotY = 0;
let activeLightingMood = 'studio';

export function setCameraMode(modeId) {
  activeCameraMode = modeId;
  if (modeId === 'label') {
    // Macro close-up on the monumental AURA branding
    targetCraftOffset.set(0, 0.05, 0.72);
    targetCraftRot.set(0.01, 0.06, 0);
  } else if (modeId === 'cap') {
    // Close-up angled view on knurled billet closure and laser monogram
    targetCraftOffset.set(0, -0.26, 0.58);
    targetCraftRot.set(-0.24, 0.32, 0);
  } else if (modeId === 'base') {
    // Low caustics angle looking up through the thick crystal punt
    targetCraftOffset.set(0, 0.32, 0.60);
    targetCraftRot.set(0.22, 0.28, 0);
  } else if (modeId === 'orbit') {
    // Continuous 360 cinematic turntable
    targetCraftOffset.set(0, 0, 0.15);
    targetCraftRot.set(0, 0, 0);
    isTurntableActive = true;
  } else {
    // Default scroll-driven narrative mode
    targetCraftOffset.set(0, 0, 0);
    targetCraftRot.set(0, 0, 0);
    isTurntableActive = false;
  }
}

export function toggleTurntable(force) {
  isTurntableActive = typeof force === 'boolean' ? force : !isTurntableActive;
  return isTurntableActive;
}

export function setLightingMood(moodId) {
  activeLightingMood = moodId;
  if (!keyLight || !rimLight1 || !rimLight2) return;

  if (moodId === 'midnight') {
    // High-contrast theatrical movie spotlight
    keyLight.color.setHex(0xe8eefa);
    keyLight.intensity = 3.6;
    rimLight1.color.setHex(0x94b4e8);
    rimLight1.intensity = 3.0;
    rimLight2.color.setHex(0x6078a0);
    rimLight2.intensity = 1.8;
  } else if (moodId === 'golden') {
    // Warm 2700K sunset raking caustics
    keyLight.color.setHex(0xffe2b8);
    keyLight.intensity = 3.8;
    rimLight1.color.setHex(0xf5b058);
    rimLight1.intensity = 3.4;
    rimLight2.color.setHex(0xdb7832);
    rimLight2.intensity = 2.2;
  } else {
    // Architectural Nordic crisp gallery light (default)
    keyLight.color.setHex(0xfff8f0);
    keyLight.intensity = 2.6;
    rimLight1.color.setHex(0xf2e0cb);
    rimLight1.intensity = 3.8;
    rimLight2.color.setHex(0xc8ddf0);
    rimLight2.intensity = 2.6;
  }
}

// ---------------------------------------------------------------------------
// Craft Inspection Focus (for Materials Section)
// ---------------------------------------------------------------------------

export function setCraftFocus(focusId) {
  if (focusId === 'cap') {
    targetCraftOffset.set(0, -0.22, 0);
    targetCraftRot.set(-0.06, 0.45, 0);
  } else if (focusId === 'label') {
    targetCraftOffset.set(0, 0.05, 0);
    targetCraftRot.set(0.01, 0.12, 0);
  } else if (focusId === 'base') {
    targetCraftOffset.set(0, 0.28, 0);
    targetCraftRot.set(0.10, 0.35, 0);
  } else {
    targetCraftOffset.set(0, 0, 0);
    targetCraftRot.set(0, 0, 0);
  }
}

// ---------------------------------------------------------------------------
// Configurator Controls (Finish & Size)
// ---------------------------------------------------------------------------

export function setBottleFinish(finishId) {
  const finishMap = {
    onyx: { color: 0x18181b, metalness: 0.92, roughness: 0.26 },
    champagne: { color: 0xc9a876, metalness: 0.94, roughness: 0.22 },
    graphite: { color: 0x5a5c63, metalness: 0.90, roughness: 0.24 },
  };
  const props = finishMap[finishId];
  if (!props) return;

  targetVariantProps.capColor = new THREE.Color(props.color);
  targetVariantProps.capMetalness = props.metalness;
  targetVariantProps.capRoughness = props.roughness;

  if (baseGlowLight) {
    if (finishId === 'champagne') baseGlowLight.color.setHex(0xc9a876);
    else if (finishId === 'onyx') baseGlowLight.color.setHex(0x8a8a9a);
    else baseGlowLight.color.setHex(0xaaaaaa);
  }
}

export function setBottleSize(sizeId) {
  if (sizeId === '500') targetSizeScale = 1.0;
  else if (sizeId === '750') targetSizeScale = 1.05;
  else if (sizeId === '1000') targetSizeScale = 1.10;
}

// ---------------------------------------------------------------------------
// Render & Animation Loop
// ---------------------------------------------------------------------------

let lastTime = 0;

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function animate(currentTime) {
  animationFrameId = requestAnimationFrame(animate);

  const delta = Math.min((currentTime - lastTime) * 0.001, 0.1);
  lastTime = currentTime;

  // 1. Smooth scroll progress interpolation with finite checks
  if (!Number.isFinite(targetScrollProgress)) {
    targetScrollProgress = 0;
  }
  if (!Number.isFinite(scrollProgress)) {
    scrollProgress = targetScrollProgress;
  }
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;
  if (!Number.isFinite(scrollProgress)) {
    scrollProgress = 0;
  }

  // Scroll velocity tracking for dynamic cinematic DOF
  const scrollDelta = Math.abs(scrollProgress - lastScrollProgress);
  lastScrollProgress = scrollProgress;

  // 2. Gentle mouse interpolation
  mouse.x += (mouse.targetX - mouse.x) * 0.04;
  mouse.y += (mouse.targetY - mouse.y) * 0.04;

  // 3. Size scaling & craft focus interpolation
  currentSizeScale += (targetSizeScale - currentSizeScale) * 0.06;
  craftFocusOffset.lerp(targetCraftOffset, 0.08);
  craftFocusRotation.x += (targetCraftRot.x - craftFocusRotation.x) * 0.08;
  craftFocusRotation.y += (targetCraftRot.y - craftFocusRotation.y) * 0.08;

  // 4. Smooth Variant Material Transition (Color Lerping)
  const morphSpeed = 0.07;
  currentVariantProps.glassColor.lerp(targetVariantProps.glassColor, morphSpeed);
  currentVariantProps.attenuationColor.lerp(targetVariantProps.attenuationColor, morphSpeed);
  currentVariantProps.attenuationDistance += (targetVariantProps.attenuationDistance - currentVariantProps.attenuationDistance) * morphSpeed;
  currentVariantProps.liquidColor.lerp(targetVariantProps.liquidColor, morphSpeed);
  currentVariantProps.liquidOpacity += (targetVariantProps.liquidOpacity - currentVariantProps.liquidOpacity) * morphSpeed;
  currentVariantProps.capColor.lerp(targetVariantProps.capColor, morphSpeed);
  currentVariantProps.capMetalness += (targetVariantProps.capMetalness - currentVariantProps.capMetalness) * morphSpeed;
  currentVariantProps.capRoughness += (targetVariantProps.capRoughness - currentVariantProps.capRoughness) * morphSpeed;
  currentVariantProps.haloColor.lerp(targetVariantProps.haloColor, morphSpeed);

  // Apply to meshes
  if (glassMesh && glassMesh.material) {
    glassMesh.material.color.copy(currentVariantProps.glassColor);
    glassMesh.material.attenuationColor.copy(currentVariantProps.attenuationColor);
    glassMesh.material.attenuationDistance = currentVariantProps.attenuationDistance;
  }

  if (liquidMesh && liquidMesh.material) {
    liquidMesh.material.color.copy(currentVariantProps.liquidColor);
    liquidMesh.material.attenuationColor.copy(currentVariantProps.attenuationColor);
    liquidMesh.material.opacity = currentVariantProps.liquidOpacity;
  }

  if (capMesh && capMesh.material) {
    capMesh.material.color.copy(currentVariantProps.capColor);
    capMesh.material.metalness = currentVariantProps.capMetalness;
    capMesh.material.roughness = currentVariantProps.capRoughness;
  }

  if (capTopMesh && capTopMesh.material) {
    capTopMesh.material.color.copy(currentVariantProps.capColor);
    capTopMesh.material.metalness = currentVariantProps.capMetalness;
  }

  if (capBevelMesh && capBevelMesh.material) {
    capBevelMesh.material.color.copy(currentVariantProps.capColor);
    capBevelMesh.material.metalness = currentVariantProps.capMetalness;
  }

  if (capMonogramMesh && capMonogramMesh.material) {
    capMonogramMesh.material.color.copy(currentVariantProps.capColor);
  }

  if (baseGlowLight) {
    baseGlowLight.color.copy(currentVariantProps.haloColor);
  }

  // 5. Keyframe interpolation with guaranteed bounds
  const totalFrames = SCENE_KEYFRAMES.length;
  const safeProgress = Math.max(0, Math.min(totalFrames - 1, scrollProgress));
  const baseIndex = Math.max(0, Math.min(totalFrames - 2, Math.floor(safeProgress)));
  const nextIndex = Math.min(totalFrames - 1, baseIndex + 1);
  const progressRatio = Math.max(0, Math.min(1, safeProgress - baseIndex));
  const t = smoothstep(0, 1, progressRatio);

  const kf1 = SCENE_KEYFRAMES[baseIndex] || SCENE_KEYFRAMES[0];
  const kf2 = SCENE_KEYFRAMES[nextIndex] || kf1;

  // Camera & Bottle transforms (STABLE, SAFE, NO CROPPING)
  const currentBottlePos = new THREE.Vector3().lerpVectors(kf1.bottlePos, kf2.bottlePos, t);
  const currentCamPos = new THREE.Vector3().lerpVectors(kf1.camPos, kf2.camPos, t);
  const currentLookAt = new THREE.Vector3().lerpVectors(kf1.lookAt, kf2.lookAt, t);

  const q1 = new THREE.Quaternion().setFromEuler(kf1.bottleRot);
  const q2 = new THREE.Quaternion().setFromEuler(kf2.bottleRot);
  const currentQuat = new THREE.Quaternion().slerpQuaternions(q1, q2, t);

  // Autonomous living presence (no manual dragging required to enjoy the product!)
  const livingTime = currentTime * 0.001;
  const livingFloatY = Math.sin(livingTime * 1.3) * 0.016 + Math.sin(livingTime * 0.6) * 0.010;
  const livingTiltX = Math.cos(livingTime * 0.8) * 0.018;
  const livingTiltZ = Math.sin(livingTime * 0.95) * 0.015;
  // Majestic continuous slow panning drift (reveals glass refraction and reflections autonomously)
  const livingAutoPanY = Math.sin(livingTime * 0.35) * 0.12 + Math.sin(livingTime * 0.18) * 0.06;

  // Fluid inertia & wave sloshing in the liquid core
  if (liquidMesh) {
    const sloshImpulse = scrollDelta * 10.0 + mouse.x * 0.06;
    const waveMeniscus = Math.sin(livingTime * 3.8) * (0.014 + Math.min(sloshImpulse * 0.06, 0.05));
    liquidMesh.rotation.z = livingTiltZ * 0.7 + waveMeniscus;
    liquidMesh.rotation.x = livingTiltX * 0.7;
    liquidMesh.position.y = Math.sin(livingTime * 2.8) * 0.004;
  }

  // Restrained mouse parallax
  const parallaxX = mouse.x * 0.035;
  const parallaxY = -mouse.y * 0.025;
  const rotParallaxY = mouse.x * 0.05;
  const rotParallaxX = mouse.y * 0.03;

  // Smooth drag interpolation
  userDragRotY += (targetDragRotY - userDragRotY) * 0.08;

  // Cinematic 360 turntable
  if (isTurntableActive) {
    turntableAngle += delta * 0.5;
  }

  if (bottleGroup) {
    bottleGroup.position.copy(currentBottlePos);
    bottleGroup.position.x += parallaxX + craftFocusOffset.x;
    bottleGroup.position.y += livingFloatY + parallaxY + craftFocusOffset.y;
    bottleGroup.position.z += craftFocusOffset.z;

    bottleGroup.quaternion.copy(currentQuat);
    bottleGroup.rotation.y += livingAutoPanY + rotParallaxY + craftFocusRotation.y + userDragRotY + turntableAngle;
    bottleGroup.rotation.x += livingTiltX + rotParallaxX + craftFocusRotation.x;
    bottleGroup.rotation.z += livingTiltZ;

    bottleGroup.scale.set(currentSizeScale, currentSizeScale, currentSizeScale);
  }

  // Camera stays comfortably placed
  if (camera) {
    camera.position.set(
      currentCamPos.x + mouse.x * 0.025,
      currentCamPos.y + mouse.y * 0.018,
      currentCamPos.z
    );
    camera.lookAt(currentLookAt);
  }

  // Studio Lighting Sweeps (gently shifts specular highlights across the crystal)
  if (keyLight) {
    keyLight.intensity = kf1.keyLight * (1 - t) + kf2.keyLight * t;
    keyLight.position.x = 3.5 + Math.sin(livingTime * 0.4) * 0.6 + mouse.x * 0.4;
    keyLight.position.y = 5.0 + Math.cos(livingTime * 0.3) * 0.3;
  }
  if (rimLight1) {
    rimLight1.intensity = kf1.rimLight1 * (1 - t) + kf2.rimLight1 * t;
    rimLight1.position.z = -3.5 + Math.cos(livingTime * 0.45) * 0.4;
  }
  if (rimLight2) {
    rimLight2.intensity = kf1.rimLight2 * (1 - t) + kf2.rimLight2 * t;
  }
  if (ambientLight) {
    ambientLight.intensity = kf1.ambient * (1 - t) + kf2.ambient * t;
  }
  if (haloMesh) {
    haloMesh.material.opacity = kf1.haloOpacity * (1 - t) + kf2.haloOpacity * t;
  }

  // Atmospheric Particles Movement
  if (particles && particles.geometry) {
    const posAttr = particles.geometry.attributes.position;
    const { speeds, originalPositions } = particles.userData;

    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i);
      y += delta * speeds[i] * 0.12;
      if (y > 3.0) y = -3.0;

      const origX = originalPositions[i * 3];
      const origZ = originalPositions[i * 3 + 2];
      const x = origX + Math.sin(livingTime * speeds[i] + i) * 0.06;
      const z = origZ + Math.cos(livingTime * speeds[i] * 0.7 + i) * 0.05;

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  // 6. Dynamic Depth of Field (BokehPass Controller)
  if (bokehPass && camera && bottleGroup) {
    // Exact distance to the bottle center keeps the bottle tack-sharp
    const bottleDist = camera.position.distanceTo(bottleGroup.position);
    bokehPass.uniforms['focus'].value = bottleDist;

    // Aperture dynamically widens as user scrolls to blur background elements
    const targetAperture = 0.020 + Math.min(scrollDelta * 0.14, 0.040);
    bokehPass.uniforms['aperture'].value += (targetAperture - bokehPass.uniforms['aperture'].value) * 0.1;

    const targetMaxBlur = 0.015 + Math.min(scrollDelta * 0.06, 0.030);
    bokehPass.uniforms['maxblur'].value += (targetMaxBlur - bokehPass.uniforms['maxblur'].value) * 0.1;
  }

  // Dynamic CSS lens blur variable for UI scrims during scrolling
  if (typeof document !== 'undefined') {
    const cssBlur = Math.min(16, 2 + scrollDelta * 70);
    document.documentElement.style.setProperty('--dof-lens-blur', `${cssBlur.toFixed(1)}px`);
  }

  // 7. Render Pass
  if (composer) {
    composer.render();
  } else if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function dispose3DExperience() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('mousedown', onPointerDown);
  window.removeEventListener('mousemove', onPointerDragMove);
  window.removeEventListener('mouseup', onPointerUp);
  if (composer) {
    composer.passes.forEach((pass) => pass.dispose && pass.dispose());
  }
  if (renderer) renderer.dispose();
  isInitialized = false;
}
