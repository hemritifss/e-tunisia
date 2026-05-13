import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  Shield,
  Star,
  MapPin,
} from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { api } from '../../shared/api';
import { useUIStore } from '../stores/ui-store';

interface BookingFlowProps {
  placeId: string;
  placeName: string;
  placeImage?: string;
  placeRating?: number;
  placeLocation?: string;
  pricePerNight?: number;
  currency?: string;
  onClose?: () => void;
}

type Step = 'dates' | 'guests' | 'addons' | 'payment' | 'confirmation';

export default function BookingFlow({
  placeId,
  placeName,
  placeImage,
  placeRating,
  placeLocation,
  pricePerNight = 100,
  currency = 'TND',
  onClose,
}: BookingFlowProps) {
  const [step, setStep] = useState<Step>('dates');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const showToast = useUIStore((s) => s.showToast);

  const addons = [
    { id: 'guide', name: 'Local Guide', price: 50, description: '2-hour guided tour' },
    { id: 'meal', name: 'Traditional Meal', price: 30, description: 'Authentic Tunisian lunch' },
    { id: 'transfer', name: 'Airport Transfer', price: 40, description: 'Private car pickup' },
    { id: 'photo', name: 'Photo Package', price: 25, description: 'Professional photoshoot' },
  ];

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const addonTotal = selectedAddons.reduce((sum, id) => {
    const addon = addons.find((a) => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const subtotal = pricePerNight * nights * guests;
  const platformFee = Math.round(subtotal * 0.12 * 100) / 100;
  const tax = Math.round(subtotal * 0.07 * 100) / 100;
  const total = subtotal + platformFee + tax + addonTotal;

  const bookingMutation = useMutation({
    mutationFn: async () => {
      return api.createBooking?.(placeId, {
        checkIn,
        checkOut,
        guests,
        addons: selectedAddons.map((id) => {
          const addon = addons.find((a) => a.id === id)!;
          return { name: addon.name, price: addon.price, quantity: 1 };
        }),
      });
    },
    onSuccess: () => {
      setStep('confirmation');
      showToast('Booking confirmed!', 'success');
    },
    onError: () => {
      showToast('Booking failed. Please try again.', 'error');
    },
  });

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'dates', label: 'Dates', icon: <Calendar size={16} /> },
    { id: 'guests', label: 'Guests', icon: <Users size={16} /> },
    { id: 'addons', label: 'Add-ons', icon: <Star size={16} /> },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={16} /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const canProceed = () => {
    switch (step) {
      case 'dates':
        return checkIn && checkOut && nights > 0;
      case 'guests':
        return guests > 0;
      case 'addons':
        return true;
      case 'payment':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextSteps: Record<Step, Step | null> = {
      dates: 'guests',
      guests: 'addons',
      addons: 'payment',
      payment: null,
      confirmation: null,
    };
    const next = nextSteps[step];
    if (next) setStep(next);
    else if (step === 'payment') bookingMutation.mutate();
  };

  const handleBack = () => {
    const prevSteps: Record<Step, Step | null> = {
      dates: null,
      guests: 'dates',
      addons: 'guests',
      payment: 'addons',
      confirmation: null,
    };
    const prev = prevSteps[step];
    if (prev) setStep(prev);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {placeImage && (
          <img
            src={placeImage}
            alt={placeName}
            className="w-16 h-16 rounded-xl object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{placeName}</h2>
          {placeLocation && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={14} />
              {placeLocation}
            </div>
          )}
          {placeRating && (
            <div className="flex items-center gap-1 text-sm">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              {placeRating}
            </div>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i <= currentStepIndex
                  ? 'bg-brand text-white'
                  : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
              }`}
            >
              {s.icon}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={14} className="text-muted-foreground" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'dates' && (
          <motion.div
            key="dates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="font-semibold">Select your dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
            {nights > 0 && (
              <div className="p-3 bg-brand/5 rounded-xl text-sm">
                <Clock size={14} className="inline mr-1" />
                {nights} night{nights > 1 ? 's' : ''} selected
              </div>
            )}
          </motion.div>
        )}

        {step === 'guests' && (
          <motion.div
            key="guests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="font-semibold">How many guests?</h3>
            <div className="flex items-center justify-center gap-6 py-8">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-12 h-12 rounded-full bg-surface border border-black/10 dark:border-white/10 flex items-center justify-center text-xl font-medium hover:bg-black/5 transition-colors"
              >
                -
              </button>
              <div className="text-3xl font-bold w-16 text-center">{guests}</div>
              <button
                onClick={() => setGuests(Math.min(20, guests + 1))}
                className="w-12 h-12 rounded-full bg-surface border border-black/10 dark:border-white/10 flex items-center justify-center text-xl font-medium hover:bg-black/5 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {guests} guest{guests > 1 ? 's' : ''} · {pricePerNight} {currency} per person per night
            </p>
          </motion.div>
        )}

        {step === 'addons' && (
          <motion.div
            key="addons"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <h3 className="font-semibold">Enhance your experience</h3>
            {addons.map((addon) => (
              <Card
                key={addon.id}
                variant={selectedAddons.includes(addon.id) ? 'bordered' : 'default'}
                className={`cursor-pointer transition-all ${
                  selectedAddons.includes(addon.id) ? 'border-brand' : ''
                }`}
                onClick={() => {
                  setSelectedAddons((prev) =>
                    prev.includes(addon.id)
                      ? prev.filter((id) => id !== addon.id)
                      : [...prev, addon.id],
                  );
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedAddons.includes(addon.id)
                        ? 'bg-brand border-brand'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedAddons.includes(addon.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{addon.name}</div>
                    <div className="text-sm text-muted-foreground">{addon.description}</div>
                  </div>
                  <div className="font-semibold">
                    {addon.price} {currency}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="font-semibold">Price breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>
                  {pricePerNight} {currency} × {nights} night{nights > 1 ? 's' : ''} × {guests} guest
                  {guests > 1 ? 's' : ''}
                </span>
                <span>
                  {subtotal} {currency}
                </span>
              </div>
              {addonTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Add-ons</span>
                  <span>
                    {addonTotal} {currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Platform fee (12%)</span>
                <span>
                  {platformFee} {currency}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tourism tax (7%)</span>
                <span>
                  {tax} {currency}
                </span>
              </div>
              <div className="border-t border-black/10 dark:border-white/10 pt-2 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>
                  {total} {currency}
                </span>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <Shield size={16} />
                <span>Your booking is protected by our cancellation policy</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={bookingMutation.isPending}
                onClick={handleNext}
              >
                <CreditCard size={18} />
                Pay {total} {currency}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You won't be charged yet. Payment will be processed securely.
              </p>
            </div>
          </motion.div>
        )}

        {step === 'confirmation' && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-8"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold">Booking Confirmed!</h3>
            <p className="text-muted-foreground">
              Your reservation at {placeName} is confirmed. Check your email for details.
            </p>
            <div className="p-4 bg-surface rounded-xl text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span>
                  {checkIn} to {checkOut}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span>{guests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total paid</span>
                <span className="font-semibold">
                  {total} {currency}
                </span>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={onClose}>
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      {step !== 'confirmation' && (
        <div className="flex gap-3 mt-6">
          {step !== 'dates' && (
            <Button variant="ghost" onClick={handleBack} leftIcon={<ChevronLeft size={16} />}>
              Back
            </Button>
          )}
          {step !== 'payment' && (
            <Button
              variant="primary"
              className="flex-1"
              disabled={!canProceed()}
              onClick={handleNext}
              rightIcon={<ChevronRight size={16} />}
            >
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
