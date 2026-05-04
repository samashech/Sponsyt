import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export default async function CreatorPortal() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const user = session.user as any;

  if (user.role !== "CREATOR") {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-4">This portal is for Creators only. You are logged in as a Brand.</p>
        <a href="/" className="mt-6 inline-block"><Button>Go back home</Button></a>
      </div>
    );
  }

  const channel = await prisma.channel.findFirst({
    where: { userId: user.id }
  });

  async function linkChannel(formData: FormData) {
    "use server"
    const youtubeId = formData.get("youtubeId") as string;
    if (youtubeId) {
      await prisma.channel.update({
        where: { youtubeId },
        data: { userId: user.id }
      });
      revalidatePath("/creator");
    }
  }

  async function updatePricing(formData: FormData) {
    "use server"
    if (!channel) return;
    const price = parseInt(formData.get("price") as string);
    if (!isNaN(price)) {
      await prisma.channel.update({
        where: { id: channel.id },
        data: { pricePerVideo: price }
      });
      revalidatePath("/creator");
    }
  }

  return (
    <main className="container mx-auto py-10 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Creator Portal</h1>

      {!channel ? (
        <Card>
          <CardHeader>
            <CardTitle>Link Your Channel</CardTitle>
            <CardDescription>Enter your existing YouTube Channel ID to claim it.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={linkChannel} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium">YouTube Channel ID</label>
                <Input name="youtubeId" placeholder="e.g., UC_techguru" required />
              </div>
              <Button type="submit">Claim Channel</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <img src={channel.thumbnailUrl || ""} alt={channel.name} className="w-16 h-16 rounded-full object-cover" />
              <div>
                <CardTitle className="text-2xl">{channel.name}</CardTitle>
                <CardDescription>{(channel.subscribers / 1000).toFixed(1)}K Subscribers</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Avg Views</p>
                  <p className="text-xl font-bold">{(channel.averageViews / 1000).toFixed(1)}K</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Niche</p>
                  <p className="text-xl font-bold capitalize">{channel.niche || "General"}</p>
                </div>
              </div>
              
              <form action={updatePricing} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium">Price per Video ($)</label>
                  <Input type="number" name="price" defaultValue={channel.pricePerVideo || ""} placeholder="e.g., 500" />
                </div>
                <Button type="submit">Update Pricing</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
