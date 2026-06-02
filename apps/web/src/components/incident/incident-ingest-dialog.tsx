"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAnalyzeAndStoreIncident } from "../../features/incidents/hooks/use-incident-mutations";

import type { IncidentSeverity } from "../../features/incidents/types/incident.type";
import { INCIDENT_SEVERITIES } from "../../features/incidents/types/incident.type";

export function IncidentIngestDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("HIGH");
  const [logs, setLogs] = useState("");
  const analyzeAndStore = useAnalyzeAndStoreIncident();

  const handleSubmit = async () => {
    if (title.trim().length < 5 || logs.trim().length < 10) {
      return;
    }

    await analyzeAndStore.mutateAsync({
      title: title.trim(),
      severity,
      logs: logs.trim(),
    });

    setOpen(false);
    setTitle("");
    setLogs("");
    setSeverity("HIGH");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-500">
          <Sparkles className="h-4 w-4" />
          Analyze logs with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit incident for AI analysis</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Paste logs or alert text. The platform will embed, retrieve similar
            incidents, run multi-agent analysis, and persist results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase text-zinc-500">
              Title
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Payment API timeout spike"
              className="mt-2 border-zinc-800 bg-zinc-900"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase text-zinc-500">
              Initial severity
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INCIDENT_SEVERITIES.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    severity === level
                      ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase text-zinc-500">
              Logs / alert payload
            </label>
            <Textarea
              value={logs}
              onChange={(event) => setLogs(event.target.value)}
              placeholder="Paste stack traces, metrics alerts, or log excerpts..."
              className="mt-2 min-h-48 border-zinc-800 bg-zinc-900 font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              analyzeAndStore.isPending ||
              title.trim().length < 5 ||
              logs.trim().length < 10
            }
            className="w-full bg-violet-600 hover:bg-violet-500"
          >
            {analyzeAndStore.isPending
              ? "Queuing analysis..."
              : "Run full AI pipeline"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
