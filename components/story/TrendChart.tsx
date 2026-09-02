"use client";

import type { TrendPoint } from "@/lib/business/story";

// Grade colours consistent with Pulse
const gradeColor = (s: number) =>
  s >= 85 ? "var(--teal)" : s >= 70 ? "var(--amber)" : "var(--coral)";

interface Props {
  points: TrendPoint[];
}

const W = 480;   // viewBox width
const H = 120;   // viewBox height
const PAD = { top: 12, right: 16, bottom: 32, left: 36 };

export default function TrendChart({ points }: Props) {
  // Only plot months that have a score
  const scored = points.filter((p) => p.score !== null) as (TrendPoint & { score: number })[];

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // x: evenly spaced across all months (including null ones for spacing)
  const xFor = (i: number) =>
    points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2;

  // y: 0-100 mapped to chartH (0 at bottom)
  const yFor = (s: number) => chartH - (s / 100) * chartH;

  // Reference lines at 70 and 85
  const refLines = [
    { y: yFor(85), label: "A", color: "var(--teal)" },
    { y: yFor(70), label: "B", color: "var(--amber)" },
  ];

  // Build SVG polyline points from scored months (using their original index for x)
  const indexMap = new Map(points.map((p, i) => [p.monthKey, i]));
  const polyPoints = scored
    .map((p) => {
      const xi = indexMap.get(p.monthKey)!;
      return `${PAD.left + xFor(xi)},${PAD.top + yFor(p.score)}`;
    })
    .join(" ");

  const hasData = scored.length > 0;

  return (
    <div className="bg-surface rounded-xl border border-[var(--border)] p-4 md:p-5">
      <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-dust mb-4 leading-none">
        Consistency Trend
      </p>

      {!hasData ? (
        <p className="text-[13px] text-dust text-center py-6">
          Not enough data yet. Come back next month.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full overflow-visible"
          aria-label="Monthly consistency trend"
        >
          {/* Reference band between 70 and 85 */}
          <rect
            x={PAD.left}
            y={PAD.top + yFor(85)}
            width={chartW}
            height={yFor(70) - yFor(85)}
            fill="var(--chalk)"
            rx="2"
          />

          {/* Grade threshold lines */}
          {refLines.map(({ y, label, color }) => (
            <g key={label}>
              <line
                x1={PAD.left}
                y1={PAD.top + y}
                x2={PAD.left + chartW}
                y2={PAD.top + y}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <text
                x={PAD.left - 4}
                y={PAD.top + y + 3.5}
                textAnchor="end"
                fontSize="8"
                fill={color}
                fontFamily="DM Mono, monospace"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Connecting line */}
          {scored.length > 1 && (
            <polyline
              points={polyPoints}
              fill="none"
              stroke="var(--border-md)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Month labels + dots */}
          {points.map((p, i) => {
            const x = PAD.left + xFor(i);
            const hasScore = p.score !== null;
            const score = p.score ?? 0;
            const y = PAD.top + yFor(score);

            return (
              <g key={p.monthKey}>
                {/* X-axis label */}
                <text
                  x={x}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--dust)"
                  fontFamily="DM Mono, monospace"
                >
                  {p.monthLabel}
                </text>

                {/* Dot */}
                {hasScore && (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill={gradeColor(score)}
                    />
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill={gradeColor(score)}
                      fontFamily="DM Mono, monospace"
                    >
                      {score}%
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
