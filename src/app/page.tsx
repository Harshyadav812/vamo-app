import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  BarChart3,
  ArrowRightLeft,
  Store,
  Terminal,
  Trophy,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-zinc-200/50">
      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[#fafafa]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">&gt;&gt;&gt; vamo</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-500 md:flex">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#rewards" className="hover:text-black transition-colors">Rewards</a>
            <Link href="/marketplace" className="hover:text-black transition-colors">Marketplace</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-600 hover:text-black hover:bg-black/5 rounded-full font-medium h-9 px-5">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-full bg-black text-white hover:bg-zinc-800 h-9 px-5 font-medium shadow-sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero section ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            {/* Promo Pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm">
              <span className="text-base leading-none">🍍</span>
              <span>Earn pineapples for every feature you ship</span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>

            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-black sm:text-6xl md:text-8xl lg:tracking-tighter">
              Ship products.
              <br />
              <span className="text-zinc-400">Scale the business.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-zinc-500 leading-relaxed font-medium">
              The AI app builder for non-technical founders. Build your UI, track traction metrics, and earn rewards—all in one seamless workspace.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link href="/signup">
                <Button className="rounded-full bg-black text-white hover:bg-zinc-800 hover:scale-105 transition-all text-base px-8 h-12 shadow-xl shadow-black/10">
                  Start building now <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" className="rounded-full border-black/10 bg-white text-black hover:bg-zinc-50 text-base px-8 h-12 shadow-sm transition-all hover:scale-105">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mock Application Graphic (The "Wow" Factor) */}
        <div className="mx-auto mt-24 max-w-5xl relative">
          <div className="absolute inset-x-4 top-0 blur-3xl h-64 bg-gradient-to-b from-zinc-200/50 to-transparent -z-10 rounded-full" />
          
          <div className="rounded-3xl border border-black/10 bg-white shadow-2xl p-2 md:p-4 overflow-hidden transform perspective-1000">
            <div className="rounded-2xl border border-black/5 bg-[#f4f4f5] overflow-hidden flex flex-col md:flex-row min-h-[500px]">
              
              {/* Left Mock Chat Panel */}
              <div className="w-full md:w-[320px] bg-[#f9fafb] border-r border-black/5 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-bold text-xl tracking-tight">&gt;&gt;&gt; vamo</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-black/10 rounded-full shadow-sm">
                      <span className="font-bold">5</span>
                      <span>🍍</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-sm font-medium">
                    <div className="bg-white border border-black/5 p-4 rounded-2xl rounded-tl-sm text-zinc-600 shadow-sm leading-relaxed">
                      Go to <span className="underline decoration-zinc-300 underline-offset-4">Business Analysis</span> to earn pineapples. You can add any of the fields to redeem pineapples🍍
                    </div>
                    <div className="bg-zinc-200/50 p-4 rounded-2xl rounded-tr-sm text-black self-end ml-8">
                      Ok i want to add my linkedin here it is linkedin.com/in/gabbisoong
                    </div>
                    <div className="bg-white border border-black/5 p-4 rounded-2xl rounded-tl-sm text-zinc-600 shadow-sm leading-relaxed">
                      AWESOME! Got your linkedin added -- here's <strong className="text-black">10 pineapples</strong> for doing that <strong className="text-black">(+10🍍)</strong>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <span className="shrink-0 px-3 py-1.5 bg-white border border-black/10 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1">Profile +100🍍</span>
                  <span className="shrink-0 px-3 py-1.5 bg-white border border-black/10 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1">Activity +100🍍</span>
                </div>
              </div>
              
              {/* Right Mock Main Panel */}
              <div className="flex-1 bg-white p-6 relative flex flex-col">
                <div className="flex gap-2 mb-8">
                  <div className="px-5 py-2 font-medium bg-white text-black border-2 border-black rounded-full text-sm shadow-sm cursor-pointer">Project</div>
                  <div className="px-5 py-2 font-medium bg-zinc-50 text-zinc-500 border border-black/10 rounded-full text-sm cursor-pointer hover:bg-zinc-100">Business Analysis</div>
                </div>
                
                <div className="flex-1 border border-black/10 rounded-2xl bg-[#fafafa] p-8 flex flex-col items-center text-center overflow-hidden relative">
                   <div className="absolute top-4 left-4 flex gap-1 items-center">
                     <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                       <span className="text-white text-[10px] font-bold">A</span>
                     </div>
                     <span className="font-medium text-sm">Arcotype</span>
                   </div>
                   
                   <div className="mt-16 max-w-lg">
                     <h2 className="text-5xl md:text-6xl font-serif text-zinc-800 leading-none">Stop settling for overused fonts</h2>
                     <p className="mt-6 text-xl text-zinc-600 font-serif leading-tight">Arcotype is the fastest way to find the font you're looking for</p>
                     
                     <div className="mt-8">
                       <div className="inline-block px-6 py-3 border-2 border-black rounded-full font-bold text-sm bg-white shadow-[0_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">JOIN WAITLIST</div>
                     </div>
                   </div>
                   
                   <div className="w-[80%] h-40 bg-white border border-black/10 rounded-t-xl mt-16 shadow-xl relative overflow-hidden flex gap-4 p-4">
                     <div className="w-full flex gap-3">
                         <div className="w-1/4 h-32 bg-zinc-100 rounded-lg border border-zinc-200"></div>
                         <div className="w-1/4 h-32 bg-zinc-100 rounded-lg border border-zinc-200"></div>
                         <div className="w-1/4 h-32 bg-zinc-100 rounded-lg border border-zinc-200"></div>
                         <div className="w-1/4 h-32 bg-zinc-100 rounded-lg border border-zinc-200"></div>
                     </div>
                   </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24 md:py-32 bg-white border-y border-black/5">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            
            <div className="group">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white mb-6 shadow-md shadow-black/20 z-10 relative group-hover:-translate-y-1 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">AI-Powered Builder</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Describe your vision in plain English. No code, no complex logic. The AI builds the interface in real-time.
              </p>
            </div>
            
            <div className="group">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-black flex items-center justify-center text-black mb-6 z-10 relative group-hover:-translate-y-1 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Business Analyst</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Log traction limits, update metrics, and refine your pitch. Real business data sits right next to your code.
              </p>
            </div>

            <div className="group">
              <div className="w-12 h-12 rounded-2xl bg-[#fafafa] border border-black/10 flex items-center justify-center text-black mb-6 shadow-sm z-10 relative group-hover:-translate-y-1 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Marketplace Exits</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Ready to pass the torch? List your fully vetted project on our marketplace and let buyers make AI-backed offers.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Incentive / Rewards ─────────────────────────────────────────────── */}
      <section id="rewards" className="px-6 py-24 md:py-32 bg-[#fafafa]">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Real progress pays off.
            </h2>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed max-w-xl">
              Every meaningful action—shipping a feature, reaching a milestone, or detailing your valuation—earns you pineapples 🍍. Build your startup and cash in for Uber Eats.
            </p>
            
            <div className="flex gap-4">
               <div className="flex flex-col gap-1 p-5 rounded-2xl border border-black/10 bg-white min-w-[140px] shadow-sm">
                 <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Action</span>
                 <span className="text-2xl font-black">Ship code</span>
               </div>
               <div className="flex flex-col gap-1 p-5 rounded-2xl bg-black text-white min-w-[140px] shadow-xl shadow-black/10">
                 <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Reward</span>
                 <span className="text-2xl font-black flex items-center gap-1">+5 <span className="text-sm">🍍</span></span>
               </div>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <div className="bg-white rounded-3xl p-8 border border-black/10 shadow-2xl relative">
              <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">Wallet</div>
              <h3 className="text-xl font-bold mb-8">Pineapple Ledger</h3>
              
              <div className="space-y-4">
                {[
                  { title: "Completed profile", val: "+10" },
                  { title: "Added Linkedin", val: "+10" },
                  { title: "Shipped Hero iteration", val: "+5" },
                  { title: "Valuation analysis", val: "+25" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                    <span className="font-medium text-zinc-600">{item.title}</span>
                    <span className="font-bold flex items-center gap-1">{item.val} <span className="text-xs">🍍</span></span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-4 border-t border-dashed border-black/20 flex items-center justify-between">
                <span className="font-bold text-zinc-400">Total</span>
                <span className="text-3xl font-black flex items-center gap-2">50 <span className="text-xl">🍍</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="px-6 py-12 md:py-16 bg-white border-t border-black/5">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">&gt;&gt;&gt; vamo</span>
            <span className="text-zinc-400 font-medium">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-8 font-medium text-zinc-500">
            <Link href="/projects" className="hover:text-black transition-colors">Projects</Link>
            <Link href="/marketplace" className="hover:text-black transition-colors">Marketplace</Link>
            <Link href="/login" className="hover:text-black text-black">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
