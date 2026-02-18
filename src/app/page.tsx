import Link from "next/link";
import { Button } from "@/components/ui/button";

// ── Feature cards data ────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "💬",
    title: "AI-Powered Chat",
    desc: "Describe what you want in plain English. Vamo's Gemini AI builds, iterates, and refines — no code needed.",
  },
  {
    icon: "📊",
    title: "Business Panel",
    desc: "Track valuation, traction signals, and your startup story. Everything investors want, in one place.",
  },
  {
    icon: "🔄",
    title: "Toggle, Don't Switch",
    desc: "Flip between your live UI preview and business analytics in one click. No more juggling tabs.",
  },
  {
    icon: "🍍",
    title: "Progress = Pineapples",
    desc: "Ship real updates and earn pineapples — an in-app currency redeemable for Uber Eats credits.",
  },
  {
    icon: "🏪",
    title: "List or Sell",
    desc: "List your project on the marketplace. Get instant AI-powered offers from buyers who see your traction data.",
  },
  {
    icon: "⚡",
    title: "Built for Founders",
    desc: "No code knowledge required. Describe what you want, and Vamo builds it. Focus on the business, not the tech.",
  },
];

// ── Steps data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    icon: "💡",
    title: "Describe your idea",
    desc: "Tell Vamo what you're building in plain English. No wireframes, no code — just your vision.",
  },
  {
    num: "02",
    icon: "🔧",
    title: "Iterate on UI + Business",
    desc: "Toggle between your live UI preview and your business panel. Update both as you go.",
  },
  {
    num: "03",
    icon: "📈",
    title: "Track real progress",
    desc: "Every meaningful update earns pineapples. Your valuation and traction signals update in real-time.",
  },
  {
    num: "04",
    icon: "💰",
    title: "Redeem or sell",
    desc: "Cash in pineapples for Uber Eats credits. Or list your project on the marketplace and get offers.",
  },
];

// ── Reward ledger items ───────────────────────────────────────────────────────

