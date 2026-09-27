"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDuration } from "@/lib/format-duration";
import type { Task, TaskStatus } from "@/types/task";
import type { TimeLog } from "@/types/time-log";

type DailySummaryProps = {
  tasks: Task[];
  timeLogs: TimeLog[];
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function DailySummary({ tasks, timeLogs }: DailySummaryProps) {
  const [now, setNow] = useState(() => Date.now());

  const hasActiveTimer = timeLogs.some((log) => log.ended_at === null);

  useEffect(() => {
    if (!hasActiveTimer) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasActiveTimer]);

  const summary = useMemo(() => {
    const todayStart = new Date(now);

    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);

    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const startMs = todayStart.getTime();
    const endMs = tomorrowStart.getTime();

    const taskSeconds = new Map<string, number>();

    for (const log of timeLogs) {
      const logStart = new Date(log.started_at).getTime();

      const logEnd = log.ended_at ? new Date(log.ended_at).getTime() : now;

      const overlapStart = Math.max(logStart, startMs);

      const overlapEnd = Math.min(logEnd, endMs);

      if (overlapEnd <= overlapStart) {
        continue;
      }

      const seconds = Math.floor((overlapEnd - overlapStart) / 1000);

      taskSeconds.set(
        log.task_id,
        (taskSeconds.get(log.task_id) ?? 0) + seconds,
      );
    }

    const totalSeconds = Array.from(taskSeconds.values()).reduce(
      (total, seconds) => total + seconds,
      0,
    );

    const workedTasks = tasks
      .filter((task) => taskSeconds.has(task.id))
      .map((task) => ({
        ...task,
        trackedSeconds: taskSeconds.get(task.id) ?? 0,
      }));

    const completedCount = tasks.filter(
      (task) => task.status === "completed",
    ).length;

    const pendingCount = tasks.filter(
      (task) => task.status === "pending",
    ).length;

    const inProgressCount = tasks.filter(
      (task) => task.status === "in_progress",
    ).length;

    return {
      totalSeconds,
      workedTasks,
      completedCount,
      pendingCount,
      inProgressCount,
    };
  }, [now, tasks, timeLogs]);

  const openTasks = tasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress",
  );

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Today</h2>

        <p className="mt-1 text-sm text-gray-500">
          Your productivity summary for today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Tracked today"
          value={formatDuration(summary.totalSeconds)}
        />

        <SummaryCard
          label="Tasks worked on"
          value={String(summary.workedTasks.length)}
        />

        <SummaryCard label="Completed" value={String(summary.completedCount)} />

        <SummaryCard
          label="Open tasks"
          value={String(summary.pendingCount + summary.inProgressCount)}
          detail={`${summary.pendingCount} pending · ${summary.inProgressCount} in progress`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-900">Worked on today</h3>

          {summary.workedTasks.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              No tracked work yet today.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-gray-100">
              {summary.workedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {statusLabels[task.status]}
                    </p>
                  </div>

                  <span className="font-mono text-sm text-gray-700">
                    {formatDuration(task.trackedSeconds)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-900">Pending & in progress</h3>

          {openTasks.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No open tasks.</p>
          ) : (
            <div className="mt-3 divide-y divide-gray-100">
              {openTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {task.title}
                  </p>

                  <span className="text-xs text-gray-500">
                    {statusLabels[task.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  detail?: string;
};

function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>

      {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
    </div>
  );
}
