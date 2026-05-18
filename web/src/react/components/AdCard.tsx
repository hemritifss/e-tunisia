import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';

interface AdItem {
  id: string;
  adId: string;
  title: string;
  body: string;
  cta: string;
  ctaUrl?: string | null;
  images: string[];
  sponsor: string;
}

export function AdCard({ ad }: { ad: AdItem }) {
  const open = () => {
    if (ad.ctaUrl) window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className="border-brand/30">
        <CardContent className="p-0">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-brand">
              Sponsored
            </span>
            <span className="text-xs text-muted-foreground">{ad.sponsor}</span>
          </div>
          {ad.images?.[0] && (
            <button onClick={open} className="block w-full cursor-pointer">
              <img
                src={ad.images[0]}
                alt={ad.title}
                className="w-full max-h-72 object-cover"
                loading="lazy"
              />
            </button>
          )}
          <div className="p-4">
            <h3 className="text-base font-semibold mb-1">{ad.title}</h3>
            {ad.body && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{ad.body}</p>
            )}
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ExternalLink size={14} />}
              onClick={open}
              disabled={!ad.ctaUrl}
            >
              {ad.cta || 'Learn More'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
