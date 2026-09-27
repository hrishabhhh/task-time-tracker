"use client";

import { FormEvent, useEffect, useState } from "react";

import TaskCard from "@/components/task-card";
import type { Task } from "@/types/task";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load tasks");
        }

        setTasks(data.tasks);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load tasks",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTasks();
  }, []);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create task");
      }

      setTasks((currentTasks) => [data.task, ...currentTasks]);

      setTitle("");
      setDescription("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create task",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function handleTaskUpdated(updatedTask: Task) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    );
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Create task</h2>

          <p className="mt-1 text-sm text-gray-500">
            Add something you need to work on.
          </p>
        </div>

        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Task
            </label>

            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Follow up with designer"
              maxLength={200}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>

            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add any useful details..."
              maxLength={2000}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || !title.trim()}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create task"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your tasks</h2>

            {!isLoading && (
              <p className="mt-1 text-sm text-gray-500">
                {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <h3 className="font-medium text-gray-900">No tasks yet</h3>

            <p className="mt-1 text-sm text-gray-500">
              Create your first task above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdated={handleTaskUpdated}
                onDeleted={handleTaskDeleted}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
