import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">
          &gt;&gt;&gt; vamo
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="space-y-4">
          <h2 className="text-5xl font-bold tracking-tight">
            Build your startup,
            <br />
            <span className="text-gray-500">earn pineapples 🍍</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Vamo helps non-technical founders iterate on their startup UI
            and business progress. Chat with AI, track traction, and earn
            rewards along the way.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/signup">
            <Button size="lg" className="text-base">
              Get Started Free
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button size="lg" variant="outline" className="text-base">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Vamo. Built for founders.
      </footer>
    </div>
  );
}
