"use client";

import { motion } from "framer-motion";

import Link from "next/link";
import { Search, Bell, Command, Circle, ChevronDown, Sparkles } from "lucide-react";
import { useSocket } from "../../providers/socket-provider";
import { PORTFOLIO_CONNECT_LABEL, PORTFOLIO_URL } from "../../lib/portfolio";
import { useAuth } from "../../providers/auth-provider";
import { ThemeToggle } from "../theme/theme-toggle";

export function Topbar() {
  const { isConnected } = useSocket();
  const { user, logout } = useAuth();
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) ?? ""}`.toUpperCase()
    : "U";
  const displayName = user
    ? user.isGuest
      ? "Guest"
      : `${user.firstName} ${user.lastName ?? ""}`.trim()
    : "User";
  return (
    <header
      className="
        sticky top-0 z-40
        border-b border-border
        bg-card/80
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex h-20 items-center
          justify-between px-6
        "
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{
              scale: 1.02,
            }}
            className="
              flex items-center gap-3
              rounded-2xl border
              border-border
              bg-card/80
              px-4 py-3
            "
          >
            <Search size={18} className="text-muted-foreground" />

            <input
              placeholder="Search incidents..."
              className="
                w-[260px] bg-transparent
                text-sm text-foreground
                outline-none
                placeholder:text-muted-foreground
              "
            />

            <div
              className="
                flex items-center gap-1
                rounded-lg border
                border-border
                px-2 py-1
                text-xs text-muted-foreground
              "
            >
              <Command size={12} />K
            </div>
          </motion.div>

          <div
            className={`
    hidden items-center gap-2
    rounded-full border
    px-3 py-1.5
    text-xs font-medium
    md:flex

    ${
      isConnected
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
        : "border-red-500/20 bg-red-500/10 text-red-400"
    }
  `}
          >
            <Circle
              size={8}
              className={
                isConnected
                  ? "fill-emerald-400 text-emerald-400"
                  : "fill-red-400 text-red-400"
              }
            />

            {isConnected ? "Realtime Connected" : "Realtime Disconnected"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Link
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              hidden items-center gap-2 rounded-2xl border
              border-violet-500/30 bg-gradient-to-r
              from-violet-600/20 to-fuchsia-600/10
              px-4 py-2.5 text-sm font-medium
              text-violet-200 transition-all duration-200
              hover:border-violet-400/50 hover:text-foreground
              md:inline-flex
            "
          >
            <Sparkles className="h-4 w-4" />
            {PORTFOLIO_CONNECT_LABEL}
          </Link>

          <button
            className="
              relative flex h-11 w-11
              items-center justify-center
              rounded-2xl border
              border-border
              bg-card/80
              text-muted-foreground
              transition-all duration-200
              hover:bg-muted
              hover:text-foreground
            "
          >
            <Bell size={18} />

            <span
              className="
                absolute right-3 top-3
                h-2 w-2 rounded-full
                bg-red-500
              "
            />
          </button>

          <motion.button
            type="button"
            onClick={() => void logout()}
            whileHover={{
              scale: 1.02,
            }}
            className="
              flex items-center gap-3
              rounded-2xl border
              border-border
              bg-card/80
              px-3 py-2
              transition-all duration-200
              hover:border-violet-500/30
              hover:bg-muted
            "
          >
            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-full
                bg-violet-500/20
                text-sm font-bold
                text-violet-400
              "
            >
              {initials}
            </div>

            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {user?.isGuest ? "Guest session" : user?.email ?? "Signed in"}
              </p>
            </div>

            <ChevronDown size={16} className="text-muted-foreground" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
