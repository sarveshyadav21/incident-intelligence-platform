"use client";

import { Activity } from "lucide-react";

type Props = {
  activities: string[];
};

export function LiveActivityFeed({ activities }: Props) {
  return (
    <div className="flex max-h-[220px] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-xl">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">Live System Activity</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            AI pipeline events
          </h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          <Activity className="h-5 w-5 text-violet-400" />
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Waiting for realtime AI pipeline events...
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div
                key={`${activity}-${index}`}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-300"
              >
                {activity}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
