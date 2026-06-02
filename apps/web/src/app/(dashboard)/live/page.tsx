export default function LivePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-zinc-500">Realtime</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Live Operations
        </h1>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">
          Live incident processing events are available from the incident
          dashboard activity feed.
        </p>
      </div>
    </div>
  );
}
