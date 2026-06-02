"use client";

import { Upload, Trash2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useDeleteIncidentUpload,
  useReanalyzeIncident,
  useUploadIncidentFile,
} from "../../features/incidents/hooks/use-incident-mutations";

import type { IncidentUpload } from "../../features/incidents/types/incident.type";

type Props = {
  incidentId: string;
  uploads: IncidentUpload[];
};

export function IncidentUploadPanel({ incidentId, uploads }: Props) {
  const uploadFile = useUploadIncidentFile(incidentId);
  const deleteUpload = useDeleteIncidentUpload(incidentId);
  const reanalyze = useReanalyzeIncident();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      uploadFile.mutate(file);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition hover:border-violet-500/30 hover:text-white">
          <Upload className="h-4 w-4" />
          {uploadFile.isPending ? "Uploading..." : "Attach log file"}
          <input
            type="file"
            className="hidden"
            accept=".log,.txt,.json,.csv"
            onChange={handleFileChange}
          />
        </label>

        <Button
          variant="outline"
          size="sm"
          disabled={reanalyze.isPending}
          onClick={() => reanalyze.mutate(incidentId)}
          className="gap-2 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Re-run AI with uploads
        </Button>
      </div>

      {uploads.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No attachments yet. Upload logs to enrich analysis.
        </p>
      ) : (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
            >
              <div>
                <p className="text-sm text-zinc-200">{upload.fileName}</p>
                <p className="text-xs text-zinc-500">
                  {upload.status ?? "PARSED"} ·{" "}
                  {new Date(upload.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteUpload.mutate(upload.id)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
