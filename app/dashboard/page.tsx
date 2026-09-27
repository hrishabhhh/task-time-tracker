import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

            <p className="mt-1 text-sm text-gray-600">
              Signed in as {user.email}
            </p>
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

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-gray-600">Your tasks will appear here.</p>
        </div>
      </div>
    </main>
  );
}
