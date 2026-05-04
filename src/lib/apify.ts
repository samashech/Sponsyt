import { ApifyClient } from 'apify-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ChannelData = {
  youtubeId: string;
  name: string;
  description: string;
  subscribers: number;
  averageViews: number;
  niche: string;
  contactEmail: string;
  thumbnailUrl: string;
};

export async function syncChannelsFromApify() {
    const apifyToken = process.env.APIFY_API_TOKEN;
    let data: ChannelData[] = [];

    if (!apifyToken) {
        console.warn("No Apify token found. Using mock data.");
        data = [
          {
            youtubeId: "UC_techguru",
            name: "Tech Guru",
            description: "Reviewing the latest gadgets.",
            subscribers: 500000,
            averageViews: 75000,
            niche: "Technology",
            contactEmail: "hello@techguru.com",
            thumbnailUrl: "https://ui-avatars.com/api/?name=Tech+Guru",
          },
          {
            youtubeId: "UC_gamerx",
            name: "GamerX",
            description: "Daily let's plays and streams.",
            subscribers: 1200000,
            averageViews: 200000,
            niche: "Gaming",
            contactEmail: "sponsors@gamerx.gg",
            thumbnailUrl: "https://ui-avatars.com/api/?name=GamerX",
          },
          {
            youtubeId: "UC_fitnesssarah",
            name: "Fitness with Sarah",
            description: "Home workouts and meal preps.",
            subscribers: 850000,
            averageViews: 110000,
            niche: "Fitness",
            contactEmail: "sarah@fitnesssarah.com",
            thumbnailUrl: "https://ui-avatars.com/api/?name=Fitness+with+Sarah",
          },
          {
            youtubeId: "UC_financebro",
            name: "Finance Bro",
            description: "Stocks, crypto, and real estate.",
            subscribers: 250000,
            averageViews: 45000,
            niche: "Finance",
            contactEmail: "biz@financebro.net",
            thumbnailUrl: "https://ui-avatars.com/api/?name=Finance+Bro",
          },
          {
            youtubeId: "UC_beautyqueen",
            name: "Beauty Queen",
            description: "Makeup tutorials and fashion hauls.",
            subscribers: 3000000,
            averageViews: 500000,
            niche: "Beauty",
            contactEmail: "pr@beautyqueen.com",
            thumbnailUrl: "https://ui-avatars.com/api/?name=Beauty+Queen",
          }
        ];
    } else {
        const client = new ApifyClient({ token: apifyToken });
        // Example actor id for a youtube scraper
        const run = await client.actor("streamers/youtube-scraper").call({
            "searchKeywords": "tech, gaming, fitness",
            "maxResults": 10
        });
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        // Map Apify items to our schema
        data = items.map((item: any) => ({
            youtubeId: item.channelId || item.id,
            name: item.channelName || item.title || "Unknown",
            description: item.description || "",
            subscribers: item.numberOfSubscribers || 0,
            averageViews: item.averageViews || 0,
            niche: item.niche || "General",
            contactEmail: item.email || "",
            thumbnailUrl: item.channelUrl || "",
        }));
    }

    // Upsert to DB
    for (const channel of data) {
        await prisma.channel.upsert({
            where: { youtubeId: channel.youtubeId },
            update: {
                name: channel.name,
                description: channel.description,
                subscribers: channel.subscribers,
                averageViews: channel.averageViews,
                niche: channel.niche,
                contactEmail: channel.contactEmail,
                thumbnailUrl: channel.thumbnailUrl,
            },
            create: {
                youtubeId: channel.youtubeId,
                name: channel.name,
                description: channel.description,
                subscribers: channel.subscribers,
                averageViews: channel.averageViews,
                niche: channel.niche,
                contactEmail: channel.contactEmail,
                thumbnailUrl: channel.thumbnailUrl,
            }
        });
    }

    return data.length;
}