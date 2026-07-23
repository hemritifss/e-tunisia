import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface PageHeaderProps {
  /** The page title — announces "you are here". Rendered in the editorial serif. */
  title: React.ReactNode;
  /** Small uppercase kicker above the title (section / category). */
  eyebrow?: React.ReactNode;
  /** One-line description under the title. */
  subtitle?: React.ReactNode;
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode;
  /**
   * Show an inline back control. Pass a handler, or `true` to default to
   * browser back. Complements the global mobile nav-back button.
   */
  onBack?: (() => void) | true;
  backLabel?: string;
  className?: string;
}

/**
 * Consistent page header used across the app so every screen announces itself
 * the same way (eyebrow · serif title · subtitle · actions). Styles live in
 * styles/app-shell.css. Pair with <PageShell/>.
 */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  onBack,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  const handleBack = () => {
    if (onBack === true || onBack === undefined) window.history.back();
    else onBack();
  };

  return (
    <header className={cn('page-head', className)}>
      <div className="page-head__main">
        {onBack && (
          <button type="button" className="page-back-inline" onClick={handleBack}>
            <ArrowLeft size={16} aria-hidden />
            {backLabel}
          </button>
        )}
        {eyebrow && <div className="page-head__eyebrow">{eyebrow}</div>}
        <h1 className="page-head__title">{title}</h1>
        {subtitle && <p className="page-head__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}
