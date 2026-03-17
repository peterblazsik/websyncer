export type TraceMode = "bw" | "color" | "edge";

export type TurnPolicy =
  | "black"
  | "white"
  | "left"
  | "right"
  | "minority"
  | "majority";

export interface TraceParams {
  mode: TraceMode;
  threshold: number; // 0-255, default 128
  colorCount: number; // 2-8, for color mode
  turdSize: number; // min path size, default 2
  alphaMax: number; // corner threshold 0-1.34, default 1
  optTolerance: number; // curve tolerance 0-1, default 0.2
  turnPolicy: TurnPolicy;
  invert: boolean;
  // Output
  scale: number; // output scale multiplier, default 1
  unit: "px" | "mm";
}

export const DEFAULT_PARAMS: TraceParams = {
  mode: "bw",
  threshold: 128,
  colorCount: 4,
  turdSize: 2,
  alphaMax: 1,
  optTolerance: 0.2,
  turnPolicy: "minority",
  invert: false,
  scale: 1,
  unit: "px",
};

export interface TraceResult {
  svg: string;
  pathCount: number;
  nodeCount: number;
  width: number;
  height: number;
}

export interface Preset {
  name: string;
  description: string;
  params: Partial<TraceParams>;
}

export const PRESETS: Preset[] = [
  {
    name: "Logo (high detail)",
    description: "Preserves fine details and sharp corners",
    params: {
      mode: "bw",
      turdSize: 1,
      alphaMax: 0.5,
      optTolerance: 0.1,
    },
  },
  {
    name: "Simple icon (smooth)",
    description: "Smooth curves, removes noise",
    params: {
      mode: "bw",
      turdSize: 10,
      alphaMax: 1.2,
      optTolerance: 0.5,
    },
  },
  {
    name: "Engrave (outlines)",
    description: "Extract outlines only for engraving/cutting",
    params: {
      mode: "edge",
      turdSize: 5,
      alphaMax: 1,
      optTolerance: 0.2,
    },
  },
  {
    name: "Multi-color (4)",
    description: "4-color posterized trace",
    params: {
      mode: "color",
      colorCount: 4,
      turdSize: 4,
      optTolerance: 0.3,
    },
  },
];

export interface HistoryEntry {
  params: TraceParams;
  timestamp: number;
}
