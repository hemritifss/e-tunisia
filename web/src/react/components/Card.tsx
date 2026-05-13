import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = false, className, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface shadow-sm',
      elevated: 'bg-surface-elevated shadow-lg',
      bordered: 'bg-surface border border-black/10 dark:border-white/10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl overflow-hidden transition-all duration-200',
          variants[variant],
          hover && 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export const CardImage = ({
  src,
  alt,
  className,
  aspect = 'video',
}: {
  src: string;
  alt: string;
  className?: string;
  aspect?: 'video' | 'square' | 'portrait' | 'wide';
}) => {
  const aspects = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
  };

  return (
    <div className={cn('relative overflow-hidden', aspects[aspect], className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );
};

export const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('p-4', className)}>{children}</div>
);

export const CardHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn('p-4 pb-0', className)}>{children}</div>;

export const CardFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('p-4 pt-0 flex items-center gap-2', className)}>
    {children}
  </div>
);
