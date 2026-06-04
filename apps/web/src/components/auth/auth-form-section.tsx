"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { authDividerVariants, authFieldVariants } from "./auth-motion";

const formStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

type Props = {
  children: ReactNode;
  className?: string;
};

export function AuthFormSection({ children, className }: Props) {
  return (
    <motion.div
      variants={formStagger}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AuthDivider() {
  return (
    <motion.div
      variants={authDividerVariants}
      className="my-6 flex items-center gap-3"
    >
      <div className="h-px flex-1 origin-center bg-muted" />
      <span className="text-xs text-muted-foreground">or</span>
      <div className="h-px flex-1 origin-center bg-muted" />
    </motion.div>
  );
}

export function AuthActions({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={formStagger}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {children}
    </motion.div>
  );
}

export { authFieldVariants };
