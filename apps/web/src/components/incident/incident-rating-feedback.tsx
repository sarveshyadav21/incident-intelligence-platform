"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { useCreateRatingFeedback } from "../../features/incidents/hooks/use-incident-mutations";

type Props = {
  incidentId: string;
};

const CATEGORIES = [
  { id: "rootCauseAccuracy", label: "Root cause accuracy" },
  { id: "recommendationQuality", label: "Recommendation quality" },
  { id: "overallUsefulness", label: "Overall analysis usefulness" },
] as const;

export function IncidentRatingFeedback({ incidentId }: Props) {
  const createRating = useCreateRatingFeedback(incidentId);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const submitRating = (category: string, rating: number) => {
    setRatings((current) => ({ ...current, [category]: rating }));

    createRating.mutate(
      {
        category: category as (typeof CATEGORIES)[number]["id"],
        rating,
      },
      {
        onSuccess: () => toast.success("Feedback saved"),
        onError: () => toast.error("Failed to save feedback"),
      },
    );
  };

  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => (
        <div key={category.id}>
          <p className="text-sm text-muted-foreground">{category.label}</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => submitRating(category.id, value)}
                className="rounded p-1 transition hover:bg-muted"
              >
                <Star
                  className={`h-5 w-5 ${
                    (ratings[category.id] ?? 0) >= value
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
