-- Tabla para almacenar métricas sincronizadas desde Meta Marketing API
CREATE TABLE IF NOT EXISTS meta_campaign_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (campaign_id, date_start)
);

CREATE INDEX IF NOT EXISTS idx_meta_insights_campaign_name
  ON meta_campaign_insights(campaign_name);
CREATE INDEX IF NOT EXISTS idx_meta_insights_date_start
  ON meta_campaign_insights(date_start DESC);

ALTER TABLE meta_campaign_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo público meta_campaign_insights" ON meta_campaign_insights;
CREATE POLICY "Permitir todo público meta_campaign_insights"
ON meta_campaign_insights FOR ALL TO public USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_meta_campaign_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_meta_campaign_insights_updated_at ON meta_campaign_insights;
CREATE TRIGGER trigger_update_meta_campaign_insights_updated_at
BEFORE UPDATE ON meta_campaign_insights
FOR EACH ROW EXECUTE FUNCTION update_meta_campaign_insights_updated_at();
