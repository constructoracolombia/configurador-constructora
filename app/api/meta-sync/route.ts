import { NextResponse } from "next/server";
import { MetaAdsService } from "@/lib/services/metaAdsService";
import { supabaseAdmin as supabase } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dias = Number(body?.dias ?? 30);

    const until = new Date();
    const since = new Date();
    since.setDate(since.getDate() - dias);

    const dateRange = {
      since: since.toISOString().split("T")[0],
      until: until.toISOString().split("T")[0],
    };

    const metaService = new MetaAdsService();

    const connected = await metaService.testConnection();
    if (!connected) {
      return NextResponse.json(
        { error: "No se pudo conectar con Meta API. Verifica las credenciales." },
        { status: 500 }
      );
    }

    const insights = await metaService.getCampaignInsights(dateRange);
    const syncResults: Array<{ campaign: string; synced: boolean }> = [];

    for (const insight of insights) {
      const { error } = await supabase.from("meta_campaign_insights").upsert(
        {
          campaign_id: insight.campaign_id,
          campaign_name: insight.campaign_name,
          spend: insight.spend,
          impressions: insight.impressions,
          clicks: insight.clicks,
          ctr: insight.ctr,
          cpc: insight.cpc,
          date_start: insight.date_start,
          date_stop: insight.date_stop,
          synced_at: new Date().toISOString(),
        },
        {
          onConflict: "campaign_id,date_start",
        }
      );

      if (!error) {
        syncResults.push({
          campaign: insight.campaign_name,
          synced: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncResults.length,
      total: insights.length,
      results: syncResults,
    });
  } catch (error) {
    console.error("Error syncing Meta data:", error);
    return NextResponse.json(
      { error: "Error sincronizando con Meta API" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Meta Ads sync endpoint",
  });
}
