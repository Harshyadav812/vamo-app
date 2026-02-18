import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        This page doesn&apos;t exist — or maybe it was a vibe that never shipped.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        ← Back to Home
      </Link>
    </div>
  );
}
