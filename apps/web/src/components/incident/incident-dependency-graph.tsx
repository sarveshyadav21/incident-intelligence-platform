"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { DependencyGraph } from "../../features/incidents/types/incident.type";

type Props = {
  graph: DependencyGraph | null | undefined;
};

const NODE_STYLES: Record<string, { background: string; color: string }> = {
  infrastructure: { background: "#312e81", color: "#c4b5fd" },
  service: { background: "#1e3a5f", color: "#7dd3fc" },
  impact: { background: "#7f1d1d", color: "#fca5a5" },
};

export function IncidentDependencyGraph({ graph }: Props) {
  const { nodes, edges } = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [] };
    }

    const rawNodes = graph.nodes as Array<{
      id: string;
      label: string;
      type: string;
    }>;

    const rawEdges = graph.edges as Array<{
      id: string;
      source: string;
      target: string;
      label?: string;
    }>;

    const flowNodes: Node[] = rawNodes.map((node, index) => {
      const style = NODE_STYLES[node.type] ?? NODE_STYLES.service;

      return {
        id: node.id,
        data: { label: node.label },
        position: { x: 80 + (index % 2) * 220, y: 40 + index * 90 },
        style: {
          ...style,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: 12,
          fontSize: 12,
          width: 180,
        },
      };
    });

    const flowEdges: Edge[] = rawEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#8b5cf6" },
      labelStyle: { fill: "#a1a1aa", fontSize: 10 },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph]);

  if (!graph || nodes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Dependency graph generates after analysis identifies affected systems.
      </p>
    );
  }

  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background color="#27272a" gap={20} />
        <Controls />
        <MiniMap
          nodeColor="#8b5cf6"
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: "#18181b" }}
        />
      </ReactFlow>
    </div>
  );
}
