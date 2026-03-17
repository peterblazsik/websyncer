import type { PipelineStage } from "../../types/pipeline";
import { Check } from "lucide-react";

interface StageIndicatorProps {
  currentStage: PipelineStage;
  completedStages: PipelineStage[];
  onStageClick: (stage: PipelineStage) => void;
}

const STAGES: { id: PipelineStage; number: number; label: string }[] = [
  { id: "trace", number: 1, label: "Trace" },
  { id: "clean", number: 2, label: "Clean" },
  { id: "zone-split", number: 3, label: "Zone Split" },
  { id: "export", number: 4, label: "Export" },
  { id: "3d", number: 5, label: "3D" },
];

export function StageIndicator({
  currentStage,
  completedStages,
  onStageClick,
}: StageIndicatorProps) {
  return (
    <div
      role="navigation"
      aria-label="Pipeline stages"
      className="flex items-center justify-center gap-0 px-4 py-3 border-b border-brand-border bg-black/50"
    >
      {STAGES.map((stage, idx) => {
        const isCurrent = currentStage === stage.id;
        const isCompleted = completedStages.includes(stage.id);
        const isClickable = isCompleted || isCurrent;

        return (
          <div key={stage.id} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStageClick(stage.id)}
              disabled={!isClickable}
              aria-current={isCurrent ? "step" : undefined}
              title={
                !isClickable ? "Complete previous stages first" : undefined
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                isCurrent
                  ? "bg-white text-black"
                  : isCompleted
                    ? "bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                    : "text-brand-muted/30 cursor-not-allowed"
              }`}
            >
              {isCompleted && !isCurrent ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span>{stage.number}</span>
              )}
              <span>{stage.label}</span>
            </button>
            {idx < STAGES.length - 1 && (
              <div
                className={`w-8 h-px mx-1 ${
                  isCompleted ? "bg-white/30" : "bg-brand-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
