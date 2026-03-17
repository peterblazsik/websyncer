import { useCallback } from "react";
import { RotateCcw } from "lucide-react";
import type { TraceParams, TraceMode, TurnPolicy } from "../../types/vectorize";
import { DEFAULT_PARAMS, PRESETS } from "../../types/vectorize";

interface VectorizeControlsProps {
  params: TraceParams;
  onChange: (params: TraceParams) => void;
  disabled: boolean;
}

export function VectorizeControls({
  params,
  onChange,
  disabled,
}: VectorizeControlsProps) {
  const update = useCallback(
    (partial: Partial<TraceParams>) => {
      onChange({ ...params, ...partial });
    },
    [params, onChange],
  );

  const resetParams = useCallback(() => {
    onChange({ ...DEFAULT_PARAMS });
  }, [onChange]);

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <label className="form-label">Presets</label>
        <div className="space-y-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...params, ...preset.params })}
              className="w-full text-left px-3 py-2 bg-black border border-brand-border rounded hover:border-white/50 transition-colors disabled:opacity-50"
            >
              <div className="text-white text-sm font-medium">
                {preset.name}
              </div>
              <div className="text-brand-muted text-xs">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div>
        <label className="form-label">Trace Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {(["bw", "color", "edge"] as TraceMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              onClick={() => update({ mode })}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded border-2 transition-all ${
                params.mode === mode
                  ? "border-white bg-white/10 text-white"
                  : "border-brand-border text-brand-muted hover:border-white/50"
              } disabled:opacity-50`}
            >
              {mode === "bw" ? "B&W" : mode === "color" ? "Color" : "Edges"}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold (B&W and Edge modes) */}
      {params.mode !== "color" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="form-label mb-0">
              {params.mode === "edge" ? "Edge Sensitivity" : "Threshold"}
            </label>
            <span className="text-white text-sm font-bold">
              {params.threshold}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="255"
            value={params.threshold}
            onChange={(e) => update({ threshold: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-xs text-brand-muted mt-1">
            <span>{params.mode === "edge" ? "Less detail" : "More black"}</span>
            <span>{params.mode === "edge" ? "More detail" : "More white"}</span>
          </div>
        </div>
      )}

      {/* Color Count (color mode only) */}
      {params.mode === "color" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="form-label mb-0">Color Count</label>
            <span className="text-white text-sm font-bold">
              {params.colorCount}
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="8"
            value={params.colorCount}
            onChange={(e) => update({ colorCount: parseInt(e.target.value) })}
            disabled={disabled}
            className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-white"
          />
          <div className="flex justify-between text-xs text-brand-muted mt-1">
            <span>2 colors</span>
            <span>8 colors</span>
          </div>
        </div>
      )}

      {/* Smoothing / Curve Tolerance */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Curve Smoothing</label>
          <span className="text-white text-sm font-bold">
            {params.optTolerance.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(params.optTolerance * 100)}
          onChange={(e) =>
            update({ optTolerance: parseInt(e.target.value) / 100 })
          }
          disabled={disabled}
          className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-brand-muted mt-1">
          <span>Precise</span>
          <span>Smooth</span>
        </div>
      </div>

      {/* Corner Threshold */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Corner Threshold</label>
          <span className="text-white text-sm font-bold">
            {params.alphaMax.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="134"
          value={Math.round(params.alphaMax * 100)}
          onChange={(e) => update({ alphaMax: parseInt(e.target.value) / 100 })}
          disabled={disabled}
          className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-brand-muted mt-1">
          <span>Sharp corners</span>
          <span>Smooth curves</span>
        </div>
      </div>

      {/* Minimum Path Size (turdSize) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Noise Filter</label>
          <span className="text-white text-sm font-bold">
            {params.turdSize}px
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          value={params.turdSize}
          onChange={(e) => update({ turdSize: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-brand-muted mt-1">
          <span>Keep all</span>
          <span>Remove small</span>
        </div>
      </div>

      {/* Turn Policy */}
      <div>
        <label className="form-label">Turn Policy</label>
        <select
          value={params.turnPolicy}
          onChange={(e) => update({ turnPolicy: e.target.value as TurnPolicy })}
          disabled={disabled}
          className="form-select text-sm"
        >
          <option value="minority">Minority (default)</option>
          <option value="majority">Majority</option>
          <option value="black">Black</option>
          <option value="white">White</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>

      {/* Invert */}
      <div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => update({ invert: !params.invert })}
          className={`checkbox-item w-full ${params.invert ? "checked" : ""}`}
        >
          <div className="checkbox-box">
            {params.invert && (
              <svg
                className="w-3 h-3 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <span className="text-white font-medium text-sm">Invert Colors</span>
        </button>
      </div>

      {/* Scale */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Output Scale</label>
          <span className="text-white text-sm font-bold">{params.scale}x</span>
        </div>
        <input
          type="range"
          min="50"
          max="400"
          step="25"
          value={Math.round(params.scale * 100)}
          onChange={(e) => update({ scale: parseInt(e.target.value) / 100 })}
          disabled={disabled}
          className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-brand-muted mt-1">
          <span>0.5x</span>
          <span>4x</span>
        </div>
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={resetParams}
        disabled={disabled}
        className="btn-secondary w-full flex items-center justify-center gap-2 !py-2 text-sm"
      >
        <RotateCcw className="w-4 h-4" />
        Reset to Defaults
      </button>
    </div>
  );
}
