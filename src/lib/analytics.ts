import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;

// Lazily loads the Google Tag manager script on-demand
export const initGA = () => {
  if (!GA_ID) return;

  // Ensure script is injected exactly once
  if (document.getElementById('google-analytics-script')) return;

  const script = document.createElement('script');
  script.id = 'google-analytics-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: false, // We route virtual pageviews manually to support HashRouters perfectly
  });
};

// Log generic page views manually
export const trackPageView = (path: string, title?: string) => {
  if (GA_ID && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      send_to: GA_ID,
    });
  }
};

// General dynamic interactive event tracking (e.g. correct solve, retry markup)
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (GA_ID && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Clean React sub-component that reports SPA navigation events via useLocation.
 * Render this once inside HashRouter to automate tracking with zero configuration.
 */
export const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    // Build actual path with hash prefix for single page analytics consistency
    const virtualPath = location.pathname + location.pathname.endsWith('/') ? '' : '/' + location.search + location.hash;
    trackPageView(virtualPath || '/');
  }, [location]);

  return null;
};
