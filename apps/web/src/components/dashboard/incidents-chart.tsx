"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { time: "10:00", incidents: 2 },
  { time: "11:00", incidents: 5 },
  { time: "12:00", incidents: 3 },
  { time: "13:00", incidents: 8 },
  { time: "14:00", incidents: 4 },
  { time: "15:00", incidents: 7 },
];

export function IncidentsChart() {
  return (
    <div
      className="
        rounded-3xl border
        border-zinc-800
        bg-zinc-900 p-6
      "
    >
      <div
        className="
          mb-6 flex items-center
          justify-between
        "
      >
        <div>
          <h2
            className="
              text-lg font-semibold
              text-white
            "
          >
            Incident Trends
          </h2>

          <p
            className="
              mt-1 text-sm
              text-zinc-400
            "
          >
            Realtime incident activity
          </p>
        </div>
      </div>

      <div className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" />
            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="incidents"
              stroke="#8b5cf6"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
