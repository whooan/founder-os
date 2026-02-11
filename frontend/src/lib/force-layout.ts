import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { GraphNode, GraphLink, MarketGraphData } from "@/types";

interface SimNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: "company" | "investor" | "category";
  size: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  type: "invested_in" | "same_category" | "competitor";
  weight: number;
}

export function computeForceLayout(
  data: MarketGraphData,
  width: number,
  height: number
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: SimNode[] = data.nodes.map((n) => ({
    ...n,
    x: Math.random() * width,
    y: Math.random() * height,
  }));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const links: SimLink[] = data.links
    .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
    .map((l) => ({
      source: l.source,
      target: l.target,
      type: l.type,
      weight: l.weight,
    }));

  const simulation = forceSimulation<SimNode>(nodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(120)
    )
    .force("charge", forceManyBody().strength(-300))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "collision",
      forceCollide<SimNode>().radius((d) => d.size + 10)
    )
    .stop();

  // Run simulation synchronously
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  const layoutNodes: GraphNode[] = nodes.map((n) => ({
    id: n.id,
    label: n.label,
    type: n.type,
    size: n.size,
    x: n.x,
    y: n.y,
  }));

  const layoutLinks: GraphLink[] = links.map((l) => ({
    source: typeof l.source === "object" ? (l.source as SimNode).id : String(l.source),
    target: typeof l.target === "object" ? (l.target as SimNode).id : String(l.target),
    type: l.type,
    weight: l.weight,
  }));

  return { nodes: layoutNodes, links: layoutLinks };
}
