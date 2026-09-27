import Link from "next/link";

type AppHeaderProps = {
  email: string | null;
};

export default function AppHeader({ email }: AppHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Link
            href="/dashboard"
            className="text-xl font-semibold text-gray-900"
          >
            Task Tracker
          </Link>

          {email && <p className="mt-0.5 text-sm text-gray-500">{email}</p>}
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="font-medium text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>

            <Link
              href="/time-logs"
              className="font-medium text-gray-600 hover:text-gray-900"
            >
              Time Logs
            </Link>
          </nav>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
