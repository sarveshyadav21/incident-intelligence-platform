"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  icon: React.ElementType;
  description?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-muted-foreground/30"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sidebar-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </h3>
            {change && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  change.trend === "up" ? "text-success" : "text-destructive",
                )}
              >
                {change.trend === "up" ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {change.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
}

interface DashboardStatsProps {
  className?: string;
}

export function DashboardStats({ className }: DashboardStatsProps) {
  const stats = [
    {
      title: "Total Requests",
      value: "2.4M",
      change: { value: 12.5, trend: "up" as const },
      icon: Activity,
      description: "Last 24 hours",
    },
    {
      title: "Avg Latency",
      value: "142ms",
      change: { value: 8.2, trend: "down" as const },
      icon: Clock,
      description: "P95 response time",
    },
    {
      title: "Token Usage",
      value: "847K",
      change: { value: 23.1, trend: "up" as const },
      icon: Zap,
      description: "Tokens processed",
    },
    {
      title: "Active Incidents",
      value: "3",
      icon: AlertTriangle,
      description: "1 critical, 2 warnings",
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat, index) => (
        <StatCard key={stat.title} {...stat} delay={index * 0.1} />
      ))}
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type: "success" | "warning" | "error" | "info";
  delay?: number;
}

function ActivityItem({
  title,
  description,
  time,
  type,
  delay = 0,
}: ActivityItemProps) {
  const colors = {
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-destructive",
    info: "bg-info",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50"
    >
      <div className="relative mt-1">
        <span className={cn("block size-2 rounded-full", colors[type])} />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </motion.div>
  );
}

export function RecentActivity() {
  const activities = [
    {
      title: "Latency spike detected",
      description: "Model endpoint gpt-4-turbo experiencing high latency",
      time: "2m ago",
      type: "warning" as const,
    },
    {
      title: "Auto-scaling triggered",
      description: "Scaled from 4 to 8 instances due to traffic increase",
      time: "15m ago",
      type: "info" as const,
    },
    {
      title: "Rate limit exceeded",
      description: "API key prod_xxx reached 10,000 requests/min limit",
      time: "32m ago",
      type: "error" as const,
    },
    {
      title: "New model deployed",
      description: "Successfully deployed claude-3-opus to production",
      time: "1h ago",
      type: "success" as const,
    },
    {
      title: "Cost threshold alert",
      description: "Daily spending reached 80% of budget ($4,000)",
      time: "2h ago",
      type: "warning" as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          View all
          <ArrowUpRight className="size-3" />
        </button>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} delay={0.5 + index * 0.1} />
        ))}
      </div>
    </motion.div>
  );
}

export function ModelPerformance() {
  const models = [
    {
      name: "gpt-4-turbo",
      requests: "1.2M",
      latency: "156ms",
      status: "healthy",
    },
    {
      name: "claude-3-opus",
      requests: "845K",
      latency: "203ms",
      status: "healthy",
    },
    {
      name: "gpt-3.5-turbo",
      requests: "324K",
      latency: "89ms",
      status: "warning",
    },
    {
      name: "gemini-pro",
      requests: "156K",
      latency: "178ms",
      status: "healthy",
    },
  ];

  const statusColors = {
    healthy: "bg-success",
    warning: "bg-warning",
    error: "bg-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold text-foreground">Model Performance</h3>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Configure
          <ArrowUpRight className="size-3" />
        </button>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {models.map((model, index) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    statusColors[model.status as keyof typeof statusColors],
                  )}
                />
                <span className="font-mono text-sm text-foreground">
                  {model.name}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {model.requests}
                  </p>
                  <p className="text-xs text-muted-foreground">requests</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {model.latency}
                  </p>
                  <p className="text-xs text-muted-foreground">avg latency</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
