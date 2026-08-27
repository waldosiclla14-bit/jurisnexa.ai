// Analytics utility for JurisNexa.ai
// Integrates with Vercel Analytics and custom events

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

// Track custom events
export function trackEvent(event: string, properties?: Record<string, string | number | boolean>) {
  // Vercel Analytics
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(event, properties);
  }

  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics:', event, properties);
  }
}

// Pre-defined event trackers
export const analytics = {
  // Chat events
  chatStarted: (country: string, legalArea?: string) =>
    trackEvent('chat_started', { country, legalArea: legalArea || 'none' }),

  chatMessageSent: (country: string, hasHistory: boolean) =>
    trackEvent('chat_message_sent', { country, hasHistory }),

  chatResponseReceived: (provider: string, ragUsed: boolean, duration: number) =>
    trackEvent('chat_response_received', { provider, ragUsed, duration }),

  // Auth events
  userSignedUp: (method: string) =>
    trackEvent('user_signed_up', { method }),

  userSignedIn: (method: string) =>
    trackEvent('user_signed_in', { method }),

  // Document events
  documentUploaded: (fileType: string, fileSize: number) =>
    trackEvent('document_uploaded', { fileType, fileSize }),

  // Plan events
  planUpgraded: (fromPlan: string, toPlan: string) =>
    trackEvent('plan_upgraded', { fromPlan, toPlan }),

  // Feedback events
  feedbackSubmitted: (rating: number, messageId: string) =>
    trackEvent('feedback_submitted', { rating, messageId }),

  // Error events
  errorOccurred: (error: string, context?: string) =>
    trackEvent('error_occurred', { error, context: context || 'unknown' }),
};

// Type declaration for Vercel Analytics
declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: Record<string, string | number | boolean>) => void;
    };
  }
}
