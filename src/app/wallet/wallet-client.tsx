"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface WalletClientProps {
  displayName: string;
  balance: number;
  rewards: Array<{
    id: string;
    event_type: string;
    amount: number;
    created_at: string;
    project_id: string | null;
  }>;
  redemptions: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
  userId: string;
}

export function WalletClient({
  displayName,
  balance,
  rewards,
  redemptions,
  userId,
}: WalletClientProps) {
  const [currentBalance, setCurrentBalance] = useState(balance);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  async function handleRedeem() {
    const amount = parseInt(redeemAmount, 10);
    if (!amount || amount < 50) {
      toast.error("Minimum redemption is 50 pineapples");
      return;
    }
    if (amount > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setRedeeming(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed");
      }

      const data = await res.json();
      setCurrentBalance(data.newBalance);
      setRedeemAmount("");
      toast.success(`Redeemed ${amount} pineapples`, {
        description: "Your redemption is being processed.",
        icon: "🍍",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redemption failed";
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  }

  const EVENT_LABELS: Record<string, string> = {
    chat_prompt: "Chat Message",
    url_added: "URL Added",
    description_added: "Description Added",
    profile_updated: "Profile Updated",
    project_created: "Project Created",
    evidence_added: "Evidence Added",
    testimonial_added: "Testimonial Added",
    milestone_reached: "Milestone",
    collaborator_added: "Collaborator Added",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <Link href="/projects" className="text-xl font-bold tracking-tight">
          &gt;&gt;&gt; vamo
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm font-medium">
            {currentBalance} <span className="text-lg leading-none">🍍</span>
          </div>
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">{displayName}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Balance Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pineapple Wallet</CardTitle>
            <CardDescription>
              Earn pineapples by building your startup. Redeem them for rewards!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-2 text-4xl font-bold">
                  {currentBalance} <span className="text-4xl leading-none">🍍</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total pineapples earned
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="50"
                  placeholder="Amount (min 50)"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="w-40"
                />
                <Button
                  onClick={handleRedeem}
                  disabled={redeeming || !redeemAmount}
                >
                  {redeeming ? "Redeeming..." : "Redeem"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: History + Redemptions */}
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">Reward History</TabsTrigger>
            <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No rewards yet. Start building to earn <span className="text-lg leading-none">🍍</span>!
                        </TableCell>
                      </TableRow>
                    ) : (
                      rewards.map((reward) => (
                        <TableRow key={reward.id}>
                          <TableCell>
                            {EVENT_LABELS[reward.event_type] ?? reward.event_type}
                          </TableCell>
                          <TableCell className="font-medium text-green-600 flex items-center gap-1">
                            +{reward.amount} <span className="text-sm">🍍</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(reward.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="redemptions">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No redemptions yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      redemptions.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium flex items-center gap-1">
                            {r.amount} <span className="text-sm">🍍</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                r.status === "fulfilled"
                                  ? "default"
                                  : r.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
