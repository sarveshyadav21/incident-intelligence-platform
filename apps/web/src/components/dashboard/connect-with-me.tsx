"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle, Sparkles, UserRound } from "lucide-react";

import { PORTFOLIO_CONNECT_LABEL, PORTFOLIO_URL } from "../../lib/portfolio";

type Props = {
  collapsed?: boolean;
};

export function ConnectWithMe({ collapsed = false }: Props) {
  return (
    <motion.a
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="
        group relative block overflow-hidden
        rounded-2xl border border-violet-500/25
        bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-cyan-500/10
        p-3 transition-all duration-300
        hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-500/10
      "
    >
      <div
        className="
          pointer-events-none absolute -right-6 -top-6
          h-20 w-20 rounded-full bg-violet-500/20 blur-2xl
          transition group-hover:bg-violet-500/30
        "
      />

      <div className="relative flex items-center gap-3">
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl bg-violet-500/25 text-violet-300
          "
        >
          <UserRound className="h-5 w-5" />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
              {PORTFOLIO_CONNECT_LABEL}
              <ArrowUpRight className="h-3.5 w-3.5 text-violet-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Portfolio · AI chat · Projects
            </p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="relative mt-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
            <Sparkles className="h-3 w-3 text-fuchsia-400" />
            Gemini AI
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
            <MessageCircle className="h-3 w-3 text-cyan-400" />
            Live chat
          </span>
        </div>
      )}
    </motion.a>
  );
}
