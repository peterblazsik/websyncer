import type { ProductConfig } from "../../types/pipeline";

/**
 * Sock product configuration for ARTIN customizer.
 * ViewBox: 280x410, 5 zones split by 4 horizontal cuts.
 *
 * Zone layout (top to bottom):
 *   calf:        0 → 100
 *   ankle_band:  100 → 160
 *   heel:        160 → 250
 *   foot:        250 → 340
 *   toe:         340 → 410
 */
export const SOCK_CONFIG: ProductConfig = {
  name: "Sock",
  viewBox: { width: 280, height: 410 },
  zones: [
    { id: "calf", label: "Calf", color: "#4A90D9" },
    { id: "ankle_band", label: "Ankle Band", color: "#E8A838" },
    { id: "heel", label: "Heel", color: "#D94A4A" },
    { id: "foot", label: "Foot", color: "#50C878" },
    { id: "toe", label: "Toe", color: "#9B59B6" },
  ],
  cuts: [
    { axis: "horizontal", position: 100, label: "Calf / Ankle Band" },
    { axis: "horizontal", position: 160, label: "Ankle Band / Heel" },
    { axis: "horizontal", position: 250, label: "Heel / Foot" },
    { axis: "horizontal", position: 340, label: "Foot / Toe" },
  ],
  zoneAssignment: {
    calf: { yMin: 0, yMax: 100, xMin: 0, xMax: 280 },
    ankle_band: { yMin: 100, yMax: 160, xMin: 0, xMax: 280 },
    heel: { yMin: 160, yMax: 250, xMin: 0, xMax: 280 },
    foot: { yMin: 250, yMax: 340, xMin: 0, xMax: 280 },
    toe: { yMin: 340, yMax: 410, xMin: 0, xMax: 280 },
  },
};

/**
 * Insole product configuration.
 * ViewBox: 200x500, 4 zones split by 3 horizontal cuts.
 *
 * Zone layout (top to bottom):
 *   toe:   0 → 125
 *   ball:  125 → 250
 *   arch:  250 → 375
 *   heel:  375 → 500
 */
export const INSOLE_CONFIG: ProductConfig = {
  name: "Insole",
  viewBox: { width: 200, height: 500 },
  zones: [
    { id: "toe", label: "Toe", color: "#9B59B6" },
    { id: "ball", label: "Ball", color: "#E8A838" },
    { id: "arch", label: "Arch", color: "#50C878" },
    { id: "heel", label: "Heel", color: "#D94A4A" },
  ],
  cuts: [
    { axis: "horizontal", position: 125, label: "Toe / Ball" },
    { axis: "horizontal", position: 250, label: "Ball / Arch" },
    { axis: "horizontal", position: 375, label: "Arch / Heel" },
  ],
  zoneAssignment: {
    toe: { yMin: 0, yMax: 125, xMin: 0, xMax: 200 },
    ball: { yMin: 125, yMax: 250, xMin: 0, xMax: 200 },
    arch: { yMin: 250, yMax: 375, xMin: 0, xMax: 200 },
    heel: { yMin: 375, yMax: 500, xMin: 0, xMax: 200 },
  },
};

/**
 * Shoe (side view) product configuration.
 * ViewBox: 400x300, 5 zones split by 4 horizontal cuts.
 *
 * Zone layout (top to bottom):
 *   toe_box:       0 → 60
 *   vamp:          60 → 120
 *   quarter:       120 → 200
 *   heel_counter:  200 → 260
 *   sole:          260 → 300
 */
export const SHOE_CONFIG: ProductConfig = {
  name: "Shoe (Side)",
  viewBox: { width: 400, height: 300 },
  zones: [
    { id: "toe_box", label: "Toe Box", color: "#4A90D9" },
    { id: "vamp", label: "Vamp", color: "#E8A838" },
    { id: "quarter", label: "Quarter", color: "#50C878" },
    { id: "heel_counter", label: "Heel Counter", color: "#D94A4A" },
    { id: "sole", label: "Sole", color: "#9B59B6" },
  ],
  cuts: [
    { axis: "horizontal", position: 60, label: "Toe Box / Vamp" },
    { axis: "horizontal", position: 120, label: "Vamp / Quarter" },
    { axis: "horizontal", position: 200, label: "Quarter / Heel Counter" },
    { axis: "horizontal", position: 260, label: "Heel Counter / Sole" },
  ],
  zoneAssignment: {
    toe_box: { yMin: 0, yMax: 60, xMin: 0, xMax: 400 },
    vamp: { yMin: 60, yMax: 120, xMin: 0, xMax: 400 },
    quarter: { yMin: 120, yMax: 200, xMin: 0, xMax: 400 },
    heel_counter: { yMin: 200, yMax: 260, xMin: 0, xMax: 400 },
    sole: { yMin: 260, yMax: 300, xMin: 0, xMax: 400 },
  },
};

