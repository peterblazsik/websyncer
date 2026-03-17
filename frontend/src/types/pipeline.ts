// ─── Geometry Primitives ───────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface CubicSegment {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

// ─── SVG Path Parsing ──────────────────────────────────────────────

export type PathCommandType =
  | "M"
  | "m"
  | "L"
  | "l"
  | "H"
  | "h"
  | "V"
  | "v"
  | "C"
  | "c"
  | "S"
  | "s"
  | "Q"
  | "q"
  | "T"
  | "t"
  | "A"
  | "a"
  | "Z"
  | "z";

export interface PathCommand {
  type: PathCommandType;
  values: number[];
}

export interface ParsedPath {
  d: string;
  commands: PathCommand[];
  segments: CubicSegment[];
}

// ─── Product Configuration ─────────────────────────────────────────

export interface ZoneDefinition {
  id: string;
  label: string;
  color: string;
}

export interface CutDefinition {
  axis: "horizontal" | "vertical";
  position: number; // Y value for horizontal, X value for vertical
  label: string;
}

export interface ZoneBounds {
  yMin: number;
  yMax: number;
  xMin: number;
  xMax: number;
}

export interface ProductConfig {
  name: string;
  viewBox: { width: number; height: number };
  zones: ZoneDefinition[];
  cuts: CutDefinition[];
  zoneAssignment: Record<string, ZoneBounds>;
}

// ─── AI Zone Suggestion ──────────────────────────────────────────

export interface ZoneSuggestion {
  suggestedCuts: {
    axis: "horizontal" | "vertical";
    position: number;
    label: string;
  }[];
  suggestedZones: {
    id: string;
    label: string;
    yMin: number;
    yMax: number;
    xMin: number;
    xMax: number;
  }[];
}

// ─── AI Classification ────────────────────────────────────────────

export interface ClassificationResult {
  productType: string;
  confidence: number;
  suggestedCuts?: {
    axis: "horizontal" | "vertical";
    position: number;
    label: string;
  }[];
  suggestedZones?: {
    id: string;
    label: string;
    yMin: number;
    yMax: number;
    xMin: number;
    xMax: number;
  }[];
}

// ─── Pipeline Stages ───────────────────────────────────────────────

export type PipelineStage = "trace" | "clean" | "zone-split" | "export" | "3d";

export interface TraceStageOutput {
  svg: string;
  params: import("./vectorize").TraceParams;
  width: number;
  height: number;
  pathCount: number;
}

export interface CleanStageOutput {
  svg: string;
  paths: ParsedPath[];
  pathCount: number;
  removedCount: number;
  viewBox: { width: number; height: number };
}

export interface ZonePath {
  zoneId: string;
  d: string;
  segments: CubicSegment[];
}

export interface ZoneSplitStageOutput {
  zonePaths: ZonePath[];
  outlinePath: string;
  productConfig: ProductConfig;
}

export interface ExportStageOutput {
  svg: string;
  outline: string;
  zones: Record<string, string>;
}

export interface PipelineState {
  currentStage: PipelineStage;
  sourceImage: HTMLImageElement | null;
  sourceUrl: string | null;
  traceOutput: TraceStageOutput | null;
  cleanOutput: CleanStageOutput | null;
  zoneSplitOutput: ZoneSplitStageOutput | null;
  exportOutput: ExportStageOutput | null;
  classificationResult: ClassificationResult | null;
  zoneSuggestion: ZoneSuggestion | null;
}

// ─── Pipeline Actions ──────────────────────────────────────────────

export type PipelineAction =
  | { type: "SET_SOURCE"; image: HTMLImageElement; url: string }
  | { type: "SET_TRACE_OUTPUT"; output: TraceStageOutput }
  | { type: "SET_CLEAN_OUTPUT"; output: CleanStageOutput }
  | { type: "SET_ZONE_SPLIT_OUTPUT"; output: ZoneSplitStageOutput }
  | { type: "SET_EXPORT_OUTPUT"; output: ExportStageOutput }
  | { type: "SET_CLASSIFICATION"; result: ClassificationResult }
  | {
      type: "SET_ZONE_SUGGESTION";
      suggestedCuts: ZoneSuggestion["suggestedCuts"];
      suggestedZones: ZoneSuggestion["suggestedZones"];
    }
  | { type: "GO_TO_STAGE"; stage: PipelineStage }
  | { type: "RESET" };
