'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // Vercel Analytics auto-tracks page views
    // This is for custom event tracking
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 Page view:', url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
