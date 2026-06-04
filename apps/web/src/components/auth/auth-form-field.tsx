"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { authFieldVariants } from "./auth-motion";

type Props = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export function AuthFormField({ label, children, hint }: Props) {
  return (
    <motion.div variants={authFieldVariants} className="space-y-2">
      <label className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </motion.div>
  );
}
