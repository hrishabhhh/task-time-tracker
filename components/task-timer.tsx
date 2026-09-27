"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDuration } from "@/lib/format-duration";
import type { TimeLog } from "@/types/time-log";

type TaskTimerProps = {
  taskId: string;
  timeLogs: TimeLog[];
  hasAnotherActiveTimer: boolean;
  onTimerStarted: (timeLog: TimeLog) => void;
  onTimerStopped: (timeLog: TimeLog) => void;
};

export default function TaskTimer({
  taskId,
  timeLogs,
  hasAnotherActiveTimer,
  onTimerStarted,
  onTimerStopped,
}: TaskTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeLog = useMemo(
    () =>
      timeLogs.find((log) => log.task_id === taskId && log.ended_at === null),
    [taskId, timeLogs],
  );

  useEffect(() => {
    if (!activeLog) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeLog]);

  const completedSeconds = useMemo(() => {
    return timeLogs
      .filter((log) => log.task_id === taskId && log.ended_at !== null)
      .reduce((total, log) => total + (log.duration_seconds ?? 0), 0);
  }, [taskId, timeLogs]);

  const activeSeconds = activeLog
    ? Math.max(
        0,
        Math.floor((now - new Date(activeLog.started_at).getTime()) / 1000),
      )
    : 0;

  const totalSeconds = completedSeconds + activeSeconds;

  async function startTimer() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/tasks/${taskId}/timer/start`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start timer");
      }

      setNow(Date.now());
      onTimerStarted(data.timeLog);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to start timer",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function stopTimer() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/tasks/${taskId}/timer/stop`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to stop timer");
      }

      onTimerStopped(data.timeLog);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to stop timer");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-5 rounded-lg bg-gray-50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Tracked time
          </p>

          <p className="mt-1 font-mono text-2xl font-semibold text-gray-900">
            {formatDuration(totalSeconds)}
          </p>

          {activeLog && (
            <p className="mt-1 text-xs text-green-700">Timer running</p>
          )}
        </div>

        {activeLog ? (
          <button
            type="button"
            onClick={stopTimer}
            disabled={isSubmitting}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Stopping..." : "Stop"}
          </button>
        ) : (
          <button
            type="button"
            onClick={startTimer}
            disabled={isSubmitting || hasAnotherActiveTimer}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Starting..." : "Start"}
          </button>
        )}
      </div>

      {hasAnotherActiveTimer && !activeLog && (
        <p className="mt-3 text-xs text-gray-500">
          Stop the currently running timer before starting this one.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
