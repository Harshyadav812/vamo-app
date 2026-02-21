import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex h-[73px] items-center justify-between border-b bg-white px-6 py-4">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between px-4 py-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
