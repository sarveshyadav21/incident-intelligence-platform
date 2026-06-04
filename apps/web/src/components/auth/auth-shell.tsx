"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield } from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  authCardVariants,
  authItemVariants,
  authShellVariants,
} from "./auth-motion";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full blur-[100px] dark:bg-violet-600/25"
        style={{ background: "var(--glow-violet)" }}
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full blur-[90px] dark:bg-fuchsia-600/20"
        style={{ background: "var(--glow-fuchsia)" }}
        animate={{
          x: [0, -35, 0],
          y: [0, 25, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(90vw,640px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        variants={authShellVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <motion.div variants={authItemVariants} className="mb-8 text-center">
          <motion.div
            variants={authItemVariants}
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-500/10 dark:shadow-violet-950/40"
          >
            <Shield className="h-7 w-7 text-violet-500 dark:text-violet-400" />
          </motion.div>
          <motion.h1
            variants={authItemVariants}
            className="bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-2xl font-semibold text-transparent"
          >
            {title}
          </motion.h1>
          <motion.p variants={authItemVariants} className="mt-2 text-sm text-muted-foreground">
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          variants={authCardVariants}
          className="rounded-3xl border border-border bg-card/90 p-8 shadow-2xl shadow-violet-500/5 backdrop-blur-xl dark:shadow-violet-950/40"
        >
          {children}
        </motion.div>

        {footer ? (
          <motion.div variants={authItemVariants} className="mt-6 text-center text-sm">
            {footer}
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
}

export function AuthFooterLink({
  text,
  href,
  linkLabel,
}: {
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <p className="text-muted-foreground">
      {text}{" "}
      <Link
        href={href}
        className="font-medium text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
