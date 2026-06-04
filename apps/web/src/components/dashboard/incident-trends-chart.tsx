"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis, 
  Brush,
} from "recharts";
import { useState } from "react";
import { useChartTheme } from "@/lib/chart-theme";

function formatHour(time: string, format: "12h" | "24h") {
  if (format === "24h") {
    return time;
  }

  const hour = Number(time.split(":")[0]);

  const suffix = hour >= 12 ? "PM" : "AM";

  const formattedHour = hour % 12 || 12;

  return `${formattedHour} ${suffix}`;
}

type Props = {
  data: {
    time: string;
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  }[];
  timeFormat: "12h" | "24h";
};

export function IncidentTrendsChart({ data, timeFormat }: Props) {
  const chart = useChartTheme();
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: 23,
  });
  return (
    <div
      className="
  rounded-3xl border
  border-border
  bg-card p-6
  [&_*:focus]:outline-none
  [&_*:focus]:ring-0
"
    >
      <div className="mb-6">
        <h2
          className="
            text-lg font-semibold
            text-foreground
          "
        >
          Incident Trends
        </h2>

        <p
          className="
            mt-1 text-sm
            text-muted-foreground
          "
        >
          Realtime incident severity trends
        </p>
      </div>

      <div className="h-80 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={(data ?? []).slice(visibleRange.start, visibleRange.end + 1)}
          >
            <defs>
              <linearGradient id="critical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="high" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />

            <XAxis
              dataKey="time"
              stroke={chart.axis}
              interval={0}
              minTickGap={20}
              tickFormatter={(value) => formatHour(value, timeFormat)}
            />

            <YAxis stroke={chart.axis} />

            <Tooltip
              contentStyle={{
                background: chart.tooltipBg,
                border: `1px solid ${chart.tooltipBorder}`,
                borderRadius: "16px",
                color: chart.tooltipText,
                backdropFilter: "blur(12px)",
              }}
              labelStyle={{
                color: chart.axis,
                fontWeight: 600,
              }}
              itemStyle={{
                color: chart.tooltipText,
              }}
              cursor={false}
            />

            <Area
              type="monotone"
              dataKey="CRITICAL"
              stackId="1"
              stroke="#f97316"
              fill="url(#critical)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#f97316",
                stroke: "none",
                strokeWidth: 0,
              }}
              connectNulls
              isAnimationActive={true}
              strokeWidth={2}
              style={{
                outline: "none",
              }}
            />

            <Area
              type="monotone"
              dataKey="HIGH"
              stackId="1"
              stroke="#f97316"
              fill="url(#high)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#f97316",
                stroke: "none",
                strokeWidth: 0,
              }}
              connectNulls
              isAnimationActive={true}
              strokeWidth={2}
              style={{
                outline: "none",
              }}
            />

            <Area
              type="monotone"
              dataKey="MEDIUM"
              stackId="1"
              stroke="#eab308"
              fill="#eab30833"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#f97316",
                stroke: "none",
                strokeWidth: 0,
              }}
              connectNulls
              isAnimationActive={true}
              strokeWidth={2}
              style={{
                outline: "none",
              }}
            />

            <Area
              type="monotone"
              dataKey="LOW"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f633"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#f97316",
                stroke: "none",
                strokeWidth: 0,
              }}
              connectNulls
              isAnimationActive={true}
              strokeWidth={2}
              style={{
                outline: "none",
              }}
            />
            <Brush
              dataKey="time"
              height={30}
              stroke={chart.axis}
              travellerWidth={12}
              fill={chart.tooltipBg}
              tickFormatter={(value) => formatHour(value, timeFormat)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
