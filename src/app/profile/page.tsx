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
          updated_at: new Date().toISOString(),
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
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="mt-2 text-gray-400">Manage your account details and preferences.</p>
          </div>
          <Button variant="destructive" onClick={handleSignOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <div className="space-y-6">
          {/* Profile Picture & Name */}
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-lg">Public Profile</CardTitle>
              <CardDescription>This information will be displayed publicly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-white/10">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-teal-900 text-teal-200 text-xl">
                    {displayName[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <Label>Avatar URL</Label>
                  <Input 
                    value={avatarUrl} 
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="border-white/10 bg-black/40"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL for your avatar image.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-white/10 bg-black/40"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={updateProfile} disabled={saving} className="bg-teal-600 hover:bg-teal-500 text-white">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Public Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email */}
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-lg">Email Address</CardTitle>
              <CardDescription>
                Changing your email will require verification on the new address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-white/10 bg-black/40"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={updateEmail} disabled={saving || email === user?.email} variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>
                Must be at least 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Note: Standard Supabase auth doesn't require current password for update if logged in, 
                  but UI often shows it. We'll include just new password fields to match API capability 
                  unless we implement a custom verification flow. */}
              
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-white/10 bg-black/40"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input 
                  type="password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-white/10 bg-black/40"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={updatePassword} disabled={saving || !newPassword} variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
