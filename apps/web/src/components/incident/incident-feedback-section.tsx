"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateIncidentFeedback } from "../../features/incidents/hooks/use-incident-mutations";

import type {
  FeedbackField,
  IncidentFeedback,
} from "../../features/incidents/types/incident.type";

type Props = {
  incidentId: string;
  field: FeedbackField;
  label: string;
  value?: string | null;
  feedback: IncidentFeedback[];
};

export function IncidentFeedbackSection({
  incidentId,
  field,
  label,
  value,
  feedback,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const createFeedback = useCreateIncidentFeedback(incidentId);

  const latestFeedback = feedback.find((item) => item.field === field);
  const isVerified = latestFeedback?.action === "ACCEPT";
  const isRejected = latestFeedback?.action === "REJECT";

  const submit = (action: "ACCEPT" | "REJECT" | "EDIT") => {
    createFeedback.mutate(
      {
        field,
        action,
        originalValue: value ?? undefined,
        correctedValue: action === "EDIT" ? draft : undefined,
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  };

  if (!value) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {isVerified && (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-400">
            Human verified
          </span>
        )}
        {isRejected && (
          <span className="rounded-full border border-red-500/20 bg-red-500/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-400">
            Rejected
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {!editing && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={createFeedback.isPending}
              onClick={() => submit("ACCEPT")}
              className="h-8 gap-1 border-border bg-card px-2 text-xs text-emerald-400"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={createFeedback.isPending}
              onClick={() => {
                setDraft(value);
                setEditing(true);
              }}
              className="h-8 gap-1 border-border bg-card px-2 text-xs text-violet-400"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={createFeedback.isPending}
              onClick={() => submit("REJECT")}
              className="h-8 gap-1 border-border bg-card px-2 text-xs text-red-400"
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
          </>
        )}
      </div>

      {editing && (
        <div className="w-full space-y-2">
          <p className="text-xs text-muted-foreground">Edit {label}</p>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-24 border-border bg-card text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => submit("EDIT")}
              disabled={createFeedback.isPending || draft.trim().length < 3}
              className="bg-violet-600 hover:bg-violet-500"
            >
              Save correction
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              className="border-border"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
