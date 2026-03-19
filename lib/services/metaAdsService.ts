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
      const adAccountPath = this.adAccountId.startsWith("act_")
        ? this.adAccountId
        : `act_${this.adAccountId}`;
      const url = `${this.baseUrl}/${adAccountPath}/insights`;

      const params = new URLSearchParams({
        access_token: this.accessToken,
        level: "campaign",
        time_range: JSON.stringify({
          since: dateRange.since,
          until: dateRange.until,
        }),
        fields:
          "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,actions,action_values",
        limit: "100",
        time_increment: "1",
      });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        console.error("Meta API error:", error);
        throw new Error(`Meta API error: ${response.status}`);
      }

      const data = await response.json();
      const campaignsMap = new Map<string, any>();

      (data.data || []).forEach((insight: any) => {
        const campaignId = String(insight.campaign_id || "");
        if (!campaignId) return;

        if (!campaignsMap.has(campaignId)) {
          campaignsMap.set(campaignId, {
            campaign_id: campaignId,
            campaign_name: String(insight.campaign_name || ""),
            spend: 0,
            impressions: 0,
            clicks: 0,
            date_start: String(insight.date_start || dateRange.since),
            date_stop: String(insight.date_stop || dateRange.until),
          });
        }

        const campaign = campaignsMap.get(campaignId);
        campaign.spend += Number.parseFloat(insight.spend || "0");
        campaign.impressions += Number.parseInt(insight.impressions || "0", 10);
        campaign.clicks += Number.parseInt(insight.clicks || "0", 10);
        campaign.date_stop = String(insight.date_stop || campaign.date_stop);
      });

      return Array.from(campaignsMap.values()).map((campaign: any) => ({
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        spend: campaign.spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
        cpc: campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0,
        date_start: campaign.date_start,
        date_stop: campaign.date_stop,
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
