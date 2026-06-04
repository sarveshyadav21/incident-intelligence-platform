export default function LivePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Realtime</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Live Operations
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Live incident processing events are available from the incident
          dashboard activity feed.
        </p>
      </div>
    </div>
  );
}
