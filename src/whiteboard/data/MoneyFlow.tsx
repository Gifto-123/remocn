import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";

export type MoneyFlowNode = {
  id: string;
  label: string;
  value?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  icon?: React.ReactNode;
};

export type MoneyFlowConnection = {
  from: string;
  to: string;
  amount?: number;
  label?: string;
  color?: string;
  width?: number;
  curvature?: number;
  delay?: number;
};

export type MoneyFlowProps = {
  nodes: MoneyFlowNode[];
  connections: MoneyFlowConnection[];
  width: number;
  height: number;
  x?: number;
  y?: number;
  delay?: number;
  duration?: number;
  nodeDelay?: number;
  nodeDuration?: number;
  particleCount?: number;
  particleSize?: number;
  currency?: string;
  locale?: string;
  showAmounts?: boolean;
  fontFamily?: string;
  fontSize?: number;
  backgroundColor?: string;
  style?: React.CSSProperties;
};

export type MoneyFlowPoint = {x: number; y: number};

const cubicPoint = (
  start: MoneyFlowPoint,
  end: MoneyFlowPoint,
  curvature: number,
  t: number,
): MoneyFlowPoint => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const cx = (start.x + end.x) / 2 + nx * curvature;
  const cy = (start.y + end.y) / 2 + ny * curvature;
  const u = 1 - t;
  return {
    x: u * u * start.x + 2 * u * t * cx + t * t * end.x,
    y: u * u * start.y + 2 * u * t * cy + t * t * end.y,
  };
};

const formatAmount = (
  amount: number,
  currency: string,
  locale?: string,
) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  }).format(amount);

export const getMoneyFlowConnectionPoint = (
  connection: MoneyFlowConnection,
  nodes: MoneyFlowNode[],
  progress: number,
): MoneyFlowPoint => {
  const start = nodes.find((node) => node.id === connection.from);
  const end = nodes.find((node) => node.id === connection.to);
  if (!start || !end) return {x: 0, y: 0};
  const startWidth = start.width ?? 180;
  const startHeight = start.height ?? 84;
  const endWidth = end.width ?? 180;
  const endHeight = end.height ?? 84;
  const dx = end.x + endWidth / 2 - (start.x + startWidth / 2);
  const dy = end.y + endHeight / 2 - (start.y + startHeight / 2);
  const startPoint = {
    x: start.x + startWidth / 2 + (dx === 0 ? 0 : Math.sign(dx) * startWidth / 2),
    y: start.y + startHeight / 2,
  };
  const endPoint = {
    x: end.x + endWidth / 2 - (dx === 0 ? 0 : Math.sign(dx) * endWidth / 2),
    y: end.y + endHeight / 2,
  };
  return cubicPoint(startPoint, endPoint, connection.curvature ?? 0, progress);
};

export const moneyFlowDuration = (
  props: Pick<MoneyFlowProps, "duration"> = {},
) => Math.max(1, props.duration ?? 90);

