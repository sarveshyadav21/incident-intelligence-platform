"use client";

import { Upload, Trash2, RefreshCw, FileText, Image as ImageIcon } from "lucide-react";

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

const ACCEPTED_TYPES =
  ".log,.txt,.json,.csv,.pdf,.png,.jpg,.jpeg,.webp,.gif";

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
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground/80 transition hover:border-violet-500/30 hover:text-foreground">
          <Upload className="h-4 w-4" />
          {uploadFile.isPending ? "Uploading..." : "Upload evidence"}
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
          />
        </label>

        <Button
          variant="outline"
          size="sm"
          disabled={reanalyze.isPending}
          onClick={() => reanalyze.mutate(incidentId)}
          className="gap-2 border-border bg-card text-foreground/80 hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Re-run AI with uploads
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Supports log files, screenshots, PDFs, Datadog exports (JSON), and
        incident reports.
      </p>

      {uploads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No attachments yet. Upload evidence to enrich analysis.
        </p>
      ) : (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {upload.mimeType?.startsWith("image/") ? (
                    <ImageIcon className="mt-0.5 h-4 w-4 text-cyan-400" />
                  ) : (
                    <FileText className="mt-0.5 h-4 w-4 text-violet-400" />
                  )}
                  <div>
                    <p className="text-sm text-zinc-200">{upload.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {upload.status ?? "PARSED"} · {upload.mimeType}
                      {upload.fileSize
                        ? ` · ${(upload.fileSize / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteUpload.mutate(upload.id)}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {upload.previewUrl && upload.mimeType?.startsWith("image/") && (
                <img
                  src={upload.previewUrl}
                  alt={upload.fileName}
                  className="mt-3 max-h-48 rounded-lg border border-border object-contain"
                />
              )}

              {upload.parsedText && !upload.mimeType?.startsWith("image/") && (
                <pre className="mt-3 max-h-32 overflow-auto rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                  {upload.parsedText.slice(0, 500)}
                  {upload.parsedText.length > 500 ? "…" : ""}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
