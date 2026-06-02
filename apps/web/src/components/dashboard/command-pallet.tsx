"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  BarChart3,
  Settings,
  FileText,
  Users,
  Zap,
  LogOut,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "../ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (id: string) => void;
}

const navigationItems = [
  {
    id: "dashboard",
    label: "Go to Dashboard",
    icon: LayoutDashboard,
    shortcut: "⌘1",
  },
  {
    id: "incidents",
    label: "Go to Incidents",
    icon: AlertTriangle,
    shortcut: "⌘2",
  },
  {
    id: "monitoring",
    label: "Go to Live Monitoring",
    icon: Activity,
    shortcut: "⌘3",
  },
  {
    id: "analytics",
    label: "Go to Analytics",
    icon: BarChart3,
    shortcut: "⌘4",
  },
  { id: "settings", label: "Go to Settings", icon: Settings, shortcut: "⌘5" },
];

const actionItems = [
  { id: "new-alert", label: "Create New Alert Rule", icon: Zap },
  { id: "export", label: "Export Data", icon: FileText },
  { id: "invite", label: "Invite Team Member", icon: Users },
];

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: CommandPaletteProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (id: string) => {
    onOpenChange(false);
    onNavigate?.(id);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(item.id)}
                className="gap-3"
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelect(item.id)}
                className="gap-3"
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem className="gap-3 text-destructive">
            <LogOut className="size-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
