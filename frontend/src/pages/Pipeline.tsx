import { useReducer, useCallback } from "react";
import type {
  PipelineState,
  PipelineAction,
  PipelineStage,
  TraceStageOutput,
  CleanStageOutput,
  ZoneSplitStageOutput,
  ExportStageOutput,
  ClassificationResult,
} from "../types/pipeline";
import { StageIndicator } from "../components/pipeline/StageIndicator";
import { StageTrace } from "../components/pipeline/StageTrace";
import { StageClean } from "../components/pipeline/StageClean";
import { StageZoneSplit } from "../components/pipeline/StageZoneSplit";
import { StageExport } from "../components/pipeline/StageExport";
import { Stage3D } from "../components/pipeline/Stage3D";

const STAGE_ORDER: PipelineStage[] = [
  "trace",
  "clean",
  "zone-split",
  "export",
  "3d",
];

const initialState: PipelineState = {
  currentStage: "trace",
  sourceImage: null,
  sourceUrl: null,
  traceOutput: null,
  cleanOutput: null,
  zoneSplitOutput: null,
  exportOutput: null,
  classificationResult: null,
  zoneSuggestion: null,
};

function pipelineReducer(
  state: PipelineState,
  action: PipelineAction,
): PipelineState {
  switch (action.type) {
    case "SET_SOURCE":
      return {
        ...initialState,
        sourceImage: action.image,
        sourceUrl: action.url,
      };
    case "SET_TRACE_OUTPUT":
      return {
        ...state,
        traceOutput: action.output,
        cleanOutput: null,
        zoneSplitOutput: null,
        exportOutput: null,
      };
    case "SET_CLEAN_OUTPUT":
      return {
        ...state,
        cleanOutput: action.output,
        zoneSplitOutput: null,
        exportOutput: null,
      };
    case "SET_ZONE_SPLIT_OUTPUT":
      return {
        ...state,
        zoneSplitOutput: action.output,
        exportOutput: null,
      };
    case "SET_EXPORT_OUTPUT":
      return { ...state, exportOutput: action.output };
    case "SET_CLASSIFICATION":
      return { ...state, classificationResult: action.result };
    case "SET_ZONE_SUGGESTION":
      return {
        ...state,
        zoneSuggestion: {
          suggestedCuts: action.suggestedCuts,
          suggestedZones: action.suggestedZones,
        },
      };
    case "GO_TO_STAGE":
      return { ...state, currentStage: action.stage };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function Pipeline() {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);

  const completedStages: PipelineStage[] = [];
  if (state.traceOutput) completedStages.push("trace");
  if (state.cleanOutput) completedStages.push("clean");
  if (state.zoneSplitOutput) completedStages.push("zone-split");
  if (state.exportOutput) completedStages.push("export");

  const goToStage = useCallback(
    (stage: PipelineStage) => dispatch({ type: "GO_TO_STAGE", stage }),
    [],
  );

  const nextStage = useCallback(() => {
    const idx = STAGE_ORDER.indexOf(state.currentStage);
    if (idx < STAGE_ORDER.length - 1) {
      dispatch({ type: "GO_TO_STAGE", stage: STAGE_ORDER[idx + 1] });
    }
  }, [state.currentStage]);

  const prevStage = useCallback(() => {
    const idx = STAGE_ORDER.indexOf(state.currentStage);
    if (idx > 0) {
      dispatch({ type: "GO_TO_STAGE", stage: STAGE_ORDER[idx - 1] });
    }
  }, [state.currentStage]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <StageIndicator
        currentStage={state.currentStage}
        completedStages={completedStages}
        onStageClick={goToStage}
      />

      <div className="flex-1 overflow-hidden">
        {state.currentStage === "trace" && (
          <StageTrace
            sourceImage={state.sourceImage}
            sourceUrl={state.sourceUrl}
            traceOutput={state.traceOutput}
            onImageLoaded={(img, url) =>
              dispatch({ type: "SET_SOURCE", image: img, url })
            }
            onTraceComplete={(output: TraceStageOutput) =>
              dispatch({ type: "SET_TRACE_OUTPUT", output })
            }
            onClassify={(result: ClassificationResult) =>
              dispatch({ type: "SET_CLASSIFICATION", result })
            }
            onNext={nextStage}
          />
        )}

        {state.currentStage === "clean" && state.traceOutput && (
          <StageClean
            traceOutput={state.traceOutput}
            cleanOutput={state.cleanOutput}
            onCleanComplete={(output: CleanStageOutput) =>
              dispatch({ type: "SET_CLEAN_OUTPUT", output })
            }
            onZoneSuggestion={(result) =>
              dispatch({ type: "SET_ZONE_SUGGESTION", ...result })
            }
            productType={state.classificationResult?.productType}
            onBack={prevStage}
            onNext={nextStage}
          />
        )}

        {state.currentStage === "zone-split" && state.cleanOutput && (
          <StageZoneSplit
            cleanOutput={state.cleanOutput}
            zoneSplitOutput={state.zoneSplitOutput}
            classificationResult={state.classificationResult}
            zoneSuggestion={state.zoneSuggestion}
            onZoneSplitComplete={(output: ZoneSplitStageOutput) =>
              dispatch({ type: "SET_ZONE_SPLIT_OUTPUT", output })
            }
            onBack={prevStage}
            onNext={nextStage}
          />
        )}

        {state.currentStage === "export" &&
          state.zoneSplitOutput &&
          state.cleanOutput && (
            <StageExport
              zoneSplitOutput={state.zoneSplitOutput}
              cleanSvg={state.cleanOutput.svg}
              exportOutput={state.exportOutput}
              onExportComplete={(output: ExportStageOutput) =>
                dispatch({ type: "SET_EXPORT_OUTPUT", output })
              }
              onBack={prevStage}
              onNext={nextStage}
            />
          )}

        {state.currentStage === "3d" &&
          state.zoneSplitOutput &&
          state.cleanOutput && (
            <Stage3D
              zoneSplitOutput={state.zoneSplitOutput}
              cleanSvg={state.cleanOutput.svg}
              onBack={prevStage}
            />
          )}
      </div>
    </div>
  );
}
