import type { ProductConfig } from "../../types/pipeline";

interface ZoneCutOverlayProps {
  config: ProductConfig;
  hoveredZone: string | null;
  onZoneHover: (zoneId: string | null) => void;
}

export function ZoneCutOverlay({
  config,
  hoveredZone,
  onZoneHover,
}: ZoneCutOverlayProps) {
  const { width, height } = config.viewBox;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    >
      {/* Zone highlight areas */}
      {config.zones.map((zone) => {
        const bounds = config.zoneAssignment[zone.id];
        if (!bounds) return null;
        const isHovered = hoveredZone === zone.id;
        return (
          <rect
            key={zone.id}
            x={bounds.xMin}
            y={bounds.yMin}
            width={bounds.xMax - bounds.xMin}
            height={bounds.yMax - bounds.yMin}
            fill={zone.color}
            opacity={isHovered ? 0.25 : 0.08}
            style={{ pointerEvents: "all", cursor: "pointer" }}
            onMouseEnter={() => onZoneHover(zone.id)}
            onMouseLeave={() => onZoneHover(null)}
          />
        );
      })}

      {/* Cut lines */}
      {config.cuts.map((cut, i) => (
        <line
          key={i}
          x1={cut.axis === "horizontal" ? 0 : cut.position}
          y1={cut.axis === "horizontal" ? cut.position : 0}
          x2={cut.axis === "horizontal" ? width : cut.position}
          y2={cut.axis === "horizontal" ? cut.position : height}
          stroke="white"
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.6}
        />
      ))}

      {/* Zone labels */}
      {config.zones.map((zone) => {
        const bounds = config.zoneAssignment[zone.id];
        if (!bounds) return null;
        const cx = (bounds.xMin + bounds.xMax) / 2;
        const cy = (bounds.yMin + bounds.yMax) / 2;
        return (
          <text
            key={`label-${zone.id}`}
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={11}
            fontWeight="bold"
            opacity={hoveredZone === zone.id ? 0.9 : 0.5}
            style={{ pointerEvents: "none", textTransform: "uppercase" }}
          >
            {zone.label}
          </text>
        );
      })}
    </svg>
  );
}
