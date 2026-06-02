"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";

import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Incidents",
    href: "/incidents",
    icon: AlertTriangle,
    badge: 3,
  },
  {
    label: "Live Monitoring",
    href: "/live",
    icon: Activity,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <motion.aside
      animate={{
        width: collapsed ? 88 : 280,
      }}
      transition={{
        duration: 0.25,
      }}
      className="
        relative flex min-h-screen flex-col
        border-r border-zinc-800
        bg-zinc-950/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          flex items-center justify-between
          border-b border-zinc-800
          px-5 py-5
        "
      >
        {!collapsed && (
          <motion.div
            initial={{
              opacity: 0,
              x: -10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -10,
            }}
          >
            <h1
              className="
                text-2xl font-bold
                tracking-tight
                text-white
              "
            >
              AI Ops
            </h1>

            <p
              className="
                mt-1 text-xs
                text-zinc-400
              "
            >
              Incident Intelligence
            </p>
          </motion.div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="
            flex h-9 w-9 items-center
            justify-center rounded-xl
            border border-zinc-800
            bg-zinc-900 text-zinc-400
            transition-all duration-200
            hover:bg-zinc-800
            hover:text-white
          "
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav
        className="
          flex flex-1 flex-col
          gap-2 p-4
        "
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive = pathname === item.href;

          return (
            <motion.div
              key={item.href}
              whileHover={{
                x: 4,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              <Link
                href={item.href}
                className={`
                  relative flex items-center
                  gap-3 overflow-hidden
                  rounded-2xl px-4 py-3
                  transition-all duration-200

                  ${
                    isActive
                      ? "bg-white text-black shadow-lg"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="
                      absolute inset-0
                      rounded-2xl bg-white
                    "
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}

                <div className="relative z-10">
                  <Icon size={20} />
                </div>

                {!collapsed && (
                  <>
                    <span
                      className="
                        relative z-10
                        text-sm font-medium
                      "
                    >
                      {item.label}
                    </span>

                    {item.badge && (
                      <div
                        className="
                          relative z-10 ml-auto
                          flex h-6 min-w-6
                          items-center justify-center
                          rounded-full
                          bg-red-500 px-2
                          text-xs font-semibold
                          text-white
                        "
                      >
                        {item.badge}
                      </div>
                    )}
                  </>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div
        className="
          border-t border-zinc-800
          p-4
        "
      >
        <div
          className="
            flex items-center gap-3
            rounded-2xl border
            border-zinc-800
            bg-zinc-900/80 p-3
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

          {!collapsed && (
            <div className="flex-1">
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
          )}
        </div>
      </div>
    </motion.aside>
  );
}
