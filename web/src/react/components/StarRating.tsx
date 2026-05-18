import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export const StarRating = ({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onRate,
  className,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = React.useState(0);
  // Postgres `decimal` columns deserialize as strings — coerce defensively.
  const numericRating = typeof rating === 'number' ? rating : Number(rating) || 0;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating || numericRating) >= starValue;
        const isHalf = !isFilled && (hoverRating || numericRating) >= starValue - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              'transition-transform duration-150',
              interactive && 'cursor-pointer hover:scale-110',
            )}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onRate?.(starValue)}
          >
            <Star
              size={size}
              className={cn(
                'transition-colors duration-150',
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : isHalf
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-transparent text-gray-300 dark:text-gray-600',
              )}
            />
          </button>
        );
      })}
      {numericRating > 0 && (
        <span className="ml-1 text-sm font-medium text-foreground/70">
          {numericRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
