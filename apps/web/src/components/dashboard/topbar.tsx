"use client";

import { motion } from "framer-motion";

import { Search, Bell, Command, Circle, ChevronDown } from "lucide-react";
import { useSocket } from "../../providers/socket-provider";

export function Topbar() {
  const { isConnected } = useSocket();
  return (
    <header
      className="
        sticky top-0 z-40
        border-b border-zinc-800
        bg-zinc-950/80
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
              border-zinc-800
              bg-zinc-900/80
              px-4 py-3
            "
          >
            <Search size={18} className="text-zinc-500" />

            <input
              placeholder="Search incidents..."
              className="
                w-[260px] bg-transparent
                text-sm text-white
                outline-none
                placeholder:text-zinc-500
              "
            />

            <div
              className="
                flex items-center gap-1
                rounded-lg border
                border-zinc-700
                px-2 py-1
                text-xs text-zinc-400
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
          <button
            className="
              relative flex h-11 w-11
              items-center justify-center
              rounded-2xl border
              border-zinc-800
              bg-zinc-900/80
              text-zinc-400
              transition-all duration-200
              hover:bg-zinc-800
              hover:text-white
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
            whileHover={{
              scale: 1.02,
            }}
            className="
              flex items-center gap-3
              rounded-2xl border
              border-zinc-800
              bg-zinc-900/80
              px-3 py-2
              transition-all duration-200
              hover:bg-zinc-800
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
              SY
            </div>

            <div className="hidden text-left md:block">
              <p
                className="
                  text-sm font-medium
                  text-white
                "
              >
                Sarvesh
              </p>

              <p
                className="
                  text-xs text-zinc-400
                "
              >
                AI Engineer
              </p>
            </div>

            <ChevronDown size={16} className="text-zinc-500" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