/** Animated money movement between labeled financial nodes. */
export const MoneyFlow: React.FC<MoneyFlowProps> = ({
  nodes,
  connections,
  width,
  height,
  x = 0,
  y = 0,
  delay = 0,
  duration = 90,
  nodeDelay = 8,
  nodeDuration = 24,
  particleCount = 5,
  particleSize = 10,
  currency = "USD",
  locale,
  showAmounts = true,
  fontFamily = "Arial, sans-serif",
  fontSize = 18,
  backgroundColor = "transparent",
  style,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - delay;
  const safeDuration = Math.max(1, duration);

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        background: backgroundColor,
        overflow: "hidden",
        ...style,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}
        aria-label="Animated money flow diagram"
      >
        {connections.map((connection, connectionIndex) => {
          const start = nodeMap.get(connection.from);
          const end = nodeMap.get(connection.to);
          if (!start || !end) return null;

          const startWidth = start.width ?? 180;
          const startHeight = start.height ?? 84;
          const endWidth = end.width ?? 180;
          const endHeight = end.height ?? 84;
          const dx = end.x + endWidth / 2 - (start.x + startWidth / 2);
          const sx = start.x + startWidth / 2 + (dx === 0 ? 0 : Math.sign(dx) * startWidth / 2);
          const sy = start.y + startHeight / 2;
          const ex = end.x + endWidth / 2 - (dx === 0 ? 0 : Math.sign(dx) * endWidth / 2);
          const ey = end.y + endHeight / 2;
          const curvature = connection.curvature ?? 0;
          const cLength = Math.hypot(ex - sx, ey - sy) || 1;
          const nx = -(ey - sy) / cLength;
          const ny = (ex - sx) / cLength;
          const cx = (sx + ex) / 2 + nx * curvature;
          const cy = (sy + ey) / 2 + ny * curvature;
          const path = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;

          const revealProgress = interpolate(
            localFrame - (connection.delay ?? connectionIndex * 6),
            [0, safeDuration * 0.55],
            [0, 1],
            {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)},
          );

          const particles = Array.from({length: Math.max(1, particleCount)}, (_, particleIndex) => {
            const particleProgress = interpolate(
              localFrame - (connection.delay ?? connectionIndex * 6),
              [0, safeDuration],
              [0, 1],
              {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
            );
            const t = ((particleProgress + particleIndex / Math.max(1, particleCount)) % 1);
            const point = cubicPoint({x: sx, y: sy}, {x: ex, y: ey}, curvature, t);
            const pulse = 0.65 + 0.35 * Math.sin(t * Math.PI);
            return (
              <circle
                key={particleIndex}
                cx={point.x}
                cy={point.y}
                r={particleSize * pulse}
                fill={connection.color ?? "#16a34a"}
                opacity={0.25 + 0.75 * revealProgress}
              />
            );
          });

          const labelPoint = cubicPoint({x: sx, y: sy}, {x: ex, y: ey}, curvature, 0.5);
          const label = connection.label
            ?? (connection.amount !== undefined && showAmounts
              ? formatAmount(connection.amount, currency, locale)
              : undefined);

          return (
            <g key={`${connection.from}-${connection.to}-${connectionIndex}`}>
              <path
                d={path}
                fill="none"
                stroke={connection.color ?? "#94a3b8"}
                strokeWidth={connection.width ?? 3}
                strokeDasharray="10 9"
                strokeLinecap="round"
                opacity={0.55 * revealProgress}
              />
              <path
                d={path}
                fill="none"
                stroke={connection.color ?? "#16a34a"}
                strokeWidth={(connection.width ?? 3) + 1}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - revealProgress}
              />
              {particles}
              {label ? (
                <g transform={`translate(${labelPoint.x} ${labelPoint.y})`} opacity={revealProgress}>
                  <rect
                    x={-58}
                    y={-15}
                    width={116}
                    height={30}
                    rx={15}
                    fill="#ffffff"
                    stroke="#dbe3ea"
                    strokeWidth={1}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#334155"
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    fontWeight={700}
                  >
                    {label}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>

      {nodes.map((node, index) => {
        const nodeProgress = interpolate(
          localFrame - index * nodeDelay,
          [0, nodeDuration],
          [0, 1],
          {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.2))},
        );
        const nodeWidth = node.width ?? 180;
        const nodeHeight = node.height ?? 84;
        const valueLabel = node.value !== undefined && showAmounts
          ? formatAmount(node.value, currency, locale)
          : undefined;

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              width: nodeWidth,
              height: nodeHeight,
              boxSizing: "border-box",
              border: `2px solid ${node.color ?? "#94a3b8"}`,
              borderRadius: 18,
              background: node.backgroundColor ?? "#ffffff",
              boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              opacity: nodeProgress,
              transform: `scale(${nodeProgress})`,
              transformOrigin: "center",
              fontFamily,
              textAlign: "center",
            }}
          >
            {node.icon ? <div>{node.icon}</div> : null}
            <div style={{fontSize, fontWeight: 800, color: node.color ?? "#334155"}}>
              {node.label}
            </div>
            {valueLabel ? (
              <div style={{fontSize: Math.max(13, fontSize - 2), fontWeight: 700, color: "#64748b"}}>
                {valueLabel}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default MoneyFlow;
