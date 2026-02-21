"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [redeemAmount, setRedeemAmount] = useState<string>("50");
  const [redeeming, setRedeeming] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [rewardType, setRewardType] = useState("uber_eats");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(rewards.length / ITEMS_PER_PAGE);
  const paginatedRewards = rewards.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
      setRedeemAmount("50");
      setIsRedeemOpen(false);
      
      // Track analytics event
      trackEvent("reward_redeemed", { amount, rewardType });

      toast.success("Redemption submitted! You'll receive your reward within 48 hours.", {
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 transition-colors">
              {displayName?.[0]?.toUpperCase() || "U"}
            </div>
          </Link>
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
                <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={currentBalance < 50}>Redeem</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Redeem Pineapples</DialogTitle>
                      <DialogDescription>
                        Exchange your hard-earned pineapples for rewards. Current balance: {currentBalance} 🍍
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid space-y-2">
                        <label htmlFor="amount" className="text-sm font-medium">Redemption Amount</label>
                        <Input
                          id="amount"
                          type="number"
                          min="50"
                          max={currentBalance}
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Minimum 50 pineapples</p>
                      </div>
                      <div className="grid space-y-2">
                        <label className="text-sm font-medium">Reward Type</label>
                        <Select value={rewardType} onValueChange={setRewardType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reward" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="uber_eats">Uber Eats Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRedeemOpen(false)}>Cancel</Button>
                      <Button onClick={handleRedeem} disabled={redeeming || !redeemAmount || parseInt(redeemAmount, 10) < 50 || parseInt(redeemAmount, 10) > currentBalance}>
                        {redeeming ? "Processing..." : "Confirm Redemption"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                    {paginatedRewards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No rewards yet. Start building to earn <span className="text-lg leading-none">🍍</span>!
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRewards.map((reward) => (
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 p-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
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
                              className={
                                r.status === "fulfilled"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                                  : r.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
                                    : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                              }
                              variant="outline"
                            >
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
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
