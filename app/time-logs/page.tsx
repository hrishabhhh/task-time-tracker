import { redirect } from "next/navigation";

import AppHeader from "@/components/app-header";
import TimeLogList from "@/components/time-log-list";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function TimeLogsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader email={user.email} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Time Logs</h1>

          <p className="mt-1 text-gray-600">
            Review your tracked work sessions.
          </p>
        </div>

        <TimeLogList />
      </div>
    </main>
  );
}
