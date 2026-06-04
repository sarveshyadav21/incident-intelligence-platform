"use client";

import { useState } from "react";
import { Copy, Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Postmortem } from "../../features/incidents/types/incident.type";

type Props = {
  postmortem: Postmortem | null | undefined;
};

export function IncidentPostmortem({ postmortem }: Props) {
  const [view, setView] = useState<"preview" | "markdown">("preview");

  if (!postmortem) {
    return (
      <p className="text-sm text-zinc-500">
        Postmortem generates automatically after successful analysis.
      </p>
    );
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(postmortem.markdown);
    toast.success("Postmortem copied to clipboard");
  };

  const downloadMarkdown = () => {
    const blob = new Blob([postmortem.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "incident-postmortem.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html><head><title>Incident Postmortem</title></head>
      <body style="font-family: system-ui; padding: 24px; white-space: pre-wrap;">
      ${postmortem.markdown.replace(/\n/g, "<br>")}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const sections = postmortem.sections as Record<string, string>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-zinc-800"
          onClick={() => setView(view === "preview" ? "markdown" : "preview")}
        >
          <FileText className="h-4 w-4" />
          {view === "preview" ? "Raw markdown" : "Formatted view"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-zinc-800"
          onClick={copyToClipboard}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-zinc-800"
          onClick={downloadMarkdown}
        >
          <Download className="h-4 w-4" />
          Markdown
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-zinc-800"
          onClick={downloadPdf}
        >
          <Download className="h-4 w-4" />
          PDF
        </Button>
      </div>

      {view === "preview" ? (
        <div className="space-y-4">
          {Object.entries(sections).map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                {formatSectionTitle(key)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <pre className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-6 text-zinc-400">
          {postmortem.markdown}
        </pre>
      )}
    </div>
  );
}

function formatSectionTitle(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}
