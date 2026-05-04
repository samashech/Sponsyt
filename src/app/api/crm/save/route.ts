import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).role !== 'BRAND') {
            return NextResponse.json({ success: false, error: 'Unauthorized. Only brands can save to CRM.' }, { status: 401 });
        }

        const brandId = (session.user as any).id;
        const { channelId, campaignName } = await req.json();

        if (!channelId || !campaignName) {
            return NextResponse.json({ success: false, error: 'Missing channelId or campaignName' }, { status: 400 });
        }

        // Find or create the campaign for this brand
        let campaign = await prisma.campaign.findFirst({
            where: { brandId, name: campaignName }
        });

        if (!campaign) {
            campaign = await prisma.campaign.create({
                data: {
                    name: campaignName,
                    brandId,
                }
            });
        }

        // Upsert OutreachLog
        const log = await prisma.outreachLog.upsert({
            where: {
                campaignId_channelId: {
                    campaignId: campaign.id,
                    channelId: channelId,
                }
            },
            update: {
                // If it already exists, maybe update timestamp or nothing
            },
            create: {
                campaignId: campaign.id,
                channelId: channelId,
                status: "SAVED",
            }
        });

        return NextResponse.json({ success: true, data: log });
    } catch (error: any) {
        console.error("CRM save error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
