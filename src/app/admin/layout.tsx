import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./admin-sidebar";

export const metadata = {
  title: "Admin Panel - Vamo",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get profile to check is_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/projects");
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-zinc-900 font-sans selection:bg-zinc-200/50 flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-12 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
