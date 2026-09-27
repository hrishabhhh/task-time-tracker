import { redirect } from "next/navigation";

import TaskManager from "@/components/task-manager";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Task Tracker
            </h1>

            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Tasks</h2>

          <p className="mt-1 text-gray-600">
            Manage what you need to get done.
          </p>
        </div>

        <TaskManager />
      </div>
    </main>
  );
}
