import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Compass,
  Loader2,
  Download,
  Share2,
  Check,
  Clock,
  Utensils,
  Car,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { api } from '../../shared/api';
import { useUIStore } from '../stores/ui-store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  itinerary?: any;
}

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  places: Array<{
    id: string;
    name: string;
    description: string;
    duration: string;
    price?: number;
    image?: string;
  }>;
  meals: string[];
  transport: string;
  estimatedCost: number;
}

export default function AITravelPlanner() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Welcome to e-Tunisia AI Planner! I'm your personal travel concierge for discovering hidden Tunisia.\n\nTell me what you're looking for — "Plan a 5-day adventure for 2 people with a budget of 800 TND" or just ask me anything about Tunisia!`,
      suggestions: ['Plan a 5-day trip', 'Best hidden beaches?', 'Food tour in Tunis?', 'Sahara desert experience?'],
    },
  ]);
  const [input, setInput] = useState('');
  const [showPlanner, setShowPlanner] = useState(false);
  const [plannerPrefs, setPlannerPrefs] = useState({
    duration: 3,
    budget: 500,
    travelers: 2,
    interests: [] as string[],
    travelStyle: 'balanced',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showToast = useUIStore((s) => s.showToast);

  const interestOptions = [
    { id: 'culture', label: 'Culture & History', icon: '🏛️' },
    { id: 'food', label: 'Food & Drink', icon: '🍽️' },
    { id: 'nature', label: 'Nature & Outdoors', icon: '🌿' },
    { id: 'beaches', label: 'Beaches', icon: '🏖️' },
    { id: 'adventure', label: 'Adventure', icon: '🏔️' },
    { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
  ];

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const chatMessages = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      chatMessages.push({ role: 'user' as const, content: userMessage });

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages }),
      });
      return res.json();
    },
  });

  const itineraryMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('etunisia_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/ai/itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(plannerPrefs),
      });
      return res.json();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const data = await chatMutation.mutateAsync(input);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.data?.reply || 'I\'m thinking about that...',
        suggestions: data.suggestions || data.data?.suggestions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting right now. Try again in a moment!',
        },
      ]);
    }
  };

  const handleGenerateItinerary = async () => {
    try {
      const data = await itineraryMutation.mutateAsync();
      const itinerary = data.data || data;

      const msg: Message = {
        id: `itinerary-${Date.now()}`,
        role: 'assistant',
        content: `✨ I've created your personalized **${itinerary.duration}-day Tunisia adventure**!\n\n**${itinerary.title}**\n${itinerary.description}\n\n💰 Estimated total: **${itinerary.totalEstimatedCost} ${itinerary.currency}**`,
        itinerary,
      };

      setMessages((prev) => [...prev, msg]);
      setShowPlanner(false);
      showToast('Itinerary generated!', 'success');
    } catch {
      showToast('Failed to generate itinerary', 'error');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-mediterranean flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-semibold">AI Travel Planner</h1>
          <p className="text-xs text-muted-foreground">Powered by GPT-4o</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="ml-auto"
          leftIcon={<Compass size={14} />}
          onClick={() => setShowPlanner(!showPlanner)}
        >
          Plan Trip
        </Button>
      </div>

      {/* Trip Planner Panel */}
      <AnimatePresence>
        {showPlanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-black/5 dark:border-white/5"
          >
            <div className="p-4 space-y-4 bg-surface-elevated">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={plannerPrefs.duration}
                      onChange={(e) => setPlannerPrefs({ ...plannerPrefs, duration: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-surface text-sm"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Budget</label>
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-muted-foreground" />
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={plannerPrefs.budget}
                      onChange={(e) => setPlannerPrefs({ ...plannerPrefs, budget: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-surface text-sm"
                    />
                    <span className="text-sm text-muted-foreground">TND</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Travelers</label>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={plannerPrefs.travelers}
                      onChange={(e) => setPlannerPrefs({ ...plannerPrefs, travelers: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-surface text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => {
                        setPlannerPrefs((prev) => ({
                          ...prev,
                          interests: prev.interests.includes(interest.id)
                            ? prev.interests.filter((i) => i !== interest.id)
                            : [...prev.interests, interest.id],
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        plannerPrefs.interests.includes(interest.id)
                          ? 'bg-brand text-white'
                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
                      }`}
                    >
                      {interest.icon} {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                isLoading={itineraryMutation.isPending}
                leftIcon={<Sparkles size={16} />}
                onClick={handleGenerateItinerary}
              >
                Generate My Itinerary
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-brand/10 text-brand'
                  : 'bg-mediterranean/10 text-mediterranean'
              }`}
            >
              {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div
                className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-surface-elevated border border-black/5 dark:border-white/5'
                    : 'bg-brand text-white'
                }`}
              >
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1' : ''}>
                    {line}
                  </p>
                ))}
              </div>

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 text-xs rounded-full bg-black/5 dark:bg-white/5 hover:bg-brand/10 hover:text-brand transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Itinerary Card */}
              {msg.itinerary && (
                <div className="mt-3 space-y-3">
                  {msg.itinerary.days?.map((day: ItineraryDay) => (
                    <Card key={day.day} variant="elevated" className="text-left">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center font-bold">
                            {day.day}
                          </span>
                          <h4 className="font-medium text-sm">{day.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{day.description}</p>
                        <div className="space-y-2">
                          {day.places?.map((place: any) => (
                            <div key={place.id} className="flex items-start gap-2 text-sm">
                              <MapPin size={14} className="text-brand mt-0.5 shrink-0" />
                              <div>
                                <span className="font-medium">{place.name}</span>
                                <span className="text-muted-foreground"> — {place.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Utensils size={12} />
                            {day.meals?.length} meals
                          </span>
                          <span className="flex items-center gap-1">
                            <Car size={12} />
                            {day.transport}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet size={12} />
                            {day.estimatedCost} TND
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Tips */}
                  {msg.itinerary.tips?.length > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                      <h5 className="text-sm font-medium mb-2">💡 Pro Tips</h5>
                      <ul className="space-y-1">
                        {msg.itinerary.tips.map((tip: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Check size={12} className="mt-1 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Download size={14} />}>
                      Download PDF
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={<Share2 size={14} />}>
                      Share
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-black/5 dark:border-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about Tunisia or plan your trip..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 text-sm"
          />
          <Button
            variant="primary"
            size="icon"
            disabled={!input.trim() || chatMutation.isPending}
            onClick={handleSend}
          >
            {chatMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
