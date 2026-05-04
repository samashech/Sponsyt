import { NextResponse } from 'next/server';
import { syncChannelsFromApify } from '@/lib/apify';

export async function POST() {
    try {
        const count = await syncChannelsFromApify();
        return NextResponse.json({ success: true, message: `Successfully synced ${count} channels.` });
    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
