import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const prisma = new PrismaClient();

export default async function Home(props: { searchParams: Promise<{ q?: string; niche?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";
  const niche = searchParams?.niche || "";

  const whereClause: any = {};
  if (q) {
    whereClause.name = { contains: q };
  }
  if (niche) {
    whereClause.niche = { equals: niche };
  }

  const channels = await prisma.channel.findMany({
    where: whereClause,
    orderBy: { subscribers: "desc" },
  });

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Sponsyt</h1>
            <p className="text-muted-foreground mt-2 text-lg">Find the perfect creator for your next brand campaign.</p>
          </div>
          <div>
             <Button variant="outline">Sign In</Button>
          </div>
        </div>

        <form className="flex gap-4 items-end mb-6">
          <div className="flex flex-col gap-2 flex-grow">
            <label htmlFor="search" className="text-sm font-medium">Search Creators</label>
            <Input id="search" name="q" placeholder="e.g., Tech Guru" defaultValue={q} />
          </div>
          <div className="flex flex-col gap-2 flex-grow max-w-[200px]">
            <label htmlFor="niche" className="text-sm font-medium">Niche</label>
            <Input id="niche" name="niche" placeholder="e.g., Technology" defaultValue={niche} />
          </div>
          <Button type="submit">Filter</Button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map(channel => (
            <Card key={channel.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4">
                <img src={channel.thumbnailUrl || ""} alt={channel.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <CardTitle className="text-xl">{channel.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{channel.niche}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{channel.description}</p>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Subscribers</span>
                    <span>{(channel.subscribers / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Avg Views</span>
                    <span>{(channel.averageViews / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Badge variant="secondary">{channel.niche || "General"}</Badge>
                <Button>Save to CRM</Button>
              </CardFooter>
            </Card>
          ))}
          {channels.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No creators found matching your filters.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}