interface MetaCampaignInsights {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  date_start: string;
  date_stop: string;
}

export class MetaAdsService {
  private baseUrl = "https://graph.facebook.com/v19.0";
  private accessToken: string;
  private adAccountId: string;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || "";
    this.adAccountId = process.env.META_AD_ACCOUNT_ID || "";
  }

  async getCampaignInsights(dateRange: {
    since: string;
    until: string;
  }): Promise<MetaCampaignInsights[]> {
    try {
      const url = `${this.baseUrl}/act_${this.adAccountId}/insights`;

      const params = new URLSearchParams({
        access_token: this.accessToken,
        level: "campaign",
        time_range: JSON.stringify({
          since: dateRange.since,
          until: dateRange.until,
        }),
        fields: "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc",
        limit: "100",
      });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        console.error("Meta API error:", error);
        throw new Error(`Meta API error: ${response.status}`);
      }

      const data = await response.json();
      return (data.data || []).map((insight: any) => ({
        campaign_id: String(insight.campaign_id || ""),
        campaign_name: String(insight.campaign_name || ""),
        spend: Number.parseFloat(insight.spend || "0"),
        impressions: Number.parseInt(insight.impressions || "0", 10),
        clicks: Number.parseInt(insight.clicks || "0", 10),
        ctr: Number.parseFloat(insight.ctr || "0"),
        cpc: Number.parseFloat(insight.cpc || "0"),
        date_start: String(insight.date_start || dateRange.since),
        date_stop: String(insight.date_stop || dateRange.until),
      }));
    } catch (error) {
      console.error("Error fetching Meta campaign insights:", error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/act_${this.adAccountId}`;
      const params = new URLSearchParams({
        access_token: this.accessToken,
        fields: "id,name",
      });

      const response = await fetch(`${url}?${params.toString()}`);
      return response.ok;
    } catch (error) {
      console.error("Meta API connection test failed:", error);
      return false;
    }
  }
}
