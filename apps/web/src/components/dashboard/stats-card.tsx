"use client";

import { motion } from "framer-motion";

import { LucideIcon } from "lucide-react";

type Props = {
  title: string;

  value: string | number;

  icon: LucideIcon;

  description: string;

  color: string;
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color,
}: Props) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.2,
      }}
      className="
        relative overflow-hidden
        rounded-3xl border
        border-border
        bg-card/70
        p-6 backdrop-blur-xl
      "
    >
      <div
        className={`
          absolute right-0 top-0
          h-32 w-32 rounded-full
          blur-3xl opacity-20
          ${color}
        `}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p
              className="
                text-sm font-medium
                text-muted-foreground
              "
            >
              {title}
            </p>

            <h3
              className="
                mt-4 text-4xl
                font-bold tracking-tight
                text-white
              "
            >
              {value}
            </h3>
          </div>

          <div
            className="
              flex h-14 w-14
              items-center justify-center
              rounded-2xl
              bg-white/5
            "
          >
            <Icon size={28} className="text-white" />
          </div>
        </div>

        <p
          className="
            mt-6 text-sm
            text-muted-foreground
          "
        >
          {description}
        </p>
      </div>
      
    </motion.div>
  );
}
