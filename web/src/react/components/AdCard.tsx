import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { goTo } from '../../router';

interface AdItem {
  id: string;
  adId: string;
  title: string;
  body: string;
  cta: string;
  ctaUrl?: string | null;
  images: string[];
  sponsor: string;
  /** True for e-Tunisia's own promos — labeled "e-Tunisia", navigated in-app. */
  isHouse?: boolean;
}

export function AdCard({ ad }: { ad: AdItem }) {
  // Internal (house) CTAs navigate within the SPA; external partner links open a tab.
  const isInternal = !!ad.ctaUrl && !/^https?:\/\//i.test(ad.ctaUrl);
  const open = () => {
    if (!ad.ctaUrl) return;
    if (isInternal) goTo(ad.ctaUrl);
    else window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
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
              {ad.isHouse ? 'From e-Tunisia' : 'Sponsored'}
            </span>
            {!ad.isHouse && <span className="text-xs text-muted-foreground">{ad.sponsor}</span>}
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
              rightIcon={isInternal ? <ArrowRight size={14} /> : <ExternalLink size={14} />}
              onClick={open}
              disabled={!ad.ctaUrl}
            >
              {ad.cta || (ad.isHouse ? 'Open' : 'Learn More')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
