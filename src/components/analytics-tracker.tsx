"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { flushTrackingEvents, trackAnalyticsEvent } from "@/lib/analytics-client";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type AnalyticsTrackerProps = {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
};

/** Records first-party analytics and optional GA4/Meta Pixel storefront page views. */
export function AnalyticsTracker({ googleAnalyticsId = "", facebookPixelId = "" }: AnalyticsTrackerProps) {
  const pathname = usePathname();
  const [googleReady, setGoogleReady] = useState(false);
  const [pixelReady, setPixelReady] = useState(false);
  const lastGooglePath = useRef("");
  const lastPixelPath = useRef("");
  const isStorefront = Boolean(pathname && !pathname.startsWith("/admin") && !pathname.startsWith("/api"));

  useEffect(() => {
    if (!isStorefront || !pathname) return;
    trackAnalyticsEvent("page_view", { path: pathname });
    if (pathname === "/checkout") trackAnalyticsEvent("checkout_started", { path: pathname });
  }, [isStorefront, pathname]);

  useEffect(() => {
    if (!isStorefront || !pathname || !googleReady || !window.gtag || lastGooglePath.current === pathname) return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
    flushTrackingEvents("google");
    lastGooglePath.current = pathname;
  }, [googleReady, isStorefront, pathname]);

  useEffect(() => {
    if (!isStorefront || !pathname || !pixelReady || !window.fbq || lastPixelPath.current === pathname) return;
    window.fbq("track", "PageView");
    flushTrackingEvents("meta");
    lastPixelPath.current = pathname;
  }, [isStorefront, pathname, pixelReady]);

  if (!isStorefront) return null;

  return (
    <>
      {googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} strategy="afterInteractive" />
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            onReady={() => setGoogleReady(true)}
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${googleAnalyticsId}',{send_page_view:false});`,
            }}
          />
        </>
      )}
      {facebookPixelId && (
        <Script
          id="meta-pixel-init"
          strategy="afterInteractive"
          onReady={() => setPixelReady(true)}
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${facebookPixelId}');`,
            }}
          />
      )}
    </>
  );
}
