import { NextResponse } from "next/server";
import { MetaAdsService } from "@/lib/services/metaAdsService";

export async function GET() {
  try {
    const metaService = new MetaAdsService();
    const connected = await metaService.testConnection();

    if (!connected) {
      return NextResponse.json({
        success: false,
        error: "No se pudo conectar con Meta API",
      });
    }

    const until = new Date();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const insights = await metaService.getCampaignInsights({
      since: since.toISOString().split("T")[0],
      until: until.toISOString().split("T")[0],
    });

    return NextResponse.json({
      success: true,
      connected: true,
      campaigns_found: insights.length,
      total_spend: insights.reduce((sum, i) => sum + i.spend, 0),
      campaigns: insights.map((i) => ({
        name: i.campaign_name,
        spend: i.spend,
        impressions: i.impressions,
        clicks: i.clicks,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}
