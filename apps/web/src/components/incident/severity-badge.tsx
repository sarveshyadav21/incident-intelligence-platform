type Props = {
  severity: string;
};

const severityStyles = {
  LOW: "bg-blue-500/15 text-blue-400 border-blue-500/20",

  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",

  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/20",

  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",

  PENDING: "border-blue-500/20 text-blue-400 bg-blue-500/5",
};

export function SeverityBadge({ severity }: Props) {
  return (
    <div
      className={`
        inline-flex items-center
        rounded-full border
        px-3 py-1 text-xs
        font-semibold

        ${severityStyles[severity as keyof typeof severityStyles]}
      `}
    >
      {severity}
    </div>
  );
}
