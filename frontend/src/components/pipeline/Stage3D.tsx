import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { ZoneSplitStageOutput } from "../../types/pipeline";
import {
  svgPathToShape,
  extractPathFromSvg,
} from "../../lib/pipeline/meshEngine";
import { exportToSTL } from "../../lib/pipeline/stlExporter";
import { downloadFile } from "../../lib/downloadHelpers";
import { usePersistedState } from "../../hooks/usePersistedState";

const BEVEL_SETTINGS = {
  bevelEnabled: true,
  bevelThickness: 0.5,
  bevelSize: 0.3,
  bevelSegments: 2,
  curveSegments: 12,
} as const;

interface Stage3DProps {
  zoneSplitOutput: ZoneSplitStageOutput;
  cleanSvg: string;
  onBack: () => void;
}

function ProductMesh({
  outlinePath,
  depth,
}: {
  outlinePath: string;
  depth: number;
}) {
  const geometry = useMemo(() => {
    if (!outlinePath) return null;
    try {
      const shape = svgPathToShape(outlinePath);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        ...BEVEL_SETTINGS,
      });
      geo.center();
      return geo;
    } catch (err) {
      console.error("Failed to create 3D mesh:", err);
      return null;
    }
  }, [outlinePath, depth]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#e0e0e0" />
    </mesh>
  );
}

export function Stage3D({ zoneSplitOutput, cleanSvg, onBack }: Stage3DProps) {
  const [depth, setDepth] = usePersistedState("pipeline-3d-depth", 3);
  const [showHint, setShowHint] = useState(true);

  const config = zoneSplitOutput.productConfig;
  const outlinePath =
    zoneSplitOutput.outlinePath || extractPathFromSvg(cleanSvg);

  const handleDownloadSTL = useCallback(() => {
    if (!outlinePath) {
      toast.error("No outline path available");
      return;
    }

    let geometry: THREE.ExtrudeGeometry | null = null;
    try {
      const shape = svgPathToShape(outlinePath);
      geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        ...BEVEL_SETTINGS,
      });
      geometry.center();

      const mesh = new THREE.Mesh(geometry);
      mesh.updateMatrixWorld(true);

      const group = new THREE.Group();
      group.add(mesh);
      group.updateMatrixWorld(true);

      const stlBuffer = exportToSTL(group);
      const blob = new Blob([stlBuffer], { type: "application/octet-stream" });
      downloadFile(
        blob,
        `${config.name.toLowerCase().replace(/\s+/g, "-")}-model.stl`,
      );
      toast.success("STL downloaded");
    } catch (err) {
      toast.error(
        `STL export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      geometry?.dispose();
    }
  }, [outlinePath, depth, config.name]);

  // Calculate camera distance based on viewBox
  const cameraDistance =
    Math.max(config.viewBox.width, config.viewBox.height) * 1.5;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* 3D Viewer */}
      <div className="flex-1 min-h-[200px] border-b lg:border-b-0 lg:border-r border-brand-border bg-black relative">
        <Canvas onPointerDown={() => setShowHint(false)}>
          <PerspectiveCamera
            makeDefault
            position={[0, 0, cameraDistance]}
            fov={45}
          />
          <OrbitControls enableDamping dampingFactor={0.1} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[100, 100, 100]} intensity={1} />
          <directionalLight position={[-100, -50, -100]} intensity={0.3} />
          <group>
            <ProductMesh outlinePath={outlinePath} depth={depth} />
          </group>
          <gridHelper
            args={[cameraDistance, 20, "#333333", "#222222"]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </Canvas>
        {showHint && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 border border-brand-border rounded-lg text-xs text-brand-muted pointer-events-none">
            Drag to rotate | Scroll to zoom | Right-click to pan
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-brand-card overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="p-4 space-y-4">
          <h3 className="form-label">3D Preview</h3>

          {/* Extrusion Depth */}
          <div>
            <label className="form-label">Extrusion Depth: {depth}mm</label>
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.5}
              value={depth}
              onChange={(e) => setDepth(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Model Info */}
          <div className="text-xs text-brand-muted space-y-1 pt-2 border-t border-brand-border">
            <p>Product: {config.name}</p>
            <p>
              ViewBox: {config.viewBox.width}x{config.viewBox.height}
            </p>
            <p>Zones: {config.zones.length}</p>
            <p>Depth: {depth}mm</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto p-4 border-t border-brand-border space-y-2">
          <button
            type="button"
            onClick={handleDownloadSTL}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download STL
          </button>

          <button
            type="button"
            onClick={onBack}
            className="btn-secondary w-full"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
