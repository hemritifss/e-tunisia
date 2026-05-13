import React from 'react';
import { cn } from '../lib/utils';

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away';
}

export const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ size = 'md', fallback, status, className, src, alt, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-[10px]',
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-14 h-14 text-base',
      xl: 'w-20 h-20 text-lg',
    };

    const [error, setError] = React.useState(false);
    const initials = fallback
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className={cn('relative inline-flex', sizes[size], className)}>
        {src && !error ? (
          <img
            ref={ref}
            src={src}
            alt={alt || fallback || 'Avatar'}
            className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
            onError={() => setError(true)}
            {...props}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold ring-2 ring-white dark:ring-gray-800">
            {initials || '?'}
          </div>
        )}
        {status && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
              status === 'online' && 'bg-green-500',
              status === 'offline' && 'bg-gray-400',
              status === 'away' && 'bg-yellow-500',
            )}
          />
        )}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';
