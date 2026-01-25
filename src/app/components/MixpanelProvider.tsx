'use client';

import { useEffect } from 'react';
import { initMixpanel, track } from '../../lib/mixpanelClient';
import { isLandingPage } from '../routes';

export default function MixpanelProvider({ children }: { children: React.ReactNode }) {

    useEffect(() => {
        // Only initialize Mixpanel in production
        if (window.location.hostname !== 'localhost') {
            initMixpanel();

            if (isLandingPage(window.location.pathname)) {
                track('Landing Page Viewed');
            }
        }
    }, []);

    return <>{children}</>;
} 