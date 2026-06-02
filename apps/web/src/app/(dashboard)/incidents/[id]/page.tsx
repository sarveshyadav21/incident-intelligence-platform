type IncidentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-zinc-500">Incident</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {id}
        </h1>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-400">
          Open the incident from the main incident dashboard to view the current
          AI investigation workspace.
        </p>
      </div>
    </div>
  );
}
