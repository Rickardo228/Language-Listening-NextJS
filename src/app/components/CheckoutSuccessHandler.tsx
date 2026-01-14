'use client'

import { useEffect } from 'react';

export function CheckoutSuccessHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const hasCheckoutSuccess = params.get('checkout') === 'success';

    if (hasCheckoutSuccess) {
      try {
        sessionStorage.setItem('checkout-success', '1');
      } catch (error) {
        console.warn('Unable to persist checkout success flag:', error);
      }

      params.delete('checkout');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
      window.history.replaceState({}, '', nextUrl);
    }

  }, []);

  return null;
}
