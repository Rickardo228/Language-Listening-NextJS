'use client';

import { useEffect } from 'react';
import { initMixpanel } from '../../lib/mixpanelClient';

export default function MixpanelProvider({ children }: { children: React.ReactNode }) {

    useEffect(() => {
        // Only initialize Mixpanel in production
        if (process.env.NODE_ENV === 'production') {
            initMixpanel(); // Initialize Mixpanel
        }
    }, []);

    return <>{children}</>;
} 