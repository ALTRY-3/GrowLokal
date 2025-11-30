"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageIdentifier() {
  const pathname = usePathname();

  useEffect(() => {
    // Set data-page attribute on body based on current route
    if (pathname) {
      const page = pathname.replace(/^\//, '') || 'home';
      document.body.setAttribute('data-page', page);
    }

    return () => {
      document.body.removeAttribute('data-page');
    };
  }, [pathname]);

  return null;
}
