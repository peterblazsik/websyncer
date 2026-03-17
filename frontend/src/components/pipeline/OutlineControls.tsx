interface OutlineControlsProps {
  showOutline: boolean;
  onShowOutlineChange: (value: boolean) => void;
  strokeWidth: number;
  onStrokeWidthChange: (value: number) => void;
  label?: string;
}

export function OutlineControls({
  showOutline,
  onShowOutlineChange,
  strokeWidth,
  onStrokeWidthChange,
  label = "Show Outline",
}: OutlineControlsProps) {
  return (
    <div className="space-y-3 pt-3 border-t border-brand-border">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={showOutline}
          onChange={(e) => onShowOutlineChange(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm text-brand-text">{label}</span>
      </label>
      {showOutline && (
        <div>
          <div className="flex justify-between text-xs text-brand-muted mb-1">
            <span>Stroke Width</span>
            <span>{strokeWidth}px</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
