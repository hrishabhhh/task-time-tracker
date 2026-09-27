"use client";

import { useState } from "react";

import type { Task, TaskStatus } from "@/types/task";
import TaskTimer from "@/components/task-timer";
import type { TimeLog } from "@/types/time-log";

type TaskCardProps = {
  task: Task;
  timeLogs: TimeLog[];
  hasAnotherActiveTimer: boolean;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
  onTimerStarted: (timeLog: TimeLog) => void;
  onTimerStopped: (timeLog: TimeLog) => void;
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function TaskCard({
  task,
  timeLogs,
  hasAnotherActiveTimer,
  onUpdated,
  onDeleted,
  onTimerStarted,
  onTimerStopped,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function updateTask(
    updates: Partial<{
      title: string;
      description: string | null;
      status: TaskStatus;
    }>,
  ) {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update task");
      }

      onUpdated(data.task);

      return true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update task",
      );

      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    const saved = await updateTask({
      title,
      description: description.trim() || null,
    });

    if (saved) {
      setIsEditing(false);
    }
  }

  async function handleStatusChange(status: TaskStatus) {
    await updateTask({ status });
  }

  async function handleDelete() {
    const shouldDelete = window.confirm(`Delete "${task.title}"?`);

    if (!shouldDelete) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error ?? "Failed to delete task");
      }

      onDeleted(task.id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete task",
      );

      setIsSaving(false);
    }
  }
  const hasActiveTimer = timeLogs.some(
    (log) => log.task_id === task.id && log.ended_at === null,
  );

  if (isEditing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`title-${task.id}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Title
            </label>

            <input
              id={`title-${task.id}`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor={`description-${task.id}`}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id={`description-${task.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => {
                setTitle(task.title);
                setDescription(task.description ?? "");
                setError("");
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900">{task.title}</h3>

          {task.description && (
            <p className="mt-2 text-sm text-gray-600">{task.description}</p>
          )}

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <select
          value={task.status}
          onChange={(event) =>
            handleStatusChange(event.target.value as TaskStatus)
          }
          disabled={isSaving}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <TaskTimer
        taskId={task.id}
        timeLogs={timeLogs}
        hasAnotherActiveTimer={hasAnotherActiveTimer}
        onTimerStarted={onTimerStarted}
        onTimerStopped={onTimerStopped}
      />
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          Created {new Date(task.created_at).toLocaleDateString()}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={isSaving}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving || hasActiveTimer}
            title={
              hasActiveTimer
                ? "Stop the timer before deleting this task"
                : undefined
            }
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
