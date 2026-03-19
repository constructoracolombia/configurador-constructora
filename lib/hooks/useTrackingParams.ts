import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface TrackingParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  referrer: string | null;
  landing_page: string | null;
}

export function useTrackingParams(): TrackingParams {
  const searchParams = useSearchParams();
  const [params, setParams] = useState<TrackingParams>({
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    fbclid: null,
    gclid: null,
    referrer: null,
    landing_page: null,
  });

  useEffect(() => {
    const trackingData: TrackingParams = {
      utm_source: searchParams.get("utm_source"),
      utm_medium: searchParams.get("utm_medium"),
      utm_campaign: searchParams.get("utm_campaign"),
      utm_content: searchParams.get("utm_content"),
      utm_term: searchParams.get("utm_term"),
      fbclid: searchParams.get("fbclid"),
      gclid: searchParams.get("gclid"),
      referrer: document.referrer || null,
      landing_page: window.location.pathname + window.location.search,
    };

    if (trackingData.utm_source || trackingData.fbclid || trackingData.gclid) {
      localStorage.setItem("tracking_params", JSON.stringify(trackingData));
    }

    setParams(trackingData);
  }, [searchParams]);

  return params;
}

export function getStoredTrackingParams(): TrackingParams | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("tracking_params");
  return stored ? (JSON.parse(stored) as TrackingParams) : null;
}
