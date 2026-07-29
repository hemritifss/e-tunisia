import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { queryClient } from './query-client';
import { ErrorBoundary } from './ErrorBoundary';
import ChatPopupManager from '../components/ChatPopupManager';
import ActiveConversationsLauncher from '../components/ActiveConversations';
import UserActionMenu from '../components/UserActionMenu';
import ProfileHoverCard from '../components/ProfileHoverCard';
import { PopupHost } from '../components/popups';

/**
 * Globally-mounted Messenger surfaces: the floating chat popups
 * (always-visible across pages, hides on /#/messages) and the mobile
 * conversations launcher (FAB + bottom sheet).
 *
 * Mounted once at app boot — distinct from route-based island mounting
 * so it survives route changes.
 */
export function mountMessengerGlobals() {
    if (document.getElementById('messenger-root')) return;
    const host = document.createElement('div');
    host.id = 'messenger-root';
    document.body.appendChild(host);

    const root = createRoot(host);
    root.render(
        <QueryClientProvider client={queryClient}>
            {/* Same wrappers as routed islands (islands.tsx): this root renders
                framer-motion surfaces, so it needs the reduced-motion contract too */}
            <MotionConfig reducedMotion="user">
                <ErrorBoundary>
                    <ChatPopupManager />
                    <ActiveConversationsLauncher />
                    <UserActionMenu />
                    <ProfileHoverCard />
                    <PopupHost />
                </ErrorBoundary>
            </MotionConfig>
        </QueryClientProvider>,
    );
}