const LEDGER_ITEMS = [
  { action: "Ship a new feature", reward: 5 },
  { action: "Update business metrics", reward: 3 },
  { action: "Add traction signals", reward: 4 },
  { action: "Complete your business panel", reward: 10 },
  { action: "Get your first marketplace offer", reward: 15 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🍍</span>
              <span className="text-lg font-bold tracking-tight">Vamo</span>
            </Link>
            <div className="hidden items-center gap-6 text-sm text-gray-400 md:flex">
              <a href="#features" className="transition-colors hover:text-white">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
              <a href="#rewards" className="transition-colors hover:text-white">Rewards</a>
              <Link href="/marketplace" className="transition-colors hover:text-white">Marketplace</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/5">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full border border-teal-500/30 bg-teal-500/10 px-5 text-teal-300 hover:bg-teal-500/20">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 md:pb-32 md:pt-28">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-[500px] w-[800px] rounded-full bg-gradient-to-b from-teal-500/8 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-sm text-teal-300">
            <span>🍍</span>
            <span>Earn pineapples for real progress</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            Build your startup.
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
              Ship with confidence.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
            Vamo is a builder for non-technical founders. Iterate on your UI and
            business progress in parallel — and get rewarded with pineapples
            redeemable for Uber Eats credits.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button className="h-11 rounded-full border border-teal-500/30 bg-teal-600 px-7 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-500 hover:shadow-xl hover:shadow-teal-500/30">
                Start building →
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="h-11 rounded-full px-7 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                Log in
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Mock UI Preview ────────────────────────────────── */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Glow behind the card */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-teal-500/10 via-transparent to-transparent blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl shadow-black/50">
            {/* Window chrome */}
            <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex gap-1 rounded-lg bg-white/5 px-1 py-0.5">
                <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white">🖥 UI Preview</span>
                <span className="rounded-md px-3 py-1 text-xs text-gray-500">📊 Business Panel</span>
              </div>
            </div>

            {/* Mock content */}
            <div className="p-6">
              {/* Fake project header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-sm font-bold">🏠</div>
                <div>
                  <div className="h-3 w-32 rounded-full bg-white/15" />
                  <div className="mt-1.5 h-2 w-20 rounded-full bg-white/8" />
                </div>
              </div>

              {/* Fake UI cards */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="h-16 rounded-lg bg-white/5 mb-3" />
                    <div className="h-2 w-3/4 rounded-full bg-white/10 mb-2" />
                    <div className="h-2 w-1/2 rounded-full bg-white/7" />
                  </div>
                ))}
              </div>

              {/* Fake action bar */}
              <div className="mt-4 flex gap-2">
                <div className="rounded-lg bg-teal-500/20 px-4 py-2">
                  <div className="h-2 w-12 rounded-full bg-teal-400/60" />
                </div>
                <div className="rounded-lg bg-white/5 px-4 py-2">
                  <div className="h-2 w-16 rounded-full bg-white/10" />
                </div>
              </div>
            </div>

            {/* Floating pineapple notification */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1a1a] px-4 py-2 shadow-xl">
              <span className="text-base">🍍</span>
              <span className="text-sm font-medium text-teal-300">+5 pineapples earned!</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-teal-400">
            Features
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a founder needs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            Build your product and your business side by side. No more context-switching.
          </p>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-xl transition-transform group-hover:scale-110">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-teal-400">
            How it works
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            From idea to traction in 4 steps
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-400">
            No technical skills required. Just describe, build, track, and earn.
          </p>

          {/* Steps grid */}
          <div className="relative mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line (desktop) */}
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />

            {STEPS.map((s) => (
              <div key={s.num} className="relative text-center">
                {/* Icon circle */}
                <div className="relative mx-auto mb-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl">
                    {s.icon}
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-lg shadow-teal-500/30">
                    {s.num}
                  </div>
                </div>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rewards ───────────────────────────────────────────── */}
      <section id="rewards" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          {/* Left text */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-400">
              Rewards
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Real progress.
              <br />
              Real pineapples. 🍍
            </h2>
            <p className="mt-4 max-w-md text-gray-400 leading-relaxed">
              Every time you ship something meaningful — a new feature, a business
              update, a traction signal — you earn pineapples. Redeem them for
              Uber Eats credits and fuel your hustle, literally.
            </p>
            <div className="mt-8 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-base">🏗️</div>
                <div>
                  <p className="font-semibold text-teal-300">Earn</p>
                  <p className="text-xs text-gray-500">Ship &amp; progress</p>
                </div>
              </div>
              <span className="text-gray-600">→</span>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-base">🍔</div>
                <div>
                  <p className="font-semibold text-teal-300">Redeem</p>
                  <p className="text-xs text-gray-500">Uber Eats credits</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Pineapple Ledger card */}
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-0 shadow-2xl shadow-black/30">
            {/* Ledger header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍍</span>
                <span className="text-sm font-semibold">Pineapple Ledger</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <span>⭐</span>
                <span className="font-semibold text-white">42</span>
                <span>🍍</span>
              </div>
            </div>

            {/* Ledger rows */}
            <div className="divide-y divide-white/5">
              {LEDGER_ITEMS.map((item) => (
                <div key={item.action} className="flex items-center justify-between px-6 py-3.5">
                  <span className="text-sm text-gray-300">{item.action}</span>
                  <span className="text-sm font-semibold text-teal-400">+{item.reward} 🍍</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-6 py-3 text-center text-xs text-gray-500">
              50 🍍 = $10 Uber Eats credit · Redeemable anytime
            </div>
          </div>
        </div>
      </section>

      {/* ── Marketplace CTA ──────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-400">
            Marketplace
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            List your project. Get instant offers.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Optionally put your project on the Vamo marketplace. Buyers see your
            real traction data and make instant offers powered by AI valuation.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button className="h-11 rounded-full border border-teal-500/30 bg-teal-600 px-7 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 hover:bg-teal-500">
                Start building →
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="ghost" className="h-11 rounded-full px-7 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                Browse marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>🍍</span>
            <span>© {new Date().getFullYear()} Vamo. Built for founders.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
