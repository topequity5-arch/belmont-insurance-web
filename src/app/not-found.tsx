import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">404</p>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-4 text-slate-600">
          The page you are looking for does not exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
