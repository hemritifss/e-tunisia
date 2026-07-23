import React from 'react';
import { cn } from '../lib/utils';

type PageWidth = 'standard' | 'feed' | 'wide' | 'full';

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content width. Defaults to the standard 940px reading width. */
  width?: PageWidth;
}

const WIDTH_CLASS: Record<PageWidth, string> = {
  standard: '',
  feed: 'page--feed',
  wide: 'page--wide',
  full: 'page--full',
};

/**
 * The one shared page container. Gives every page the same width, gutters and
 * top/bottom rhythm so the app stops feeling stitched together. Pairs with
 * <PageHeader/>. Styles live in styles/app-shell.css.
 *
 *   <PageShell width="wide">
 *     <PageHeader title="Badges" eyebrow="Achievements" />
 *     …
 *   </PageShell>
 */
export function PageShell({ width = 'standard', className, children, ...props }: PageShellProps) {
  return (
    <div className={cn('page', WIDTH_CLASS[width], className)} {...props}>
      {children}
    </div>
  );
}