/**
 * T-Shirt product configuration.
 * ViewBox: 400x500, 5 zones with mixed horizontal + vertical cuts.
 *
 * Zone layout:
 *   collar:        y=0→60,   x=0→400   (full width top strip)
 *   sleeve_left:   y=60→250, x=0→80    (left sleeve)
 *   chest:         y=60→250, x=80→320  (center chest area)
 *   sleeve_right:  y=60→250, x=320→400 (right sleeve)
 *   body:          y=250→500, x=0→400  (full width lower body)
 */
export const TSHIRT_CONFIG: ProductConfig = {
  name: "T-Shirt",
  viewBox: { width: 400, height: 500 },
  zones: [
    { id: "collar", label: "Collar", color: "#4A90D9" },
    { id: "sleeve_left", label: "Left Sleeve", color: "#E8A838" },
    { id: "chest", label: "Chest", color: "#50C878" },
    { id: "sleeve_right", label: "Right Sleeve", color: "#D94A4A" },
    { id: "body", label: "Body", color: "#9B59B6" },
  ],
  cuts: [
    { axis: "horizontal", position: 60, label: "Collar / Body" },
    { axis: "horizontal", position: 250, label: "Upper / Lower" },
    { axis: "vertical", position: 80, label: "Left Sleeve / Chest" },
    { axis: "vertical", position: 320, label: "Chest / Right Sleeve" },
  ],
  zoneAssignment: {
    collar: { yMin: 0, yMax: 60, xMin: 0, xMax: 400 },
    sleeve_left: { yMin: 60, yMax: 250, xMin: 0, xMax: 80 },
    chest: { yMin: 60, yMax: 250, xMin: 80, xMax: 320 },
    sleeve_right: { yMin: 60, yMax: 250, xMin: 320, xMax: 400 },
    body: { yMin: 250, yMax: 500, xMin: 0, xMax: 400 },
  },
};

/**
 * Bottle product configuration.
 * ViewBox: 150x400, 5 zones split by 4 horizontal cuts.
 *
 * Zone layout (top to bottom):
 *   cap:         0 → 50
 *   neck:        50 → 120
 *   label:       120 → 260
 *   body_lower:  260 → 350
 *   base:        350 → 400
 */
export const BOTTLE_CONFIG: ProductConfig = {
  name: "Bottle",
  viewBox: { width: 150, height: 400 },
  zones: [
    { id: "cap", label: "Cap", color: "#4A90D9" },
    { id: "neck", label: "Neck", color: "#E8A838" },
    { id: "label", label: "Label", color: "#50C878" },
    { id: "body_lower", label: "Body", color: "#D94A4A" },
    { id: "base", label: "Base", color: "#9B59B6" },
  ],
  cuts: [
    { axis: "horizontal", position: 50, label: "Cap / Neck" },
    { axis: "horizontal", position: 120, label: "Neck / Label" },
    { axis: "horizontal", position: 260, label: "Label / Body" },
    { axis: "horizontal", position: 350, label: "Body / Base" },
  ],
  zoneAssignment: {
    cap: { yMin: 0, yMax: 50, xMin: 0, xMax: 150 },
    neck: { yMin: 50, yMax: 120, xMin: 0, xMax: 150 },
    label: { yMin: 120, yMax: 260, xMin: 0, xMax: 150 },
    body_lower: { yMin: 260, yMax: 350, xMin: 0, xMax: 150 },
    base: { yMin: 350, yMax: 400, xMin: 0, xMax: 150 },
  },
};

export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  sock: SOCK_CONFIG,
  insole: INSOLE_CONFIG,
  shoe: SHOE_CONFIG,
  tshirt: TSHIRT_CONFIG,
  bottle: BOTTLE_CONFIG,
};

export function getProductConfig(productId: string): ProductConfig | undefined {
  return PRODUCT_CONFIGS[productId];
}

export function getProductList(): { id: string; name: string }[] {
  return Object.entries(PRODUCT_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
  }));
}
