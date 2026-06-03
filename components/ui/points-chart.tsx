"use client"

import * as React from "react"
import { Star } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

interface PointsChartDataPoint {
  date: string
  total: number
  change: number
}

interface PointsChartLevel {
  value: number
  color: string
}

interface PointsChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: PointsChartDataPoint[]
  height?: number
  title?: string
  headerRight?: React.ReactNode
  yAxisLabel?: string
  levels?: PointsChartLevel[]
  color?: string
  formatValue?: (v: number) => string
}

function LevelReferenceStarLabel({
  viewBox,
  color,
}: {
  viewBox?: { x?: number; y?: number } | null
  color: string
}) {
  const x = viewBox?.x
  const y = viewBox?.y
  if (typeof x !== "number" || typeof y !== "number") return null
  return (
    <g transform={`translate(${x - 14},${y})`}>
      <Star x={-5} y={-5} width={10} height={10} fill={color} stroke={color} strokeWidth={1.75} />
    </g>
  )
}

function PointsChart({
  data,
  height = 220,
  title,
  headerRight,
  yAxisLabel,
  levels,
  color = "#4E9B6F",
  formatValue = (v: number) => Math.round(v).toLocaleString(),
  className,
  ...props
}: PointsChartProps) {
  const yDomain = React.useMemo<[number, number]>(() => {
    const values = [
      ...data.map((item) => item.total),
      ...(levels?.map((level) => level.value) ?? []),
    ]
    if (values.length === 0) return [0, 100]
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue
    if (range === 0) {
      const padding = Math.max(maxValue * 0.15, 10)
      return [Math.max(0, minValue - padding), maxValue + padding]
    }
    const padding = Math.max(range * 0.12, 10)
    return [Math.max(0, minValue - padding), maxValue + padding]
  }, [data, levels])

  return (
    <div className={cn("bg-white rounded-2xl border border-[#E2E8F0] p-4", className)} {...props}>
      {(title || headerRight) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <p className="text-[13px] font-semibold text-[#0D1F3C]">{title}</p>}
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} domain={yDomain} tick={{ fill: "#CBD5E1", fontSize: 10 }} tickFormatter={formatValue} width={56}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 11, dx: -16 } : undefined}
            />
            {levels?.map((level) => (
              <ReferenceLine key={level.value} y={level.value} stroke={level.color} strokeDasharray="6 6" strokeWidth={2}
                label={{ position: "left", content: (lp: { viewBox?: unknown }) => (
                  <LevelReferenceStarLabel viewBox={(lp.viewBox as { x?: number; y?: number } | null) ?? null} color={level.color} />
                )}}
              />
            ))}
            <Tooltip
              cursor={{ stroke: color, strokeDasharray: "4 4", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as PointsChartDataPoint
                const changePrefix = row.change > 0 ? "+" : ""
                return (
                  <div className="bg-white rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm shadow-md">
                    <p className="text-[#94A3B8] mb-1 text-[11px]">{label}</p>
                    <p className="font-semibold tabular-nums text-[13px] text-[#0D1F3C]">{formatValue(row.total)}</p>
                    {row.change !== 0 && (
                      <p className="text-xs tabular-nums mt-0.5" style={{ color: row.change > 0 ? "#4E9B6F" : "#EF4444" }}>
                        {changePrefix}{formatValue(row.change)}
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Line type="monotone" dataKey="total" stroke={color} strokeWidth={2.5} connectNulls dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5, fill: color }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export { PointsChart }
export type { PointsChartDataPoint, PointsChartProps }
