"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, LogOut, User } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setEmail(user.email || "");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        toast.error("Error loading profile");
        return;
      }

      if (profile) {
        setProfile(profile);
        setDisplayName(profile.display_name || "");
        setAvatarUrl(profile.avatar_url || "");
      }
      
      setLoading(false);
    };

    getProfile();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const updateProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const updateEmail = async () => {
    if (!email || email === user.email) return;
    setSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("Check your new email for a verification link");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    setSaving(true);
    try {
      // For security, usually requires re-auth or old password verification
      // standard Supabase updateUser doesn't require old password if session is active 
      // but good practice might be to verify it. For now keeping simple as per requirements.
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-teal-500/30">
      <div className="mx-auto max-w-xl px-6 py-16 sm:py-24">
        
        {/* Header */}
        <div className="mb-12 flex items-end justify-between border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="text-sm text-zinc-400">Manage your persona and security</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleSignOut} 
            className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10 -mr-4"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>

        <div className="space-y-12">
          
          {/* Identity Section */}
          <section className="space-y-6">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Identity</h2>
            
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 ring-1 ring-white/10 ring-offset-4 ring-offset-[#0a0a0a]">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-2xl font-light">
                  {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-zinc-500">Avatar URL</Label>
                <Input 
                  value={avatarUrl} 
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-transparent border-t-0 border-x-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-teal-500 transition-colors h-8 placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <Label className="text-xs text-zinc-500">Display Name</Label>
              <Input 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What should we call you?"
                className="bg-transparent border-t-0 border-x-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-teal-500 transition-colors h-10 text-lg placeholder:text-zinc-700"
              />
            </div>
            
            <div className="flex justify-start pt-2">
              <Button 
                onClick={updateProfile} 
                disabled={saving} 
                className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-full px-6 h-9 text-sm font-medium transition-transform active:scale-95"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Identity
              </Button>
            </div>
          </section>

          {/* Account Section */}
          <section className="space-y-6 pt-6 border-t border-white/5">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Account</h2>
            
            <div className="space-y-1">
              <Label className="text-xs text-zinc-500">Email Address</Label>
              <div className="flex items-end gap-4">
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-t-0 border-x-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-teal-500 transition-colors h-10 placeholder:text-zinc-700 flex-1"
                />
                <Button 
                  onClick={updateEmail} 
                  disabled={saving || email === user?.email} 
                  variant="outline"
                  className="rounded-full h-8 px-4 text-s border-white/10 text-zinc-700 hover:text-white hover:bg-white/5"
                >
                  Update
                </Button>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">New Password</Label>
                <Input 
                  type="password"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent border-t-0 border-x-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-teal-500 transition-colors h-10 placeholder:text-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Confirm Password</Label>
                <div className="flex items-end gap-4">
                  <Input 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent border-t-0 border-x-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-teal-500 transition-colors h-10 placeholder:text-zinc-800 flex-1"
                  />
                  <Button 
                    onClick={updatePassword} 
                    disabled={saving || !newPassword} 
                    variant="outline"
                    className="rounded-full h-8 px-4 text-s border-white/10 text-zinc-700 hover:text-white hover:bg-white/5"
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
