"use client";

import { useMemo, useRef } from "react";
import { Group } from "@visx/group";
import { Zoom } from "@visx/zoom";
import type { MarketGraphData, GraphNode } from "@/types";
import { computeForceLayout } from "@/lib/force-layout";

interface MarketGraphProps {
  data: MarketGraphData;
  width: number;
  height: number;
}

const NODE_COLORS: Record<GraphNode["type"], string> = {
  company: "#3b82f6",
  investor: "#22c55e",
  category: "#a855f7",
};

const NODE_SIZES: Record<GraphNode["type"], number> = {
  company: 20,
  investor: 14,
  category: 10,
};

export function MarketGraph({ data, width, height }: MarketGraphProps) {
  const layoutRef = useRef<ReturnType<typeof computeForceLayout> | null>(null);

  const layout = useMemo(() => {
    const result = computeForceLayout(data, width, height);
    layoutRef.current = result;
    return result;
  }, [data, width, height]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    layout.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layout.nodes]);

  const initialTransform = {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
    skewX: 0,
    skewY: 0,
  };

  return (
    <Zoom<SVGSVGElement>
      width={width}
      height={height}
      scaleXMin={0.3}
      scaleXMax={3}
      scaleYMin={0.3}
      scaleYMax={3}
      initialTransformMatrix={initialTransform}
    >
      {(zoom) => (
        <svg
          width={width}
          height={height}
          ref={zoom.containerRef}
          className="cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
        >
          <rect
            width={width}
            height={height}
            fill="transparent"
            onTouchStart={zoom.dragStart}
            onTouchMove={zoom.dragMove}
            onTouchEnd={zoom.dragEnd}
            onMouseDown={zoom.dragStart}
            onMouseMove={zoom.dragMove}
            onMouseUp={zoom.dragEnd}
            onMouseLeave={() => {
              if (zoom.isDragging) zoom.dragEnd();
            }}
          />
          <Group transform={zoom.toString()}>
            {/* Links */}
            {layout.links.map((link, i) => {
              const source = nodeMap.get(link.source);
              const target = nodeMap.get(link.target);
              if (!source?.x || !source?.y || !target?.x || !target?.y)
                return null;

              return (
                <line
                  key={`link-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#94a3b8"
                  strokeOpacity={0.3}
                  strokeWidth={Math.max(1, link.weight)}
                />
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              if (node.x == null || node.y == null) return null;
              const size = NODE_SIZES[node.type];
              const color = NODE_COLORS[node.type];

              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size}
                    fill={color}
                    fillOpacity={0.85}
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={0.3}
                  />
                  <text
                    x={node.x}
                    y={node.y + size + 14}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={11}
                    fontWeight={node.type === "company" ? 600 : 400}
                    className="pointer-events-none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </Group>
        </svg>
      )}
    </Zoom>
  );
}

export function MarketGraphLegend() {
  const items = [
    { type: "company" as const, label: "Company", color: NODE_COLORS.company },
    {
      type: "investor" as const,
      label: "Investor",
      color: NODE_COLORS.investor,
    },
    {
      type: "category" as const,
      label: "Category",
      color: NODE_COLORS.category,
    },
  ];

  return (
    <div className="flex items-center gap-4">
      {items.map((item) => (
        <div key={item.type} className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
