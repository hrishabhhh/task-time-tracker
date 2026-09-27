"use client";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/format-duration";
import type { Task } from "@/types/task";
import type { TimeLog } from "@/types/time-log";

export default function TimeLogList() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [logsResponse, tasksResponse] = await Promise.all([
          fetch("/api/time-logs"),
          fetch("/api/tasks"),
        ]);

        const logsData = await logsResponse.json();
        const tasksData = await tasksResponse.json();

        if (!logsResponse.ok) {
          throw new Error(logsData.error ?? "Failed to load time logs");
        }

        if (!tasksResponse.ok) {
          throw new Error(tasksData.error ?? "Failed to load tasks");
        }

        setTimeLogs(logsData.timeLogs);
        setTasks(tasksData.tasks);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load time logs",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  function getTaskTitle(taskId: string) {
    return tasks.find((task) => task.id === taskId)?.title ?? "Deleted task";
  }

  async function handleDelete(timeLog: TimeLog) {
    if (timeLog.ended_at === null) {
      return;
    }

    const shouldDelete = window.confirm("Delete this time log?");

    if (!shouldDelete) {
      return;
    }

    setDeletingId(timeLog.id);
    setError("");

    try {
      const response = await fetch(`/api/time-logs/${timeLog.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error ?? "Failed to delete time log");
      }

      setTimeLogs((currentLogs) =>
        currentLogs.filter((log) => log.id !== timeLog.id),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete time log",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Loading time logs...
      </div>
    );
  }

  if (timeLogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="font-medium text-gray-900">No time logs yet</h2>

        <p className="mt-1 text-sm text-gray-500">
          Start and stop a task timer to create your first time log.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Task</th>

                <th className="px-5 py-3">Started</th>

                <th className="px-5 py-3">Ended</th>

                <th className="px-5 py-3">Duration</th>

                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {timeLogs.map((timeLog) => {
                const isRunning = timeLog.ended_at === null;

                return (
                  <tr key={timeLog.id} className="text-sm text-gray-700">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {getTaskTitle(timeLog.task_id)}
                    </td>

                    <td className="px-5 py-4">
                      {new Date(timeLog.started_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      {timeLog.ended_at
                        ? new Date(timeLog.ended_at).toLocaleString()
                        : "Running"}
                    </td>

                    <td className="px-5 py-4 font-mono">
                      {isRunning
                        ? "Running"
                        : formatDuration(timeLog.duration_seconds ?? 0)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(timeLog)}
                        disabled={isRunning || deletingId === timeLog.id}
                        title={isRunning ? "Stop the timer first" : undefined}
                        className="font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId === timeLog.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
